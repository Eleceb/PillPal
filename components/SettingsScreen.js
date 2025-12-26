import { 
  StyleSheet, 
  Text, 
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { Cell, Section, TableView } from 'react-native-tableview-simple';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import { useGlobalContext } from '../GlobalContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import moment from 'moment-timezone';
import { firestore, storage } from '../FirebaseConfig';
import { collection, doc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { ref, listAll, deleteObject } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Notifications from 'expo-notifications';

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

export default function SettingsScreen({ navigation, route }) {
  const {
    setIsLoggedIn,
    usernameText, setUsernameText,
    medicines, setMedicines,
    setMedicineDates,
    isTakenToday, setIsTakenToday,
    notificationId, setNotificationId,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible,
    setIsLoading
  } = useGlobalContext();

  const [modalText, setModalText] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);
  const [medicineId, setMedicineId] = useState(null);
  const [detailButtonStates, setDetailButtonStates] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const toggleModal = (title, description, buttonText) => {
    setModalText({"title": title, "description": description, "buttonText": buttonText});
    setModalVisible(!modalVisible);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderBackButton
          style={Platform.OS === "ios" && styles.iosButton}
          backImage={() => <MaterialCommunityIcons name="logout" size={RFValue(20)} />}
          onPress={() => toggleModal(
            "Logout", 
            "Are you sure you want to logout?", 
            "Logout"
          )}
          labelVisible={false}
        />
      ),
    });
  }, [navigation]);

  const deleteMedicine = async () => {
    try {
      setIsDeleteLoading(true);

      await updateDoc(doc(collection(firestore, usernameText), 'Medicines'), {
        [medicineId]: deleteField()
      });

      if (medicines[medicineId].image) {
        await deleteObject(ref(storage, `images/${usernameText}/${medicineId}`));
      }

      setMedicines(() => {
        const { [medicineId]: _, ...rest } = medicines;

        return rest;
      });

      await setIsTakenToday(() => {
        const { [medicineId]: _, ...rest } = isTakenToday;

        AsyncStorage.setItem('isTakenToday', JSON.stringify(rest));

        return rest;
      });

      if (notificationId[medicineId]) {
        await Notifications.cancelScheduledNotificationAsync(notificationId[medicineId]);
      }

      await setNotificationId(() => {
        const { [medicineId]: _, ...rest } = notificationId;

        AsyncStorage.setItem('notificationId', JSON.stringify(rest));

        return rest;
      });
      
      setModalVisible(!modalVisible);

      setIsDeleteLoading(false);
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const deleteAllMedicines = async () => {
    try {
      setIsDeleteLoading(true);

      await setDoc(doc(collection(firestore, usernameText), 'Medicines'), {});

      await listAll(ref(storage, `images/${usernameText}`))
        .then((res) => {
          res.items.forEach((itemRef) => {
            deleteObject(itemRef);
          })
        });

      setMedicines({});

      await setIsTakenToday(() => {
        const newDict = {};

        AsyncStorage.setItem('isTakenToday', JSON.stringify(newDict));

        return newDict;
      });

      await Notifications.cancelAllScheduledNotificationsAsync();

      await setNotificationId(() => {
        const newDict = {};

        AsyncStorage.setItem('notificationId', JSON.stringify(newDict));

        return newDict;
      });

      setModalVisible(!modalVisible);

      setIsDeleteLoading(false);
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      setModalVisible(!modalVisible);

      await Notifications.cancelAllScheduledNotificationsAsync();

      await AsyncStorage.getAllKeys()
        .then(keys => AsyncStorage.multiRemove(keys))
        .then(() => setIsLoggedIn(false))

      setUsernameText('');
      setMedicines(null);
      setMedicineDates(null);
      setIsTakenToday({});
      setNotificationId({});

      setIsLoading(false);
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const MedicineCell = (props) => {
    const DetailCell = (props) => {
      return (
        <Cell 
          {...props}
          contentContainerStyle={styles.cellDetailContainer} 
          cellContentView={
            <View style={styles.detailCellContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.elementTitleText}>{props.title}</Text>
                <View style={styles.spaceContainer} />
                <Text style={styles.elementColonText}>:</Text>
              </View>
              {props.information}
            </View>
          }
        />
      )
    };

    return (
      <View>
        <Cell 
          {...props}
          contentContainerStyle={styles.cellContainer}
          backgroundColor="white"
          highlightUnderlayColor="#ccc"
          cellContentView={
            <View style={styles.cellContent}>
    
              <View style={[styles.elementContainer]}>
                <TouchableOpacity
                  style={styles.elementImageButton}
                  onPress={() => {
                    setImageToDisplay({
                      uri: props.imageUri,
                      cache: 'force-cache'
                    });
                    setImageModalVisible(!imageModalVisible);
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
              </View>

              <Text style={styles.elementText} numberOfLines={1}>{props.medicine}</Text>
    
            </View>
          }
          cellAccessoryView={
            <View style={styles.accessoryContainer}> 
              <TouchableOpacity 
                style={styles.accessoryButton} 
                onPress={() => navigation.navigate("Add Medicine", {id: props.index})}
              >
                <AntDesign name="edit" size={RFValue(15)} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.accessoryButton} 
                onPress={() => {
                  toggleModal(
                    "Delete Medicine", 
                    "Are you sure you want to delete this medicine?",
                    "Delete"
                  );
                  setMedicineId(props.index);
                }} 
              >
                <AntDesign name="delete" size={RFValue(15)} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.accessoryButton} 
                onPress={() => setDetailButtonStates({
                  ...detailButtonStates,
                  [props.index]: !detailButtonStates[props.index]
                })} 
              >
                <AntDesign name={props.detailOpened ? "up" : "down"} size={RFValue(15)} />
              </TouchableOpacity>
            </View>
          }
        />
        {props.detailOpened && (
          <TableView>

            <Section 
              sectionPaddingTop={0}
              sectionPaddingBottom={0}
              separatorInsetLeft={0}
            >

              <DetailCell title="Date" information={
                  !props.noEndDate ? (
                    <View style={styles.dateContainer}>
                      <Text style={styles.elementDetailText}>{props.startDate}  </Text>
                      <AntDesign style={styles.elementDetailText} name="arrowright" />
                      <Text style={styles.elementDetailText}>  {props.endDate}</Text>
                    </View>
                  ) : (
                    <Text style={styles.elementDetailText}>From {props.startDate}</Text>
                  )
                }
              />

              <DetailCell title="Repeat" information={
                <Text style={styles.elementDetailText}>{props.frequency}</Text>
              } />

              <DetailCell title="Time"information={
                <Text style={styles.elementDetailText}>{props.time}</Text>
              } />

            </Section>
            
          </TableView>
        )}
      </View>
    );
  };

  const ImageModal = () => {
    return (
      <Modal 
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setImageModalVisible(!imageModalVisible)}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          onPress={() => setImageModalVisible(!imageModalVisible)} 
          activeOpacity={1}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalImageView}>
              <View style={styles.backButtonContainer}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  activeOpacity={0.8}
                  onPress={() => setImageModalVisible(!imageModalVisible)}
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
      {medicines ? (
        Object.keys(medicines).length !== 0 ? (
          <ScrollView style={styles.scrollContainer}>
            <TableView>
              <Section
                sectionPaddingTop={0}
                sectionPaddingBottom={0}
                separatorInsetLeft={0}
                hideSurroundingSeparators={Object.keys(medicines).length === 0}
              >
                {Object.entries(medicines)
                  .sort(([keyA, medicineA], [keyB, medicineB]) => {
                    // Compare Name
                    const nameComparison = medicineA.medicine.localeCompare(medicineB.medicine);
                    if (nameComparison !== 0) return nameComparison;

                    // Compare Start Date
                    const startDateComparison = 
                      moment(medicineA.startDate).tz(moment.tz.guess()).startOf('day') - 
                      moment(medicineB.startDate).tz(moment.tz.guess()).startOf('day');
                    if (startDateComparison !== 0) return startDateComparison;

                    // Compare End Date
                    if (medicineA.endDate && medicineB.endDate) {
                      const endDateComparison = 
                        moment(medicineA.endDate).tz(moment.tz.guess()).startOf('day'); - 
                        moment(medicineB.endDate).tz(moment.tz.guess()).startOf('day');
                      if (endDateComparison !== 0) return endDateComparison;
                    } else if (medicineA.endDate && !medicineB.endDate) {
                      return 1;
                    } else if (!medicineA.endDate && medicineB.endDate) {
                      return -1;
                    }

                    // Compare Time
                    const timeA = new Date(medicineA.time);
                    const timeB = new Date(medicineB.time);
                    const timeComparison = 
                      new Date().setHours(timeA.getHours(), timeA.getMinutes(), 0, 0) - 
                      new Date().setHours(timeB.getHours(), timeB.getMinutes(), 0, 0);
                    if (timeComparison !== 0) return timeComparison;

                    // Compare Frequency
                    const frequencyValues = { daily: 1, weekly: 2, monthly: 3, custom: 4 };
                    const frequencyComparison = frequencyValues[medicineA.frequency] - frequencyValues[medicineB.frequency];
                    if (frequencyComparison !== 0) return frequencyComparison;
                    if (medicineA.frequency === 'custom' && medicineB.frequency === 'custom'){
                      return medicineA.custom - medicineB.custom;
                    }

                    // Compare Key
                    return keyA.localeCompare(keyB);
                  })
                  .map(([key, medicine]) => (
                    <MedicineCell
                      key={key}
                      index={key}
                      imageUri={medicine.image}
                      medicine={medicine.medicine}
                      detailOpened={!detailButtonStates[key]}
                      startDate={moment(new Date(medicine.startDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')}
                      endDate={moment(new Date(medicine.endDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')}
                      noEndDate={medicine.noEndDate}
                      frequency={
                        medicine.frequency === "daily" ? "Daily" 
                        : medicine.frequency === "weekly" ? "Weekly" 
                        : medicine.frequency === "monthly" ? "Monthly" 
                        : medicine.frequency === "custom" ? 
                          medicine.custom > 1 
                          ? "Every " + medicine.custom + " days" 
                          : "Every " + medicine.custom + " day"
                        : null
                      }
                      time={new Date(medicine.time).toTimeString().split(' ')[0].substring(0, 5)}
                    />
                ))}
              </Section>
            </TableView>

            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={() => toggleModal(
                "Delete All Medicines", 
                "Are you sure you want to permanently delete all of your medicines? This action cannot be undone.",
                "Delete"
              )} 
              activeOpacity={0.8}
            >
              <Text style={styles.deleteAllButtonText}>Delete All</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <AntDesign name="medicinebox" size={RFValue(40)} color="#838383" />
            </View>
            <Text style={styles.emptyText}>No medicine is added</Text>
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
          style={[styles.button, !medicines && styles.cancelButton]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Add Medicine", {id: null})}
          disabled={!medicines}
        >
          <AntDesign style={styles.plusIcon} name="plus" color="white" />
        </TouchableOpacity>
      </View>

      <Modal 
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => !isDeleteLoading && setModalVisible(!modalVisible)}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          onPress={() => !isDeleteLoading && setModalVisible(!modalVisible)} 
          activeOpacity={1}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              <Text style={styles.modalTitleText}>{modalText.title}</Text>
              <Text style={styles.modalDescriptionText}>{modalText.description}</Text>
              {!isDeleteLoading ? (
                <View style={styles.modalButtonSectionContainer}>
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]} 
                      activeOpacity={0.8}
                      onPress={() => setModalVisible(!modalVisible)}
                      disabled={isDeleteLoading}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButton, !isDeleteLoading ? styles.deleteButton : styles.cancelButton]} 
                      activeOpacity={0.8}
                      onPress={
                        modalText.title === "Delete Medicine" 
                          ? deleteMedicine 
                        : modalText.title === "Delete All Medicines" 
                          ? deleteAllMedicines 
                        : modalText.title === "Logout" 
                          && logout
                      }
                      disabled={isDeleteLoading}
                    >
                      <Text style={styles.modalButtonText}>{modalText.buttonText}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.deleteLoadingContainer}>
                  <Image 
                    style={[styles.loadingImage, styles.deleteLoadingImage]}
                    source={require("../assets/loading.gif")}
                  />
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

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
  iosButton: {
    paddingRight: RFValue(10),
    paddingLeft: RFValue(10),
    height: RFValue(40),
  },
  cellContainer: {
    height: RFValue(70),
    width: '100%',
  },
  cellDetailContainer: {
    height: RFValue(41),
    width: '100%',
    alignItems: 'center',
  },
  cellContent: {
    flex: 7.8,
    flexDirection: 'row',
  },
  elementContainer: {
    justifyContent: 'center',
    height: RFValue(70),
  },
  elementImageButton: {
    height: RFValue(50),
    aspectRatio: 1,
    marginRight: RFValue(10), 
    alignSelf: 'center',
  },
  elementImage: {
    height: RFValue(50),
    aspectRatio: 1,
  },
  elementText: {
    fontSize: RFValue(20),
    alignSelf: 'center',
    width: '73%',
  },
  detailCellContainer: {
    flexDirection: 'row',
  },
  titleContainer: {
    width: RFValue(52), 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: RFValue(8),
  },
  elementTitleText: {
    fontSize: RFValue(13),
  },
  spaceContainer: {
    flex: 1,
  },
  elementColonText: {
    fontSize: RFValue(13),
    textAlign: 'right',
  },
  elementDetailText: {
    fontSize: RFValue(13),
    alignSelf: 'center'
  },
  dateContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  button: {
    width: RFValue(50),
    height: RFValue(50),
    borderRadius: RFValue(25),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#00adf8',
  },
  buttonContainer: {
    position: 'absolute',
    padding: RFValue(15),
    bottom: 0,
    right: 0,
  },
  plusIcon: {
    fontSize: RFValue(26),
    alignSelf: 'center',
  },
  accessoryContainer: {
    flex: 3,
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexDirection: 'row',
    height: RFValue(70),
  },
  accessoryButton: {
    justifyContent: 'center', 
    alignItems: 'center', 
    width: RFValue(35), 
    aspectRatio: 1,
  },
  deleteAllButton: {
    width: '69%',
    height: RFValue(47.5),
    borderRadius: RFValue(23.75),
    marginTop: RFValue(28),
    marginBottom: RFValue(80),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    alignSelf: 'center',
  },
  deleteAllButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(19),
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
  modalButtonSectionContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  modalButtonContainer: {
    width: '40%',
    marginTop: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButton: {
    width: '85%',
    height: RFValue(40),
    borderRadius: RFValue(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: RFValue(15),
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  modalImageView: {
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
  modalImage: {
    width: '100%', 
    aspectRatio: 1,
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
  closeIcon: {
    fontSize: RFValue(24.5),
    alignSelf: 'center',
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
  deleteLoadingContainer: {
    height: RFValue(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: RFValue(20),
  },
  deleteLoadingImage: {
    height: RFValue(28),
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
});