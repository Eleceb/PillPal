import { 
  StyleSheet, 
  Text, 
  View,
  Platform,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions
} from 'react-native';
import React, { useState } from 'react';
import { RFValue } from 'react-native-responsive-fontsize';
import * as ImagePicker from 'expo-image-picker';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useGlobalContext } from '../GlobalContext';

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

export default function UploadImageScreen({ navigation, route }) {
  const {
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible,
  } = useGlobalContext();

  const [image, setImage] = useState(route.params.image);

  const pickImage = async (option) => {
    try {
      let result;

      if (option == 'camera') {
        let { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
          setErrorModalMsg({
            'title': 'Permission Denied', 
            'description': 'Permission to access your camera was denied. Please go to settings to enable it.'
          });
          setErrorModalVisible(!errorModalVisible);
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: Platform.OS === 'ios' ? 0 : 1,
        });
      } else if (option == 'library') {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: Platform.OS === 'ios' ? 0 : 1,
        });
      }

      if (!result.canceled) {
        setImage(result.assets[0].uri)
        route.params.setImage(result.assets[0].uri);
      }
    } catch (error) {
      setErrorModalMsg({
        'title': 'Error', 
        'description': error.message
      });
      setErrorModalVisible(!errorModalVisible);
    }
  };

  const ImageContainer = (props) => {
    if (image) {
      return (
        <Image
          style={styles.image}
          source={{ 
            uri: image, 
            cache: 'force-cache'
          }}
        />
      );
    } else {
      return (
        <View style={styles.imageSectionContainer}>
          <View style={styles.dashedLine} />
          <Image
            style={styles.imagePlaceholder}
            source={require("../assets/image.png")}
          />
        </View>
      );
    }
  };

  return (
    <SafeAreaView>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="close" size={RFValue(24.5)} />
      </TouchableOpacity>
      
      <View style={styles.sectionContainer}>
        <ImageContainer />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => pickImage("camera")}
        >
          <Text style={styles.buttonText} >Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => pickImage("library")}
        >
          <Text style={styles.buttonText} >Choose File</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: RFValue(50),
    aspectRatio: 1,
    marginTop: RFValue(2),
    marginBottom: aspectRatio > 1.6 ? RFValue(66) : RFValue(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imageSectionContainer: {
    width: aspectRatio > 1.6 ? '95%' : '75%', 
    aspectRatio: 1,
    alignItems: "center", 
    justifyContent: "center",
    marginBottom: RFValue(20),
  },
  dashedLine: {
    borderWidth: RFValue(2), 
    borderRadius: RFValue(5),
    position: "absolute", 
    width: '100%', 
    aspectRatio: 1,
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    width: '100%', 
    aspectRatio: 1,
    resizeMode: 'center',
  },
  image: {
    width: aspectRatio > 1.6 ? '95%' : '75%', 
    aspectRatio: 1,
    resizeMode: 'cover',
    marginBottom: RFValue(20),
  },
  button: {
    width: aspectRatio > 1.6 ? '70%' : '60%', 
    height: RFValue(35),
    borderRadius: RFValue(5),
    borderWidth: RFValue(2),
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: 'lightblue',
    marginBottom: RFValue(15),
  },
  buttonText: {
    textAlign: 'center',
    fontSize: RFValue(14),
  },
});