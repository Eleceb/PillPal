import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAnKtvE_7xwhmZh0_nXFKEXmPGR7m4tQeg',
  authDomain: 'mobile-development-final.firebaseapp.com',
  projectId: 'mobile-development-final',
  storageBucket: 'mobile-development-final.firebasestorage.app',
  messagingSenderId: '991905355881',
  appId: '1:991905355881:web:7c4883dd3800039e49eaf8'
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const firestore = getFirestore(app);
const storage = getStorage(app);

const toAuthEmail = (username) => `${username}@pillpal.app`;

export { auth, firestore, storage, toAuthEmail };