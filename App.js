/* All images in this app are royalty-free images */
import { StyleSheet, Platform, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { LogBox } from 'react-native'; // Added LogBox to hide the warnings in the newest version of React-Native
import * as ScreenOrientation from 'expo-screen-orientation'; // To lock the screen orientation
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef } from "@react-navigation/native"
import { RFValue } from 'react-native-responsive-fontsize';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';

import { GlobalProvider } from './GlobalContext';
import { LoginScreenNavigator } from './CustomNavigation';
import CalendarScreen from './components/CalendarScreen';
import LocationScreen from './components/LocationScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Hide the warnings in the newest version of React-Native
// Copied from https://stackoverflow.com/questions/69538962/new-nativeeventemitter-was-called-with-a-non-null-argument-without-the-requir
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); // Ignore all log notifications

const ref = createNavigationContainerRef();
const Tab = createBottomTabNavigator();

const {height, width} = Dimensions.get('window'); 
const aspectRatio = height/width;

export default function App() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  if (Platform.OS === 'android') {
    // rgb(246, 246, 248)
    NavigationBar.setBackgroundColorAsync('white');
    NavigationBar.setButtonStyleAsync('dark');
  }

  const [routeName, setRouteName] = useState();
  const hide = !['Medicine', 'Settings', 'Calendar', 'Location'].includes(routeName);

  return (
    <GlobalProvider>

      <NavigationContainer
        ref={ref}
        onReady={() => {
          setRouteName(ref.getCurrentRoute().name)
        }}
        onStateChange={async () => {
          setRouteName(ref.getCurrentRoute().name);
        }}
      >
        
        <Tab.Navigator 
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              display: hide ? "none" : "flex", 
            },
            tabBarItemStyle: {
              paddingTop: aspectRatio > 1.6 && RFValue(7),
            },
            tabBarLabelPosition: "below-icon"
          }}
          backBehavior="none"
        >

          <Tab.Screen
            name="Home"
            component={LoginScreenNavigator}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <Ionicons 
                  name={focused ? "home" : "home-outline"} 
                  style={styles.tabBarIcon} 
                  color={color} 
                />
              )
            }}
          />

          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <Ionicons 
                  name={focused ? "calendar-clear" : "calendar-clear-outline"} 
                  style={styles.tabBarIcon} 
                  color={color} 
                />
              )
            }}
          />

          <Tab.Screen
            name="Location"
            component={LocationScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
                <Ionicons 
                  name={focused ? "location" : "location-outline"} 
                  style={styles.tabBarIcon} 
                  color={color} 
                />
              ),
              tabBarLabel: "Pharmacy"
            }}
          />
          
        </Tab.Navigator>

        <StatusBar translucent={false} backgroundColor={"white"} style={"dark"} />

      </NavigationContainer>
      
    </GlobalProvider>
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    fontSize: RFValue(23),
  },
});
