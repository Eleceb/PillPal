import { 
  StyleSheet, 
  View, 
  Image, 
  SafeAreaView, 
  Text,
  Modal, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
  Platform
} from 'react-native';
import React, { createContext, useEffect, useState, useContext } from 'react';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import { firestore, storage } from './FirebaseConfig';
import { collection, doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { addDays, addWeeks, addMonths, endOfMonth, getDaysInMonth } from 'date-fns';
import moment from 'moment-timezone';

const GlobalContext = createContext();

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

export const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameText, setUsernameText] = useState('');
  const [medicines, setMedicines] = useState(null);
  const [medicineDates, setMedicineDates] = useState(null);
  const [isTakenToday, setIsTakenToday] = useState({});
  const [notificationId, setNotificationId] = useState({});
  const [errorModalMsg, setErrorModalMsg] = useState({});
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async() => {
      try {
        const userLoggedIn = await AsyncStorage.getItem('isLoggedIn');

        if (userLoggedIn && JSON.parse(userLoggedIn) !== false) {
          setIsLoggedIn(JSON.parse(userLoggedIn));
        }

        if (isLoggedIn) {
          const username = await AsyncStorage.getItem('username') || usernameText;
          setUsernameText(username);

          await registerForPushNotificationsAsync();

          const currentLocalDate = new Date().toLocaleDateString();
          const savedDate = await AsyncStorage.getItem('savedDate');
          if (savedDate && currentLocalDate !== savedDate) {
            await AsyncStorage.setItem('savedDate', String(currentLocalDate));
            await AsyncStorage.setItem('isTakenToday', JSON.stringify({}))
          } else if (!savedDate) {
            await AsyncStorage.setItem('savedDate', String(currentLocalDate));
          }

          const isTakenTodayValue = await AsyncStorage.getItem('isTakenToday');
          setIsTakenToday(isTakenTodayValue ? JSON.parse(isTakenTodayValue) : {});

          const notificationIdValue = await AsyncStorage.getItem('notificationId');
          setNotificationId(notificationIdValue ? JSON.parse(notificationIdValue) : {});

          const medicinesData = await getDoc(doc(collection(firestore, username), 'Medicines'));
          if (medicinesData.exists()) {
            const newMedicinesData = Object.entries(medicinesData.data())
              .sort(([keyA, medicineA], [keyB, medicineB]) => {
                // Compare Time
                const timeA = new Date(medicineA.time);
                const timeB = new Date(medicineB.time);
                const timeComparison = 
                  new Date().setHours(timeA.getHours(), timeA.getMinutes(), 0, 0) - 
                  new Date().setHours(timeB.getHours(), timeB.getMinutes(), 0, 0);
                if (timeComparison !== 0) return timeComparison;

                // Compare Name
                const nameComparison = medicineA.medicine.localeCompare(medicineB.medicine);
                if (nameComparison !== 0) return nameComparison;

                // Compare Key
                return keyA.localeCompare(keyB);
              })
              .reduce((accumulator, [key, value]) => {
                accumulator[key] = value;
                return accumulator;
              }, {});

            for (let i in newMedicinesData) {
              if (newMedicinesData[i].image) {
                newMedicinesData[i].image = await getDownloadURL(ref(storage, newMedicinesData[i].image));
              }
            }
            
            setMedicines(newMedicinesData);
          } else {
            setErrorModalMsg({
              'title': 'Error', 
              'description': 'Medicines document does not exist.'
            });
            setErrorModalVisible(!errorModalVisible);
          }
        }

        setIsLoading(false);
      } catch (error) {
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
        setIsLoading(false);
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    (async () => {
      try {
        if (medicines) {
          const newMedicineDates = {};

          const { status: existingStatus } = await Notifications.getPermissionsAsync();

          const identifiers = existingStatus === 'granted' && 
            (await Notifications.getAllScheduledNotificationsAsync())
              .map(notification => notification.identifier);

          for (let i in medicines) {
            if (!medicineDates || !medicineDates[i]) {
              newMedicineDates[i] = getEventDatesInMonth(
                new Date(medicines[i].startDate),
                new Date(medicines[i].endDate),
                medicines[i].noEndDate,
                medicines[i].frequency,
                medicines[i].custom,
              );
            } else if (medicineDates[i]) {
              newMedicineDates[i] = medicineDates[i];
            }
            
            // If notification permission is granted, start scheduling or canceling notifications of all medicines
            if (existingStatus === 'granted') {
              const medicineTime = new Date(medicines[i].time);

              const medicineEndTime = new Date(medicines[i].endDate);
              medicineEndTime.setHours(
                medicineTime.getHours(), 
                medicineTime.getMinutes(), 
                0, 0
              );

              const currentTime = new Date();
              currentTime.setSeconds(0, 0);

              const isEndTimePassed = !medicines[i].noEndDate && currentTime >= medicineEndTime;

              // If end time of this medicine is not passed and it has no notification id saved or no notification is scheduled
              if (!isEndTimePassed && (!notificationId[i] || !identifiers.includes(notificationId[i])) && !isTakenToday[i]) {
                scheduleNotification(
                  i, 
                  medicines[i], 
                  newMedicineDates[i], 
                  medicineTime,
                  medicineEndTime, 
                  currentTime,
                  false
                );
              // If end time of this medicine is passed and it has notification id saved and notification is scheduled
              } else if (isEndTimePassed && notificationId[i] && identifiers.includes(notificationId[i])) {
                await Notifications.cancelScheduledNotificationAsync(notificationId[i]);

                await setNotificationId(() => {
                  const { [i]: _, ...rest } = notificationId;
          
                  AsyncStorage.setItem('notificationId', JSON.stringify(rest));
          
                  return rest;
                });
              }
            }
          }

          setMedicineDates(newMedicineDates);

          if (existingStatus !== 'granted') {
            setErrorModalMsg({
              'title': 'Permission Denied', 
              'description': 'Permission to receive notifications was denied. Please go to settings to enable it.'
            });
            setErrorModalVisible(!errorModalVisible);
          }
        }
      } catch (error) {
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
      }
    })();
  }, [medicines]);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    } else {
      finalStatus = existingStatus;
    }

    if (finalStatus !== 'granted') {
      return;
    }
  };

  const scheduleNotification = async (medicineId, medicineInfo, eventDates, medicineTime, medicineEndTime, currentTime, takenReschedule) => {
    try {
      let eventTime;
      let secondEventTime;
      let trigger;

      const medicineStartTime = new Date(medicineInfo.startDate);
      medicineStartTime.setHours(
        medicineTime.getHours(), 
        medicineTime.getMinutes(), 
        0, 0
      );

      let closestTwoEventDates = [];
      let index = 0;

      while (closestTwoEventDates.length < 2 && index < eventDates.length) {
        let checkEventDate = new Date(eventDates[index]);

        checkEventDate.setHours(
          medicineTime.getHours(), 
          medicineTime.getMinutes(), 
          0, 0
        );

        if (checkEventDate > currentTime) {
          closestTwoEventDates.push(checkEventDate);

          if (closestTwoEventDates.length != 2 && index == eventDates.length - 1) {
            closestTwoEventDates.push(new Date(undefined));
          }
        } else if (closestTwoEventDates.length == 0 && index == eventDates.length - 1) {
          closestTwoEventDates = [new Date(undefined), new Date(undefined)];
        }
        index++;
      }

      if (medicineInfo.noEndDate || closestTwoEventDates[0] <= medicineEndTime) {
        eventTime = closestTwoEventDates[0];
      } else {
        eventTime = null;
      }

      if (medicineInfo.noEndDate || closestTwoEventDates[1] <= medicineEndTime) {
        secondEventTime = closestTwoEventDates[1];
      } else {
        secondEventTime = null;
      }

      if (!takenReschedule) {
        // Must have at least two event dates to have repeated notification
        trigger = eventTime && secondEventTime ? (
            currentTime.getDate() == medicineStartTime.getDate() || 
            currentTime >= medicineStartTime
          ) && (
            medicineInfo.frequency === 'daily' || 
            (medicineInfo.frequency === 'custom' && medicineInfo.custom == 1)
          ) ? {
            // If today is the start date or today is later than the start time
            // Schedule daily if frequency is daily or custom repetition is 1
            channelId: 'medicineNotification',
            hour: medicineTime.getHours(), 
            minute: medicineTime.getMinutes(),
            repeats: true,
          } : medicineInfo.frequency === 'weekly' || 
          (medicineInfo.frequency === 'custom' && medicineInfo.custom == 7) ? {
            // Schedule weekly if frequency is weekly or custom repetition is 7
            channelId: 'medicineNotification',
            weekday: medicineStartTime.getDay() + 1,
            hour: medicineTime.getHours(),
            minute: medicineTime.getMinutes(),
            repeats: true, 
          } : medicineInfo.frequency === 'monthly' && Platform.OS === 'ios' ? {
            // Schedule monthly if frequency is monthly and platform is IOS
            channelId: 'medicineNotification',
            day: medicineStartTime.getDate(),
            hour: medicineTime.getHours(),
            minute: medicineTime.getMinutes(),
            repeats: true, 
          } : {
            // Schedule on the next event date once if frequency is daily and start date is later than today,
            // is monthly and platform is not IOS, and is custom and custom repetition is not 1 or 7
            channelId: 'medicineNotification',
            date: eventTime,
          }
        : eventTime ? {
          // If only has one event date, schedule on the next event date once
          channelId: 'medicineNotification',
          date: eventTime,
        // No schedule if there is no event date
        } : null;
      } else {
        trigger = secondEventTime ? {
          channelId: 'medicineNotification',
          date: secondEventTime,
        } : null
      }

      const id = trigger && await Notifications.scheduleNotificationAsync({
        content: {
          title: `${medicineInfo.medicine}`,
          body: "It's time to take this medicine!",
        },
        trigger: trigger
      });

      await setNotificationId(prevDict => {
        const newDict = {...prevDict};
        newDict[medicineId] = id;

        AsyncStorage.setItem('notificationId', JSON.stringify(newDict))

        return newDict;
      });
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const getEventDatesInMonth = (startDate, endDate, noEndDate, frequency, custom) => {
    let eventDate = moment(startDate).tz(moment.tz.guess()).startOf('day');
    let eventEndDate = moment(endDate).tz(moment.tz.guess()).startOf('day');
    const eventDates = [];
    let iterationCount = 0;
    const maxIterations = 2000;
  
    while (eventDate <= eventEndDate || noEndDate) {
      eventDates.push(moment(eventDate).tz(moment.tz.guess()).format('YYYY-MM-DD'));
      iterationCount++;
  
      switch (frequency) {
        case 'daily':
          eventDate = addDays(eventDate, 1);
          break;
        case 'weekly':
          eventDate = addWeeks(eventDate, 1);
          break;
        case 'monthly':
          eventDate = addMonths(eventDate, 1);
          const daysInMonth = getDaysInMonth(eventDate);
          const desiredDate = startDate.getDate();
          
          if (eventDate.getDate() < desiredDate) {
            if (daysInMonth >= desiredDate) {
              eventDate.setDate(desiredDate);
            } else if (daysInMonth < desiredDate) {
              eventDate = endOfMonth(eventDate);
            }
          }

          break;
        case 'custom':
          eventDate = addDays(eventDate, custom);
          break;
        default:
          return;
      }
  
      if (iterationCount >= maxIterations) {
        break;
      }
    }
  
    return eventDates;
  };

  const ErrorModal = () => {
    return (
      <Modal 
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setErrorModalVisible(!errorModalVisible)}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          onPress={() => setErrorModalVisible(!errorModalVisible)} 
          activeOpacity={1}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              <Text style={styles.modalTitleText}>{errorModalMsg.title}</Text>
              <Text style={styles.modalDescriptionText}>{errorModalMsg.description}</Text>
              <View style={[
                styles.modalButtonContainer, 
                errorModalMsg.title !== "Permission Denied" && {justifyContent: "flex-end"}
              ]}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    errorModalMsg.title === "Permission Denied" && styles.cancelButton
                  ]} 
                  activeOpacity={0.8}
                  onPress={() => setErrorModalVisible(!errorModalVisible)}
                >
                  <Text style={styles.modalButtonText}>{errorModalMsg.title === "Permission Denied" ? "Cancel" : "Close"}</Text>
                </TouchableOpacity>
                {errorModalMsg.title === "Permission Denied" && (
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.settingsButton]} 
                    activeOpacity={0.8}
                    onPress={Linking.openSettings}
                  >
                    <Text style={styles.modalButtonText}>Settings</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeView}>
          <Image 
            style={styles.loadingImage}
            source={require("./assets/loading.gif")}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <GlobalContext.Provider value={{
      isLoggedIn, setIsLoggedIn,
      usernameText, setUsernameText,
      medicines, setMedicines,
      medicineDates, setMedicineDates,
      isTakenToday, setIsTakenToday,
      notificationId, setNotificationId,
      errorModalVisible, setErrorModalVisible,
      setErrorModalMsg,
      setIsLoading,
      scheduleNotification
    }}>
      {children}
      <ErrorModal />
    </GlobalContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingImage: {
    height: RFValue(30),
    aspectRatio: 475 / 480,
    resizeMode: 'stretch',
    alignSelf: 'center',
  },
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: aspectRatio > 1.6 ? '90%' : '70%',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: RFValue(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitleText: {
    fontSize: RFValue(19),
    fontWeight: '500',
  },
  modalDescriptionText: {
    marginTop: RFValue(10),
    fontSize: RFValue(15),
  },
  modalButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    marginTop: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButton: {
    backgroundColor: '#00adf8',
    width: '32%',
    height: RFValue(40),
    borderRadius: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: '35%',
    backgroundColor: '#9e9e9e',
    marginRight: RFValue(10),
  },
  settingsButton: {
    width: '35%',
    marginLeft: RFValue(10),
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: RFValue(15),
    color: 'white',
  },
});

export const useGlobalContext = () => useContext(GlobalContext);