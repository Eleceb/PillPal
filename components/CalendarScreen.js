import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TouchableHighlight, 
  Modal, 
  TouchableWithoutFeedback,
  Image,
  Dimensions 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useGlobalContext } from '../GlobalContext';
import { Cell, Section, TableView } from 'react-native-tableview-simple';
import { RFValue } from 'react-native-responsive-fontsize';
import AntDesign from '@expo/vector-icons/AntDesign';
import moment from 'moment-timezone';

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

export default function CalendarScreen({ navigation }) {
  const { 
    medicines, 
    medicineDates,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible
  } = useGlobalContext();
  
  const universalDate = new Date();
  const currentDate = moment(universalDate).tz(moment.tz.guess()).format('YYYY-MM-DD');

  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedInformation, setSelectedInfomation] = React.useState(null);
  const [selected, setSelected] = React.useState(currentDate);
  const [markedDates, setMarkedDates] = React.useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [indexToShow, setIndexToShow] = useState(null);

  useEffect(() => {
    (async() => {
      try {
        if (medicines && medicineDates) {
          setIsLoading(true);

          const medicinesData = Object.entries(medicines);
          const medicineDatesData = Object.entries(medicineDates);

          let dots = {};
          let marked = {}

          for (let i = 0; i < medicineDatesData.length; i++) {
            dots[medicineDatesData[i][0]] = {key: medicineDatesData[i][0], color: 'red'};

            if (medicineDatesData[i][1]) {
              for (let j = 0; j < medicineDatesData[i][1].length; j++) {
                const date = medicineDatesData[i][1][j];
                
                if (marked[date]) {
                  marked[date].dots.push(dots[medicineDatesData[i][0]]);
                  marked[date].imageUris.push(medicinesData[i][1].image);
                  marked[date].medicines.push(medicinesData[i][1].medicine);
                  marked[date].startDates.push(moment(new Date(medicinesData[i][1].startDate)).tz(moment.tz.guess()).format('YYYY/MM/DD'));
                  marked[date].endDates.push(moment(new Date(medicinesData[i][1].endDate)).tz(moment.tz.guess()).format('YYYY/MM/DD'));
                  marked[date].noEndDates.push(medicinesData[i][1].noEndDate);
                  marked[date].frequencies.push(
                    medicinesData[i][1].frequency === "daily" ? "Daily" 
                    : medicinesData[i][1].frequency === "weekly" ? "Weekly" 
                    : medicinesData[i][1].frequency === "monthly" ? "Monthly" 
                    : medicinesData[i][1].frequency === "custom" ? 
                      medicinesData[i][1].custom > 1 
                      ? "Every " + medicinesData[i][1].custom + " days" 
                      : "Every " + medicinesData[i][1].custom + " day"
                    : null
                  );
                  marked[date].times.push(new Date(medicinesData[i][1].time).toTimeString().split(' ')[0].substring(0, 5));
                } else {
                  marked[date] = {
                    dots: [dots[medicineDatesData[i][0]]], 
                    imageUris: [medicinesData[i][1].image],
                    medicines: [medicinesData[i][1].medicine], 
                    startDates: [moment(new Date(medicinesData[i][1].startDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')],
                    endDates: [moment(new Date(medicinesData[i][1].endDate)).tz(moment.tz.guess()).format('YYYY/MM/DD')],
                    noEndDates: [medicinesData[i][1].noEndDate],
                    frequencies: [
                      medicinesData[i][1].frequency === "daily" ? "Daily" 
                      : medicinesData[i][1].frequency === "weekly" ? "Weekly" 
                      : medicinesData[i][1].frequency === "monthly" ? "Monthly" 
                      : medicinesData[i][1].frequency === "custom" ? 
                        medicinesData[i][1].custom > 1 
                        ? "Every " + medicinesData[i][1].custom + " days" 
                        : "Every " + medicinesData[i][1].custom + " day"
                      : null
                    ],
                    times: [new Date(medicinesData[i][1].time).toTimeString().split(' ')[0].substring(0, 5)]
                  };
                }
              }
            }
          }

          await setMarkedDates(marked);
          setSelected(currentDate);
          setSelectedInfomation(
            marked[selected] && {
              'medicines': marked[selected].medicines, 
              'imageUris': marked[selected].imageUris,
              'startDates': marked[selected].startDates,
              'endDates': marked[selected].endDates,
              'noEndDates': marked[selected].noEndDates,
              'frequencies': marked[selected].frequencies,
              'times': marked[selected].times,
            }
          )
          setIsLoading(false);
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

  const DetailCell = (props) => {
    return (
      <Cell 
        {...props}
        contentContainerStyle={styles.cellDetailContainer} 
        cellContentView={
          <View style={styles.detailCellContainer}>
            <Text style={styles.elementTitleText}>{props.title}</Text>
            <Text style={styles.elementColonText}>:</Text>
            {props.information}
          </View>
        }
      />
    )
  };

  const InformationModal = () => {
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
            {selectedInformation && (
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

                <View style={styles.imageContainer}>
                  <Image 
                    style={styles.elementImage}
                    source={selectedInformation.imageUris[indexToShow] 
                      ? {
                          uri: selectedInformation.imageUris[indexToShow],
                          cache: 'force-cache'
                        } 
                      : require("../assets/image.jpg")
                    } 
                  />
                </View>

                <TableView>
                  <Section 
                    sectionPaddingTop={0}
                    sectionPaddingBottom={0}
                    separatorInsetLeft={0}
                    hideSurroundingSeparators={true}
                  >
                    <DetailCell title="Date" information={
                        !selectedInformation.noEndDates[indexToShow] ? (
                          <View style={styles.dateContainer}>
                            <Text style={styles.elementDetailText}>{selectedInformation.startDates[indexToShow]}  </Text>
                            <AntDesign style={styles.elementDetailText} name="arrowright" />
                            <Text style={styles.elementDetailText}>  {selectedInformation.endDates[indexToShow]}</Text>
                          </View>
                        ) : (
                          <Text style={styles.elementDetailText}>From {selectedInformation.startDates[indexToShow]}</Text>
                        )
                      }
                    />

                    <DetailCell title="Repeat" information={
                      <Text style={styles.elementDetailText}>{selectedInformation.frequencies[indexToShow]}</Text>} />
                  </Section>
                </TableView>
              </View>
            )}
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (!isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.calendarContainer}>
          <Calendar
            showSixWeeks
            style={styles.calendar}
            markingType={'multi-dot'}
            onDayPress={(day) => {
              setSelected(day.dateString)
              setSelectedInfomation(markedDates[day.dateString] && {
                'imageUris': markedDates[day.dateString].imageUris,
                'medicines': markedDates[day.dateString].medicines, 
                'startDates': markedDates[day.dateString].startDates,
                'endDates': markedDates[day.dateString].endDates,
                'noEndDates': markedDates[day.dateString].noEndDates,
                'frequencies': markedDates[day.dateString].frequencies,
                'times': markedDates[day.dateString].times,
              })
            }}
            onMonthChange={(month) => {
              if (new Date(selected).getMonth() + 1 !== month.month) {
                const firstDayOfMonth = `${month.year}-${('0' + month.month).slice(-2)}-01`;
                setSelected(firstDayOfMonth);
                setSelectedInfomation(markedDates[firstDayOfMonth] && {
                  'imageUris': markedDates[firstDayOfMonth].imageUris,
                  'medicines': markedDates[firstDayOfMonth].medicines, 
                  'startDates': markedDates[firstDayOfMonth].startDates,
                  'endDates': markedDates[firstDayOfMonth].endDates,
                  'noEndDates': markedDates[firstDayOfMonth].noEndDates,
                  'frequencies': markedDates[firstDayOfMonth].frequencies,
                  'times': markedDates[firstDayOfMonth].times,
                })
              }
            }}
            markedDates={{
              ...markedDates,
              [selected]: {selected: true, disableTouchEvent: true, dots: markedDates[selected]?.dots || []}
            }}
          />
        </View>

        <ScrollView style={styles.scrollContainer}>
          <TableView>
            <Section
              sectionPaddingBottom={0}
              separatorInsetLeft={0}
              hideSurroundingSeparators={!selectedInformation}
            >
              {selectedInformation && selectedInformation.times.map((time, index) => (
                <TouchableHighlight 
                  key={index} 
                  onPress={() => {
                    setModalVisible(!modalVisible);
                    setIndexToShow(index);
                  }}
                  underlayColor={"lightgrey"}
                >
                  <Cell
                    contentContainerStyle={styles.cellContainer}
                    cellContentView={
                      <View style={styles.cellContentContainer}>
                        <Text style={[styles.cellText, styles.timeText]}>{time}</Text>
                        <Text style={[styles.cellText, {flex: 1}]} numberOfLines={1}>{selectedInformation.medicines[index]}</Text>
                      </View>
                    }
                    backgroundColor={"transparent"}
                  />
                </TouchableHighlight>
              ))}
            </Section>
          </TableView>
        </ScrollView>

        <InformationModal />
      </SafeAreaView>
    );
  } else {
    return (
      <View style={styles.loadingContainer}>
        <SafeAreaView style={styles.loadingSafeView}>
          <Image 
            style={styles.loadingImage}
            source={require("../assets/loading.gif")}
          />
        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  calendarContainer: {
    paddingTop: RFValue(40),
  },
  calendar: {
    width: '100%',
  },
  scrollContainer: {
    height: '100%',
  },
  cellContainer: {
    height: RFValue(70),
  },
  cellContentContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  cellText: {
    fontSize: RFValue(20),
  },
  timeText: {
    width: RFValue(65),
  },
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: aspectRatio > 1.6 ? '85%' : '65%',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: RFValue(20),
    paddingBottom: RFValue(15),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cellDetailContainer: {
    height: RFValue(41),
    width: '100%',
  },
  detailCellContainer: {
    flexDirection: 'row',
  },
  elementTitleText: {
    fontSize: RFValue(13),
    width: RFValue(50), 
    alignSelf: 'center',
  },
  elementColonText: {
    fontSize: RFValue(13),
    width: RFValue(20), 
    alignSelf: 'center',
  },
  elementDetailText: {
    fontSize: RFValue(13),
    alignSelf: 'center'
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: RFValue(130), 
    height: RFValue(130), 
    backgroundColor: '#e6e6e6',
    borderRadius: RFValue(10),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: RFValue(10),
  },
  elementImage: {
    width: RFValue(115), 
    height: RFValue(115), 
    borderRadius: RFValue(10),
    alignSelf: 'center',
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
    fontSize: RFValue(25),
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSafeView: {
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
});