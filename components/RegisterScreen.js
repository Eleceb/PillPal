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
  BackHandler
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import React, { useState, useEffect } from 'react';
import { firestore } from '../FirebaseConfig';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useGlobalContext } from '../GlobalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Question = (props) => {
  return (
    <View>
      <View style={styles.inputTitleContainer}>
        <Text style={styles.inputTitle}>
          {props.title}
          {props.required && (
            <Text style={[styles.inputTitle, styles.inputStar]}> *</Text>
          )}
        </Text>
      </View>
      <View style={styles.inputSectionContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              props.errorMsg ? [styles.input, styles.inputError] : styles.input,
              props.isLoading && styles.disabledText
            ]}
            autoCapitalize="none"
            editable={!props.isLoading}
            onChangeText={props.onChangeText}
            value={props.value}
            placeholder={props.placeholder}
            placeholderTextColor={"#838383"}
            secureTextEntry={props.secureTextEntry}
            autoCorrect={false}
          />
        </View>
        {props.errorMsg && (
          <View style={styles.inputErrorContainer}>
            <Text style={styles.errorText}>⚠ {props.errorMsg}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation, route }) {
  const {
    setIsLoggedIn,
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible
  } = useGlobalContext();

  const [usernameErrorMsg, setUsernameErrorMsg] = React.useState(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = React.useState(null);
  const [confirmPasswordErrorMsg, setConfirmPasswordErrorMsg] = useState(null);
  const [usernameText, setUsernameText] = useState(route.params.username);
  const [passwordText, setPasswordText] = useState('');
  const [confirmPasswordText, setConfirmPasswordText] = useState('');
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

  let inputQuestions = [
    {
      'title': 'Username',
      'required': true,
      'value': usernameText,
      'onChangeText': usernameText => {
        setUsernameText(usernameText);
        if (usernameErrorMsg) {
          setUsernameErrorMsg(null);
        }
      },
      'placeholder': 'Enter your username...',
      'errorMsg': usernameErrorMsg,
      'secureTextEntry': false,
      'isLoading': isLoading,
    },
    {
      'title': 'Password',
      'required': true,
      'value': passwordText,
      'onChangeText': passwordText => {
        setPasswordText(passwordText);
        if (passwordErrorMsg) {
          setPasswordErrorMsg(null);
        }
      },
      'placeholder': 'Enter your password...',
      'errorMsg': passwordErrorMsg,
      'secureTextEntry': true,
      'isLoading': isLoading,
    },
    {
      'title': 'Confirm Password',
      'required': true,
      'value': confirmPasswordText,
      'onChangeText': confirmPasswordText => {
        setConfirmPasswordText(confirmPasswordText);
        if (confirmPasswordErrorMsg) {
          setConfirmPasswordErrorMsg(null);
        }
      },
      'placeholder': 'Enter your password again...',
      'errorMsg': confirmPasswordErrorMsg,
      'secureTextEntry': true,
      'isLoading': isLoading,
    }
  ];

  const register = async (username, password, confirmPassword) => {
    try {
      const userData = await getDoc(doc(collection(firestore, username), 'Login Infomation'));

      setUsernameErrorMsg(null);
      setPasswordErrorMsg(null);
      setConfirmPasswordErrorMsg(null);

      if (
        !username.includes(' ') &&
        !password.includes(' ') &&
        !userData.exists() &&
        password === confirmPassword &&
        password !== '' &&
        confirmPassword !== ''
      ) {
        await setDoc(doc(collection(firestore, username), 'Login Infomation'), { username, password });
        await setDoc(doc(collection(firestore, username), 'Medicines'), {});

        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));

        setIsLoggedIn(true);
      }
      
      if (username.includes(' ') || password.includes(' ')) {
        if (username.includes(' ')) {
          setUsernameErrorMsg('You cannot include space in your username.');
        }
        if (password.includes(' ')) {
          setPasswordErrorMsg('You cannot include space in your password.');
        }
      }

      if (userData.exists()) {
        setUsernameErrorMsg('Username exists. Please try another username.');
      }

      if (password !== '' && password !== confirmPassword) {
        setConfirmPasswordErrorMsg('Password does not match.');
      }
      
      if (password === '' || confirmPassword === '') {
        if (password === '') {
          setPasswordErrorMsg('You cannot leave the password empty.');
        }
        if (password !== '' && confirmPassword === '') {
          setConfirmPasswordErrorMsg('Please confirm your password.');
        }
      }
    } catch (error) {
      if (error.message === 'Function collection() cannot be called with an empty path.') {
        setPasswordErrorMsg(null);
        setConfirmPasswordErrorMsg(null);

        if (password.includes(' ')) {
          setPasswordErrorMsg('You cannot include space in your password.');
        }

        if (password !== '' && password !== confirmPassword) {
          setConfirmPasswordErrorMsg('Password does not match.');
        }

        if (password === '' || confirmPassword === '') {
          setUsernameErrorMsg('You cannot leave the username empty.');
          if (password === '') {
            setPasswordErrorMsg('You cannot leave the password empty.');
          }
          if (password !== '' && confirmPassword === '') {
            setConfirmPasswordErrorMsg('Please confirm your password.');
          }
        } else {
          setUsernameErrorMsg('You cannot leave the username empty.');
        }
      } else {
        setUsernameErrorMsg(null);
        setPasswordErrorMsg(null);
        setConfirmPasswordErrorMsg(null);
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
      }
    }
  }
  
  const startRegistration = async (username, password, confirmPassword) => {
    if (!isLoading) {
      setIsLoading(true);
      await register(username, password, confirmPassword);
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>

      {/* Hide the keyboard when touching other places other than the textbox */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

        {/* Use the unused space in IOS */}
        <SafeAreaView style={styles.safeView}>

          {/* Username, password, and confirm password textboxes */}
          <View style={styles.inputsContainer}>

            {inputQuestions.map((question, i) => (
              <Question
                key={i}
                title={question.title}
                required={question.required}
                value={question.value}
                onChangeText={question.onChangeText}
                placeholder={question.placeholder}
                errorMsg={question.errorMsg}
                secureTextEntry={question.secureTextEntry}
                isLoading={question.isLoading}
              />
            ))}

          </View>

          {/* Register button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={isLoading ? [styles.button, styles.buttonLoading] : styles.button}
              onPress={
                () => startRegistration(
                  usernameText.toLowerCase().trim(), 
                  passwordText.trim(), 
                  confirmPasswordText.trim()
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
                <Text style={styles.buttonText}>Register</Text>
              )}
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
  inputsContainer: {
    paddingTop: '10%',
  },
  inputTitleContainer: {
    width: '87.5%',
    alignSelf: 'center',
    paddingBottom: RFValue(8),
  },
  inputSectionContainer: {
    marginBottom: RFValue(25),
  },
  inputContainer: {
    paddingBottom: RFValue(8),
  },
  inputErrorContainer: {
    width: '87.5%',
    alignSelf: 'center',
  },
  inputTitle: {
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
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    fontSize: RFValue(12),
    color: 'red',
  },
  buttonContainer: {
    marginTop: RFValue(27),
    alignItems: 'center', 
    justifyContent: 'center',
  },
  button: {
    width: '69%',
    height: RFValue(47.5),
    backgroundColor: 'blue',
    borderRadius: RFValue(23.75),
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
  disabledText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});