import { 
  StyleSheet, 
  Text, 
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Button
} from 'react-native';
import { Cell, Section, TableView } from 'react-native-tableview-simple';
import React, { useEffect, useState } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import CheckBox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useGlobalContext } from '../GlobalContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import moment from 'moment-timezone';

export default function MedicineScreen({ navigation, route }) {
  const { 
    usernameText,
    medicines,  
    medicineDates,
    isTakenToday, setIsTakenToday,
    notificationId, setNotificationId,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible,
    scheduleNotification
  } = useGlobalContext();

  const [todayMedicines, setTodayMedicines] = React.useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);

  useEffect(() => {
    (async() => {
      try {
        if (medicineDates) {
          const newTodayMedicines = {};
          
          await Object.entries(medicines)
            .map(([key, medicine]) => {
              const currentDate = moment(new Date()).tz(moment.tz.guess()).format('YYYY-MM-DD');
              if (medicineDates[key] && medicineDates[key].includes(currentDate)) {
                newTodayMedicines[key] = medicine;
              }
            })
          
          await setTodayMedicines(newTodayMedicines);
        }
      } catch (error) {
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
      }
    })();
  }, [medicineDates]);

  // Create the cell in Medicine Screen with custom cell
  const MedicineCell = (props) => {
    const handleCheckboxChange = async (newValue) => {
      try {
        await setIsTakenToday(prevArray => {
          const newDict = {...prevArray};
          newDict[props.index] = newValue; 

          AsyncStorage.setItem('isTakenToday', JSON.stringify(newDict))

          return newDict;
        });

        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
          const medicineTime = new Date(medicines[props.index].time);

          const medicineEndTime = new Date(medicines[props.index].endDate);
          medicineEndTime.setHours(
            medicineTime.getHours(), 
            medicineTime.getMinutes(), 
            0, 0
          );

          const currentTime = new Date();
          currentTime.setSeconds(0, 0);

          const isEndTimePassed = !medicines[props.index].noEndDate && currentTime >= medicineEndTime;

          Notifications.cancelScheduledNotificationAsync(notificationId[props.index]);

          if (!isEndTimePassed) {
            scheduleNotification(
              props.index,
              medicines[props.index],
              medicineDates[props.index],
              medicineTime,
              medicineEndTime,
              currentTime,
              newValue
            );
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

    return (
      <Cell 
        {...props}
        contentContainerStyle={styles.cellContainer}
        backgroundColor="white"
        highlightUnderlayColor="#ccc"
        cellContentView={
          <View style={styles.cellContent}>
  
            <Text style={[styles.elementText, styles.timeText]}>{props.time}</Text>
  
            <TouchableOpacity
              style={styles.elementImageButton}
              onPress={() => {
                setImageToDisplay({
                  uri: props.imageUri,
                  cache: 'force-cache'
                });
                setModalVisible(!modalVisible);
              }}
              disabled={!props.imageUri}
            >
              <Image
                style={styles.elementImage}
                source={props.imageUri 
                  ? {
                    uri: props.imageUri, 
                    cache: 'force-cache'
                  } 
                  : require("../assets/image.jpg")
                }
              />
            </TouchableOpacity>

            <Text style={[styles.elementText, styles.medicineText]} numberOfLines={1}>{props.medicine}</Text>
  
          </View>
        }
        cellAccessoryView={
          <View style={styles.cellAccessory}>
            <View style={styles.accessoryContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("Add Medicine", {id: props.index})}
              >
                <AntDesign style={styles.elementText} name="edit" />
              </TouchableOpacity>
            </View>

            <View style={[styles.accessoryContainer, {marginRight: RFValue(5)}]}>
              <View style={styles.checkBoxContainer}>
                <Text style={styles.takenText} allowFontScaling={false}>Taken</Text>
                <CheckBox
                  style={styles.checkBox}
                  value={isTakenToday[props.index]}
                  onValueChange={(newValue) => handleCheckboxChange(newValue)}
                />
              </View>
            </View>
          </View>
        }
      />
    );
  };

  const ImageModal = () => {
    return (
      <Modal 
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          onPress={() => setModalVisible(!modalVisible)} 
          activeOpacity={1}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              <View style={styles.backButtonContainer}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  activeOpacity={0.8}
                  onPress={() => setModalVisible(!modalVisible)}
                >
                  <AntDesign style={styles.closeIcon} name="close" />
                </TouchableOpacity>
              </View>
              <Image 
                style={styles.modalImage}
                source={imageToDisplay}
              />
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>

      {todayMedicines ? (
        Object.keys(todayMedicines).length !== 0 ? (
          <ScrollView 
            style={styles.scrollContainer}
          >

            <TableView>

              <Section
                sectionPaddingTop={0}
                sectionPaddingBrottom={0}
                separatorInsetLeft={0}
                hideSurroundingSeparators={Object.keys(medicines).length === 0}
              >
                {Object.entries(todayMedicines).map(([key, medicine]) => (
                  <MedicineCell
                    key={key}
                    index={key}
                    time={new Date(medicine.time).toTimeString().split(' ')[0].substring(0, 5)}
                    imageUri={medicine.image}
                    medicine={medicine.medicine}
                  />
                ))}
              </Section>

            </TableView>

          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <AntDesign name="medicinebox" size={RFValue(40)} color="#838383" />
            </View>
            <Text style={styles.emptyText}>No medicine for today</Text>
          </View>
        )
      ) : (
        <View style={styles.loadingContainer}>
          <Image 
            style={styles.loadingImage}
            source={require("../assets/loading.gif")}
          />
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !todayMedicines && styles.disabledButton]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Add Medicine", {id: null})}
          disabled={!todayMedicines}
        >
          <AntDesign style={styles.plusIcon} name="plus" color="white" />
        </TouchableOpacity>
      </View>

      <ImageModal />

    </View>
  );
}

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
  cellContainer: {
    height: RFValue(90),
  },
  cellContent: {
    flex: 2,
    flexDirection: 'row',
  },
  cellAccessory: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  elementContainer: {
    justifyContent: 'center',
  },
  accessoryContainer: {
    width: RFValue(40),
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  elementImageButton: {
    width: RFValue(30), 
    height: RFValue(30), 
    marginRight: RFValue(12), 
    alignSelf: 'center',
    justifyContent: 'center'
  },
  elementImage: {
    width: RFValue(30), 
    height: RFValue(30), 
  },
  elementText: {
    fontSize: RFValue(20),
    alignSelf: 'center',
  },
  timeText: {
    width: RFValue(65),
  },
  medicineText: {
    width: RFValue(130),
  },
  editButton: {
    width: RFValue(30), 
    height: RFValue(30),  
    justifyContent: 'center',
  },
  checkBoxContainer: {
    alignItems: 'center',
  },
  checkBox: {
    width: RFValue(20), 
    height: RFValue(20),
  },
  takenText: {
    position: 'absolute',
    fontSize: RFValue(13),
    top: RFValue(-23),
  },
  button: {
    width: RFValue(50),
    height: RFValue(50),
    borderRadius: RFValue(25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00adf8',
  },
  buttonContainer: {
    position: 'absolute',
    padding: RFValue(15),
    bottom: 0,
    right: 0,
  },
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
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
  backButtonContainer: {
    position: 'absolute',
    top: RFValue(-20),
    right: RFValue(-20),
  },
  backButton: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(250, 250, 250)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  plusIcon: {
    fontSize: RFValue(26),
    alignSelf: 'center',
  },
  closeIcon: {
    fontSize: RFValue(25),
    alignSelf: 'center',
  },
  modalImage: {
    width: '100%', 
    aspectRatio: 1,
  },
  loadingContainer: {
    height: RFValue(90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingImage: {
    height: RFValue(30),
    aspectRatio: 475 / 480,
    resizeMode: 'stretch',
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    top: '40%',
  },
  emptyText: {
    fontSize: RFValue(20),
    color: '#838383',
  },
  disabledButton: {
    backgroundColor: '#9e9e9e',
  },
});