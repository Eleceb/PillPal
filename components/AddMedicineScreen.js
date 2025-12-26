import { 
  StyleSheet, 
  Text, 
  View,
  ScrollView,
  Button,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  BackHandler
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import CheckBox from 'expo-checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGlobalContext } from '../GlobalContext';
import uuid from 'react-native-uuid';
import { firestore, storage } from '../FirebaseConfig';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes } from "firebase/storage";
import AntDesign from '@expo/vector-icons/AntDesign';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const Picker = (props) => {
  return (
    <View>
      {!(Platform.OS === "ios" && props.showPicker) && (
        <View style={styles.dateTimePickerContainer}>
          <TouchableOpacity 
            style={[
              styles.dateTimePickerButton,
              props.disabled && styles.disabled,
              props.errorMsg && styles.inputError
            ]}
            onPress={props.setShowPicker}
            disabled={props.disabled}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.dateTimePickerButtonText}>
                {!props.selected 
                  ? props.placeholder 
                  : props.selectedDateTime + "  "}
              </Text>
              {props.icon === "clock" && (
                <SimpleLineIcons name="clock" size={RFValue(19.5)} color={props.errorMsg && "red"} />
              )}
              {props.icon === "calendar" && (
                <Image 
                  style={[styles.image, props.errorMsg && {tintColor: 'red'}]}
                  source={require("../assets/calendar.png")}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
      {props.showPicker && (
        <View>
          <DateTimePicker
            style={styles.dateTimePicker}
            value={props.value}
            mode={props.mode}
            is24Hour={true}
            display={
              Platform.OS === "ios" 
                ? "spinner" 
                : props.mode === "date" 
                  ? "calendar" 
                  : "clock"
            }
            onChange={props.onChange(props.type)}
          />
          {Platform.OS === "ios" && (
            <View style={styles.iosDateTimePickerButtonContainer}>
              <Button title="Cancel" onPress={() => props.iosOnChange("Cancel", null, props.type)} />
              <Button title="Confirm" onPress={() => props.iosOnChange("Confirm", props.iosValue, props.type)} />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default function AddMedicineScreen({ navigation, route }) {
  const {
    usernameText, 
    medicines, setMedicines, 
    medicineDates, setMedicineDates,
    notificationId, setNotificationId,
    isTakenToday, setIsTakenToday,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible
  } = useGlobalContext();

  const firestoreRef = collection(firestore, usernameText);

  const [errorMsg, setErrorMsg] = React.useState({});
  const [medicineId, setMedicineId] = useState(route.params.id);
  const [medicineInfo, setMedicineInfo] = useState(
    !medicineId ? {
      'medicine': '',
      'time': new Date(),
      'timeSelected': false,
      'frequency': '',
      'custom': '',
      'startDate': new Date(),
      'startDateSelected': false,
      'endDate': new Date(),
      'endDateSelected': false,
      'noEndDate': false,
      'image': null,
    } : {
      'medicine': medicines[medicineId].medicine,
      'time': new Date(medicines[medicineId].time),
      'timeSelected': true,
      'frequency': medicines[medicineId].frequency,
      'custom': medicines[medicineId].custom.toString(),
      'startDate': new Date(medicines[medicineId].startDate),
      'startDateSelected': true,
      'endDate': !medicines[medicineId].noEndDate ? new Date(medicines[medicineId].endDate) : new Date(),
      'endDateSelected': !medicines[medicineId].noEndDate,
      'noEndDate': medicines[medicineId].noEndDate,
      'image': medicines[medicineId].image,
    }
  );
  const [previousMedicineInfo, setPreviousMedicineInfo] = useState(medicineId && medicineInfo);
  const [iosTime, setIosTime] = useState(new Date());
  const [iosStartDate, setIosStartDate] = useState(new Date());
  const [iosEndDate, setIosEndDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (navigation.isFocused()) {
      navigation.setParams({ isLoading: isLoading });
    }

    const backAction = () => {
      if (isLoading) {
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isLoading, navigation]);

  const sortMedicines = (newMedicines) => {
    return Object.entries(newMedicines)
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
  };

  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
       const xhr = new XMLHttpRequest();
       xhr.onload = function () {
         resolve(xhr.response)
       };
       xhr.onerror = function () {
         reject(new Error('uriToBlob failed'))
       };
       xhr.responseType = 'blob';
       xhr.open('GET', uri, true);
   
       xhr.send(null);
    });
  };

  const uploadFile = async (id, storageUri, imageUri) => {
    try {
      const imageRef = ref(storage, storageUri);

      const image = await uriToBlob(imageUri);

      await uploadBytes(imageRef, image).then(snapshot => {
        console.log('Uploaded a blob or file!');
      });
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  }

  const createDateTimeChangeHandler = (type) => (event, selectedDate) => {
    handleDateTimeChange(event, selectedDate, type);
  };

  const handleDateTimeChange = (event, selectedData, type) => {
    try {
      if (type === 'time') {
        const currentTime = selectedData || medicineInfo.time;
        setShowTimePicker(Platform.OS === 'ios');
        if (Platform.OS === 'ios') {
          setIosTime(currentTime);
        } else if (Platform.OS === 'android' && event.type === 'set') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'time': currentTime,
            'timeSelected': true
          }));

          if (errorMsg.time) {
            setErrorMsg({
              ...errorMsg,
              'time': null
            });
          }
        } else {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'time': currentTime
          }));
        }
      } else if (type === 'startDate') {
        const currentDate = selectedData || medicineInfo.startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        if (Platform.OS === 'ios') {
          setIosStartDate(currentDate);
        } else if (Platform.OS === 'android' && event.type === 'set') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'startDate': currentDate,
            'startDateSelected': true
          }));

          if (errorMsg.startDate) {
            setErrorMsg({
              ...errorMsg,
              'startDate': null
            });
          }
        } else {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'startDate': currentDate
          }));
        }
      } else if (type === 'endDate') {
        const currentDate = selectedData || medicineInfo.endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        if (Platform.OS === 'ios') {
          setIosEndDate(currentDate);
        } else if (Platform.OS === 'android' && event.type === 'set') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'endDate': currentDate,
            'endDateSelected': true
          }));

          if (errorMsg.endDate) {
            setErrorMsg({
              ...errorMsg,
              'endDate': null
            });
          }
        } else {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'endDate': currentDate
          }));
        }
      }
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const iosDateTimeChange = (event, selectedData, type) => {
    try {
      if (type === 'time') {
        setShowTimePicker(false);
        if (event === 'Confirm') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'time': selectedData,
            'timeSelected': true
          }));

          if (errorMsg.time) {
            setErrorMsg({
              ...errorMsg,
              'time': null
            });
          }
        }
      } else if (type === 'startDate') {
        setShowStartDatePicker(false);
        if (event === 'Confirm') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'startDate': selectedData,
            'startDateSelected': true
          }));

          if (errorMsg.startDate) {
            setErrorMsg({
              ...errorMsg,
              'startDate': null
            });
          }
        }
      } else if (type === 'endDate') {
        setShowEndDatePicker(false);
        if (event === 'Confirm') {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'endDate': selectedData,
            'endDateSelected': true
          }));

          if (errorMsg.endDate) {
            setErrorMsg({
              ...errorMsg,
              'endDate': null
            });
          }
        }
      }
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const Title = (props) => {
    return (
      <View style={props.title == "Name of Medicine" ? styles.titleNameContainer : styles.titleContainer}>
        <Text style={styles.title}>
          {props.title}
          {props.required && (
            <Text style={[styles.title, styles.inputStar]}> *</Text>
          )}
        </Text>
      </View>
    );
  };
  
  const RepeatButton = (props) => {
    return (
      <TouchableOpacity
        style={[styles.button, props.style, 
          medicineInfo.frequency === props.title.toLowerCase() && styles.buttonSelected,
          isLoading && styles.disabled
        ]}
        onPress={() => {
          setMedicineInfo(prevInfo => ({
            ...prevInfo,
            'frequency': props.title.toLowerCase()
          }))

          if (errorMsg.frequency) {
            setErrorMsg({
              ...errorMsg,
              'frequency': null
            });
          }
        }}
        disabled={isLoading}
      >
        <Text style={medicineInfo.frequency === props.title.toLowerCase()
          ? [styles.buttonText, styles.buttonTextSelected] 
          : styles.buttonText}
        >
          {props.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const ErrorMsg = (props) => {
    if (errorMsg[props.name]) {
      return (
        <View style={styles.inputErrorContainer}>
          <Text style={styles.errorText}>⚠ {errorMsg[props.name]}</Text>
        </View>
      );
    }
  };

  const medicineValidation = () => {
    const errors = {};

    setErrorMsg(errors);

    if (
      medicineInfo.medicine === '' || 
      !medicineInfo.timeSelected || 
      medicineInfo.frequency === '' || 
      !medicineInfo.startDateSelected || 
      !medicineInfo.endDateSelected && !medicineInfo.noEndDate ||
      medicineInfo.frequency === 'custom' && medicineInfo.custom === ''
    ) {
      if (medicineInfo.medicine === '') {
        errors['medicine'] = 'You cannot leave the name of medicine empty.';
      }
      if (!medicineInfo.timeSelected) {
        errors['time'] = 'Please select the medication time.';
      }
      if (medicineInfo.frequency === '') {
        errors['frequency'] = 'Please select the repetition frequency.';
      }
      if (!medicineInfo.startDateSelected) {
        errors['startDate'] = 'Please select the medication start date.';
      }
      if (!medicineInfo.endDateSelected && !medicineInfo.noEndDate) {
        errors['endDate'] = 'Please select the medication end date.';
      }
      if (medicineInfo.frequency === 'custom' && medicineInfo.custom === '') {
        errors['frequency'] = 'You cannot leave the custom repetition empty.';
      }
    }

    if (
      medicineInfo.startDateSelected && 
      medicineInfo.endDateSelected && 
      !medicineInfo.noEndDate
    ) {
      if (
        moment(medicineInfo.startDate).tz(moment.tz.guess()).startOf('day') > 
        moment(medicineInfo.endDate).tz(moment.tz.guess()).startOf('day')
      ) {
        errors['endDate'] = 'End date cannot be earlier than start date.';
      }
    }

    if (Object.keys(errors).length !== 0) {
      setErrorMsg(errors);
      return false;
    } else {
      return true;
    }
  };
  
  const addMedicine = async () => {
    try {
      setShowTimePicker(false);
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      setIsLoading(true);

      if (medicineValidation()) {
        let storageUri;
        let id = medicineId || uuid.v4();

        while (!medicineId) {
          if (Object.keys(medicines).includes(id)) {
            id = uuid.v4();
          } else {
            break;
          }
        }

        if (medicineInfo.image) {
          storageUri = `images/${usernameText}/${id}`;
          if (!medicineId || previousMedicineInfo && previousMedicineInfo.image !== medicineInfo.image) {
            uploadFile(id, storageUri, medicineInfo.image);
          }
        }

        await updateDoc(doc(firestoreRef, 'Medicines'), {
          [id]: {
            'medicine': medicineInfo.medicine || 'Medicine',
            'time': medicineInfo.time.toISOString(),
            'frequency': medicineInfo.frequency,
            'custom': medicineInfo.frequency === 'custom' ? parseInt(medicineInfo.custom) : '',
            'startDate': moment(medicineInfo.startDate).toISOString(),
            'endDate': !medicineInfo.noEndDate ? moment(medicineInfo.endDate).toISOString() : null,
            'noEndDate': medicineInfo.noEndDate,
            'image': medicineInfo.image && storageUri,
          }
        });

        if (medicineId) {
          const { [id]: _, ...rest } = medicineDates; 
          await setMedicineDates(rest);

          const { status: existingStatus } = await Notifications.getPermissionsAsync();

          if (existingStatus === 'granted') {
            if (notificationId[id]) {
              await Notifications.cancelScheduledNotificationAsync(notificationId[id]);
            }

            await setIsTakenToday(() => {
              const { [id]: _, ...rest } = isTakenToday;
      
              AsyncStorage.setItem('isTakenToday', JSON.stringify(rest));
      
              return rest;
            });
      
            await setNotificationId(() => {
              const { [id]: _, ...rest } = notificationId;
      
              AsyncStorage.setItem('notificationId', JSON.stringify(rest));
      
              return rest;
            });
          }
        }

        setMedicines(() => {
          return sortMedicines({
            ...medicines,
            [id] : {
              'medicine': medicineInfo.medicine || 'Medicine',
              'time': medicineInfo.time.toISOString(),
              'frequency': medicineInfo.frequency,
              'custom': medicineInfo.frequency === 'custom' ? parseInt(medicineInfo.custom) : '',
              'startDate': moment(medicineInfo.startDate).toISOString(),
              'endDate': !medicineInfo.noEndDate ? moment(medicineInfo.endDate).toISOString() : null,
              'noEndDate': medicineInfo.noEndDate,
              'image': medicineInfo.image,
            }
          });
        });
        
        navigation.goBack();
      }
      setIsLoading(false);
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.scrollContainer}>

        <Title title="Name of Medicine" required={true} />
        <View>
          <TextInput
            style={[
              styles.input, 
              isLoading && styles.disabledText, 
              errorMsg.medicine && styles.inputError
            ]}
            onChangeText={(medicine) => {
              setMedicineInfo(prevInfo => ({
                ...prevInfo,
                "medicine": medicine
              }))

              if (errorMsg.medicine) {
                setErrorMsg({
                  ...errorMsg,
                  "medicine": null
                })
              }
            }}
            value={medicineInfo.medicine}
            placeholder="Enter name of medicine..."
            placeholderTextColor={`rgba(131, 131, 131, ${isLoading ? 0.5 : 1.0})`}
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        <ErrorMsg name="medicine" />

        <Title title="Medication Time" required={true} />
        <Picker 
          mode="time"
          type="time"
          showPicker={showTimePicker}
          setShowPicker={() => setShowTimePicker(true)}
          value={medicineInfo.time}
          iosValue={iosTime}
          placeholder="Select Time  "
          selected={medicineInfo.timeSelected}
          selectedDateTime={medicineInfo.time.toTimeString().split(' ')[0].substring(0, 5)}
          onChange={createDateTimeChangeHandler}
          iosOnChange={iosDateTimeChange}
          icon="clock"
          disabled={isLoading}
          errorMsg={errorMsg.time}
        />
        <ErrorMsg name="time" />

        <Title title="Repeat" required={true} />
        <View style={styles.buttonContainer}>
          <RepeatButton 
            title="Daily"
            style={styles.buttonLeft}
          />

          <RepeatButton 
            title="Weekly"
            style={styles.buttonCenter}
          />

          <RepeatButton 
            title="Monthly"
            style={styles.buttonRight}
          />
        </View>

        <View style={styles.buttonContainer}>
          <RepeatButton 
            title="Custom"
            style={styles.buttonCustom}
          />  
          {medicineInfo.frequency === "custom" && (
            <View style={styles.customContainer}>
              <Text style={styles.customText}>Every  </Text>
              <TextInput
                style={[
                  styles.customInput,
                  errorMsg.frequency === 'You cannot leave the custom repetition empty.' && styles.inputError,
                  isLoading && styles.disabled
                ]}
                keyboardType="numeric"
                maxLength={2}
                onChangeText={(custom) => {
                    setMedicineInfo(prevInfo => ({
                      ...prevInfo,
                      "custom": custom.replace(/[^0-9]/g, '')
                    }));

                    if (errorMsg.frequency) {
                      setErrorMsg({
                        ...errorMsg,
                        'frequency': null
                      });
                    }
                  }
                }
                value={medicineInfo.custom}
                disabled={isLoading}
              />
              <Text style={styles.customText}>  days</Text>
            </View>
          )}
        </View>
        <ErrorMsg name="frequency" />

        <Title title="Start Date" required={true} />
        <Picker 
          mode="date"
          type="startDate"
          showPicker={showStartDatePicker}
          setShowPicker={() => setShowStartDatePicker(true)}
          value={medicineInfo.startDate}
          iosValue={iosStartDate}
          placeholder="Select Date  "
          selected={medicineInfo.startDateSelected}
          selectedDateTime={moment(new Date(medicineInfo.startDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')}
          onChange={createDateTimeChangeHandler}
          iosOnChange={iosDateTimeChange}
          icon="calendar"
          disabled={isLoading}
          errorMsg={errorMsg.startDate}
        />
        <ErrorMsg name="startDate" />

        <Title title="End Date" required={true} />
        <Picker 
          mode="date"
          type="endDate"
          showPicker={showEndDatePicker}
          setShowPicker={() => setShowEndDatePicker(true)}
          value={medicineInfo.endDate}
          iosValue={iosEndDate}
          placeholder="Select Date  "
          selected={medicineInfo.endDateSelected}
          selectedDateTime={moment(new Date(medicineInfo.endDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')}
          onChange={createDateTimeChangeHandler}
          iosOnChange={iosDateTimeChange}
          icon="calendar"
          noEndDate={medicineInfo.noEndDate}
          disabled={isLoading || medicineInfo.noEndDate}
          errorMsg={errorMsg.endDate}
        />
        {!(Platform.OS === "ios" && showEndDatePicker) && (
          <View style={styles.noEndDateContainer}>
            <CheckBox
              style={styles.checkBox}
              disabled={isLoading}
              value={medicineInfo.noEndDate}
              onValueChange={(newValue) => 
                setMedicineInfo(prevInfo => ({
                  ...prevInfo,
                  "noEndDate": newValue
                }))
              }
            />
            <View>
              <TouchableOpacity
                activeOpacity={1.0}
                onPress={() => 
                  setMedicineInfo(prevInfo => ({
                    ...prevInfo,
                    "noEndDate": !prevInfo.noEndDate
                }))}
                disabled={isLoading}
              >
                <Text style={[styles.noEndDateText, isLoading && styles.disabled]}>No end date</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <ErrorMsg name="endDate" />

        <Title title="Upload Image" required={false} />
        <View style={styles.uploadImageContainer}>
          <TouchableOpacity
            style={[
              medicineInfo.image ? styles.uploadedButton : styles.uploadButton, 
              isLoading && styles.disabled
            ]}
            onPress={() => navigation.navigate("Upload Image", {
              setImage: (result) => setMedicineInfo(prevInfo => ({
                ...prevInfo,
                'image': result,
              })),
              image: medicineInfo.image,
            })}
            disabled={isLoading}
          >
            {!medicineInfo.image ? (
              <AntDesign style={styles.plusIcon} name="plus" />
            ) : (
              <Image 
                style={styles.uploadImage}
                source={{
                  uri: medicineInfo.image,
                  cache: 'force-cache'
                }} 
              />
            )}
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.loadingButton]}
          activeOpacity={0.8}
          onPress={addMedicine}
          disabled={isLoading}
        >
          {!isLoading ? (
            <FontAwesome style={styles.saveIcon} name="save" color="white" />
          ) : (
            <Image 
              style={styles.loadingImage}
              source={require("../assets/loading.gif")}
            />
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  scrollContainer: {
    height: '100%',
  },
  safeView: {
    flex: 1,
  },
  titleContainer: {
    paddingTop: '7.5%',
    paddingBottom: RFValue(10),
    width: '87.5%',
    alignSelf: 'center',
  },
  titleNameContainer: {
    paddingTop: '7.5%',
    paddingBottom: RFValue(8),
    width: '87.5%',
    alignSelf: 'center',
  },
  title: {
    fontSize: RFValue(14),
  },
  inputStar: {
    color: 'red',
  },
  input: {
    width: '87.5%',
    borderBottomWidth: RFValue(1),
    borderColor: 'grey',
    textAlign: 'left',
    fontSize: RFValue(16),
    alignSelf: 'center',
  },
  inputErrorContainer: {
    width: '87.5%',
    alignSelf: 'center',
    marginTop: RFValue(10),
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    fontSize: RFValue(12),
    color: 'red',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    height: RFValue(35),
    borderRadius: RFValue(10),
    borderWidth: RFValue(2),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
  },
  buttonLeft: {
    marginLeft: '6.25%',
  },
  buttonCenter: {
    marginLeft: RFValue(10),
    marginRight: RFValue(10),
  },
  buttonRight: {
    marginRight: '6.25%',
  },
  buttonCustom: {
    flex: 0,
    marginLeft: '6.25%',
    marginRight: RFValue(10),
    width: '27.25%',
    marginTop: RFValue(10),
  },
  buttonSelected: {
    borderColor: 'blue',
    backgroundColor: 'dodgerblue',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: RFValue(14),
  },
  buttonTextSelected: {
    color: 'white',
  },
  customContainer: {
    flexDirection: 'row',
    marginTop: RFValue(10),
  },
  customText: {
    fontSize: RFValue(14),
    alignSelf: 'center',
  },
  customInput: {
    width: RFValue(30),
    height: RFValue(30),
    backgroundColor: 'white',
    borderWidth: RFValue(1),
    borderRadius: RFValue(5),
    textAlign: 'center',
    fontSize: RFValue(14),
    alignSelf: 'center',
  },
  saveButton: {
    width: RFValue(60),
    height: RFValue(60),
    borderRadius: RFValue(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00adf8',
  },
  saveButtonContainer: {
    position: 'absolute',
    padding: RFValue(15),
    bottom: Platform.OS === 'ios' ? RFValue(30) : 0,
    right: 0,
  },
  saveIcon: {
    fontSize: RFValue(30),
    alignSelf: 'center',
  },
  dateTimePicker: {
    alignSelf: 'center',
  },
  dateTimePickerContainer: {
    marginLeft: '6.25%',
    alignSelf: 'flex-start', 
  },
  dateTimePickerButton: {
    width: 'auto',
    padding: RFValue(9),
    borderWidth: RFValue(2),
    borderRadius: RFValue(5),
  },
  dateTimePickerButtonText: {
    fontSize: RFValue(15),
  },
  iosDateTimePickerButtonContainer: {
    alignSelf: 'center', 
    flexDirection: 'row',
  },
  noEndDateContainer: {
    paddingTop: RFValue(10),
    flexDirection: 'row',
    paddingLeft: '7%',
    alignItems: 'center',
  },
  noEndDateText: {
    paddingLeft: RFValue(14),
    fontSize: RFValue(14),
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  checkBox: {
    width: RFValue(20),
    height: RFValue(20),
  },
  image: {
    width: RFValue(20),
    height: RFValue(20),
  },
  uploadImageContainer: {
    width: '87.5%',
    alignSelf: 'center',
    marginBottom: Platform.OS === 'ios' ? RFValue(60) : RFValue(30),
  },
  uploadImage: {
    width: RFValue(80),
    height: RFValue(80),
  },
  uploadButton: {
    width: RFValue(80),
    height: RFValue(80),
    borderRadius: RFValue(5),
    borderWidth: RFValue(2),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  uploadedButton: {
    width: RFValue(80),
    height: RFValue(80),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  plusIcon: {
    fontSize: RFValue(14),
    alignSelf: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  loadingButton: {
    backgroundColor: '#9e9e9e',
  },
  loadingImage: {
    height: RFValue(30),
    aspectRatio: 475 / 480,
    resizeMode: 'stretch',
    alignSelf: 'center',
  },
});