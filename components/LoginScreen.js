import { 
  StyleSheet, 
  Text, 
  View, 
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import React, { useState } from 'react';
import { firestore } from '../FirebaseConfig';
import { collection, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalContext } from '../GlobalContext';

export default function LoginScreen({ navigation }) {
  const {
    usernameText, setUsernameText, 
    setIsLoggedIn,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible
  } = useGlobalContext();
  const [errorMsg, setErrorMsg] = React.useState(null);
  const [passwordText, setPasswordText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    try {
      const userData = await getDoc(doc(collection(firestore, username), 'Login Infomation'));
  
      if (userData.exists()) {
        if (userData.data().username === username && userData.data().password === password) {
          await AsyncStorage.setItem('username', username);
          await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));

          setIsLoggedIn(true);
        } else if (password === ''){
          setErrorMsg('Please enter your password.');
        } else {
          setErrorMsg('Username and/or password do not match.')
        }
      } else {
        setErrorMsg('Username and/or password do not match.')
      }
    } catch (error) {
      if (error.message === 'Function collection() cannot be called with an empty path.') {
        setErrorMsg('Please enter your username.');
      } else {
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
      }
    }
  };

  const startLogin = async (username, password) => {
    if (!isLoading) {
      setErrorMsg(null);
      setIsLoading(true);
      await login(username, password);
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>

        {/* Hide the keyboard when touching other places other than the textbox */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          {/* Use the unused space in IOS */}
          <SafeAreaView style={styles.safeView}>

            {errorMsg && (
              <View style={styles.errorMsgContainer}>
                <Text style={styles.errorMsg}>⚠ {errorMsg}</Text>
              </View>
            )}

            {/* Username and password textboxes */}
            <View style={errorMsg ? styles.inputContainerError : styles.inputContainer}>
              <TextInput
                style={[styles.input, isLoading && styles.disabledText]}
                autoCapitalize="none"
                editable={!isLoading}
                defaultValue={usernameText}
                placeholder={"Username"}
                onChangeText={usernameText => setUsernameText(usernameText)}
                placeholderTextColor={"#838383"}
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, isLoading && styles.disabledText]}
                autoCapitalize="none"
                editable={!isLoading}
                defaultValue={passwordText}
                placeholder={"Password"}
                onChangeText={passwordText => setPasswordText(passwordText)}
                secureTextEntry={true}
                placeholderTextColor={"#838383"}
              />
            </View>

            {/* Login and register buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={
                  isLoading 
                    ? [styles.button, styles.loginButton, styles.buttonLoading] 
                    : [styles.button, styles.loginButton]
                }
                onPress={
                  () => startLogin(
                    usernameText.toLowerCase().trim(), 
                    passwordText.trim(),
                  )
                }
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading && (
                  <Image 
                    style={styles.loadingImage}
                    source={require("../assets/loading.gif")}
                  />
                )}
                {!isLoading && (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  isLoading 
                    ? [styles.button, styles.buttonLoading] 
                    : [styles.button, styles.registerButton]
                }
                onPress={() => navigation.navigate("Register", {username: usernameText})}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>

        </TouchableWithoutFeedback>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeView: {
    flex: 1,
    width: '100%',
  },
  errorMsgContainer: {
    width: '87.5%',
    paddingTop: '5%',
    alignSelf: 'center',
  },
  errorMsg: {
    color: 'red',
    fontSize: RFValue(14),
  },
  inputContainer: {
    paddingTop: '10%',
  },
  inputContainerError: {
    paddingTop: '5%',
  },
  input: {
    width: '87.5%',
    borderBottomWidth: RFValue(1),
    borderColor: 'grey',
    marginBottom: RFValue(30),
    textAlign: 'left',
    fontSize: RFValue(16),
    alignSelf: 'center',
  },
  inputBottom: {
    marginBottom: RFValue(33),
  },
  buttonContainer: {
    alignItems: 'center', 
    justifyContent: 'center',
  },
  button: {
    width: '69%',
    height: RFValue(47.5),
    borderRadius: RFValue(23.75),
    marginBottom: RFValue(28),
    alignContent: 'center',
    justifyContent: 'center',
  },
  buttonLoading: {
    backgroundColor: 'grey',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: RFValue(19),
  },
  loadingImage: {
    height: RFValue(30),
    aspectRatio: 475 / 480,
    resizeMode: 'stretch',
    alignSelf: 'center',
  },
  loginButton: {
    marginTop: RFValue(27),
    backgroundColor: 'black',
  },
  registerButton: {
    backgroundColor: 'blue',
  },
  disabledText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});