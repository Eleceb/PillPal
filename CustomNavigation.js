import { StyleSheet, Platform, Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import { useGlobalContext } from './GlobalContext';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import MedicineScreen from './components/MedicineScreen';
import AddMedicineScreen from './components/AddMedicineScreen';
import SettingsScreen from './components/SettingsScreen';
import UploadImageScreen from './components/UploadImageScreen';
import Ionicons from '@expo/vector-icons/Ionicons';

const Stack = createStackNavigator();

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

const LoginScreenNavigator = ({ navigation }) => {
  const { isLoggedIn } = useGlobalContext();

  return (
    <Stack.Navigator screenOptions={{
        // Align the headerTitle to be in center and customise its fontSize and height to make it responsive
        headerTitleAlign: "center",
        headerTitleStyle: { 
          fontSize: RFValue(19), 
        },
        headerBackTitleStyle: {
          fontSize: RFValue(16),
        },
        headerStyle: aspectRatio < 1.6 && {
          height: RFValue(60),
        }
      }}
    >

      {isLoggedIn ? (
        <>
          <Stack.Screen 
            name="Medicine" 
            options={{
              headerTitle: "Today's Medicine",
              headerRight: () => (
                <HeaderBackButton 
                  style={[Platform.OS === "ios" && styles.iosButton]}
                  backImage={() => <Ionicons name="settings-sharp" size={RFValue(20)} />} 
                  onPress={() => navigation.navigate('Settings')}
                  labelVisible={false}
                />
              ),
            }}
            component={MedicineScreen} 
          />

          <Stack.Screen 
            name="Add Medicine" 
            component={AddMedicineScreen} 
            options={
              ({ route }) => ({ 
                title: !route.params.id ? "Add Medicine" : "Edit Medicine" ,
                headerBackTitle: "",
                headerLeft: () => Platform.OS === "android" ? (
                  <HeaderBackButton 
                    backImage={() => <Ionicons name='arrow-back' size={RFValue(22)} />} 
                    onPress={() => navigation.goBack()}
                    disabled={route.params.isLoading}
                  />
                ) : (
                  <HeaderBackButton 
                    onPress={() => navigation.goBack()}
                    disabled={route.params.isLoading}
                    labelStyle={styles.iosLabel}
                  />
                ),
              })
            }
          />

          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{
              headerBackTitle: "",
              title: "Medicine Settings",
              headerLeft: () => Platform.OS === "android" ? (
                <HeaderBackButton 
                  backImage={() => <Ionicons name='arrow-back' size={RFValue(22)} />} 
                  onPress={() => navigation.goBack()}
                />
              ) : (
                <HeaderBackButton 
                  onPress={() => navigation.goBack()}
                  labelStyle={styles.iosLabel}
                />
              ),
            }}
          />

          <Stack.Screen 
            name="Upload Image" 
            options={{
              headerShown: false,
            }}
            component={UploadImageScreen} 
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
          />

          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={
              ({ route }) => ({ 
                headerLeft: () => Platform.OS === "android" ? (
                  <HeaderBackButton 
                    backImage={() => <Ionicons name='arrow-back' size={RFValue(22)} />} 
                    onPress={() => navigation.goBack()}
                    disabled={route.params.isLoading}
                  />
                ) : (
                  <HeaderBackButton 
                    onPress={() => navigation.goBack()}
                    disabled={route.params.isLoading}
                    labelStyle={styles.iosLabel}
                  />
                ),
              })
            }
          />
        </>
      )}

    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  iosButton: {
    paddingRight: RFValue(10),
    paddingLeft: RFValue(10),
    height: RFValue(40),
  },
  iosLabel: {
    fontSize: RFValue(15),
  }
})

export { LoginScreenNavigator }