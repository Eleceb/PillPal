import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Linking, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import MapViewDirections from 'react-native-maps-directions';
import { RFValue } from 'react-native-responsive-fontsize'; // To make the UI responsive
import { useGlobalContext } from '../GlobalContext';

export default function LocationScreen() {
  const {
    setErrorModalMsg,
    errorModalVisible, setErrorModalVisible
  } = useGlobalContext();

  const apiKey = '(Put your Firebase API key here)';

  const [mapRegion, setMapRegion] = React.useState(null);
  const [userLocation, setUserLocation] = React.useState(null);
  const [markerSelected, setMarkerSelected] = React.useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [placeID, setPlaceID] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Clean up everything when the screen is unfocused
  useFocusEffect(
    React.useCallback(() => {
      try {
        requestPermission();
        return () => {
          setErrorMsg(null);
          setMapRegion(null);
          setUserLocation(null);
          setPharmacies([]);
          setMarkerSelected(false);
          setPlaceID(null);
        };
      } catch (error) {
        setErrorModalMsg({
          'title': 'Error', 
          'description': error.message
        });
        setErrorModalVisible(!errorModalVisible);
      }
    }, [])
  );

  // Request location permission to and show the google map with your current location
  const requestPermission = async () => {
    setErrorMsg(null); // Reset the error message every time the location is refreshed

    let { status } = await Location.requestForegroundPermissionsAsync();

    // Ask for permission again if it is declined
    if (status !== 'granted') {
      setErrorMsg('Permission Denied.');
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});

    // Get your current location
    try {
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      })
      findPharmacies(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // Find nearby pharmacies
  const findPharmacies = async (latitude, longitude) => {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=pharmacy&key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPharmacies(data.results);
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const googleMapButton = (id) => {
    setMarkerSelected(true);
    setPlaceID(id)
  }

  if (errorMsg === 'Permission Denied.') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeView}>
          <Text style={styles.errorMsg}>{"Permission to access location was denied.\nPlease go to settings to enable it."}</Text>
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.errorButton} onPress={requestPermission} activeOpacity={0.8}> 
              <Text style={styles.errorButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.errorButton} onPress={Linking.openSettings} activeOpacity={0.8}> 
              <Text style={styles.errorButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  } else if (errorMsg !== null) {
    // If there has been an error
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeView}>
          <View style={styles.errorMsgContainer}>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
          </View>
          <TouchableOpacity style={styles.errorButton} onPress={requestPermission} activeOpacity={0.8}> 
            <Text style={styles.errorButtonText}>Refresh</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  } else if (mapRegion !== null) {
    // If success
    return (
      <View style={styles.container}>

        <SafeAreaView style={styles.safeView}>

          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            toolbarEnabled={false}
          >

            {/* Show the markers of the nearby pharmacies in the map */}
            {pharmacies.map((pharmacy, i) => (
              <Marker
                key={i}
                coordinate={{
                  latitude: pharmacy.geometry.location.lat,
                  longitude: pharmacy.geometry.location.lng
                }}
                pinColor="yellow"
                onPress={async () => {
                  googleMapButton(pharmacy.place_id);

                  let loc = await Location.getCurrentPositionAsync({});
          
                  setUserLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                  });
                }}
              >
                <Callout style={styles.callout} onPress={() => Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${placeID}`
                )}>
                  <Text style={styles.calloutTitle}>{pharmacy.name}</Text>
                  <Text>{pharmacy.vicinity}</Text>
                </Callout>
              </Marker>
            ))}

            {mapRegion && placeID != null && (
              <MapViewDirections
                origin={userLocation}
                destination={`place_id:${placeID}`}
                apikey={apiKey}
              />
            )}

          </MapView>

          {markerSelected && (
            <TouchableOpacity 
              style={styles.planYourRouteButton}
              onPress={() => Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=Google&destination_place_id=${placeID}`
              )}
              activeOpacity={0.8}
            >
              <Image style={styles.planYourRouteImage} source={require("../assets/plan-your-route.png")}/>
            </TouchableOpacity>
          )}

        </SafeAreaView>

      </View>
    );
  } else {
    // waiting
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeView}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: RFValue(35),
    height: RFValue(35),
  },
  callout: {
    flex: 1,
    position: 'relative',
    maxWidth: RFValue(250),
    padding: Platform.OS === 'android' && RFValue(5),
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: Platform.OS === 'ios' && RFValue(3),
  },
  loadingImage: {
    height: RFValue(30),
    aspectRatio: 475 / 480,
    resizeMode: 'stretch',
    alignSelf: 'center',
  },
  planYourRouteButton: {
    backgroundColor: '#00adf8', 
    width: RFValue(50), 
    height: RFValue(50), 
    justifyContent: 'center', 
    position: 'absolute', 
    right: RFValue(15), 
    bottom: RFValue(15), 
    borderRadius: RFValue(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  planYourRouteImage: {
    height: RFValue(30),
    aspectRatio: 1,
    resizeMode: 'stretch',
    alignSelf: 'center',
    tintColor: 'white',
  },
  errorMsgContainer: {
    marginHorizontal: RFValue(30),
  },
  errorMsg: {
    textAlign: 'center',
    fontSize: RFValue(15),
    marginBottom: RFValue(20),
  },
  errorButtonContainer: {
    flexDirection: 'row',
  },
  errorButton: {
    backgroundColor: '#00adf8',
    marginHorizontal: RFValue(5),
    paddingHorizontal: RFValue(20),
    height: RFValue(40),
    borderRadius: RFValue(20),
    alignContent: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(10),
  },
  errorButtonText: {
    textAlign: 'center',
    fontSize: RFValue(15),
    color: 'white',
  },
});
