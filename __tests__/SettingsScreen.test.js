import React from 'react';
import renderer from 'react-test-renderer';
import SettingsScreen from '../components/SettingsScreen';

jest.mock("@react-native-async-storage/async-storage", () => ({ 
  AsyncStorage: { 
    clear: jest.fn().mockName("clear"), 
    getAllKeys: jest.fn().mockName("getAllKeys"), 
    getItem: jest.fn().mockImplementation((key) => {
      return new Promise((resolve) => {
        switch (key) {
          case 'username':
            resolve('test');
            break;
          default:
            resolve(null);
        }
      });
    }),
    removeItem: jest.fn().mockName("removeItem"), 
    setItem: jest.fn().mockName("setItem") 
  } 
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(), 
  getReactNativePersistence: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(() => Promise.resolve({
    exists: true,
  })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(), 
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: () => null,
}));

jest.mock('../GlobalContext', () => ({
  useGlobalContext: () => ({
    medicines: {
      '0': {
        'medicine': 'Medicine 1',
        'time': '2022-05-05T12:00:00Z',
        'frequency': 'daily',
        'custom': '',
        'startDate': '2022-05-05T12:00:00Z',
        'endDate': '2022-05-05T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '1': {
        'medicine': 'Medicine 2',
        'time': '2022-05-06T12:00:00Z',
        'frequency': 'weekly',
        'custom': '',
        'startDate': '2022-05-06T12:00:00Z',
        'endDate': '2022-05-06T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '2': {
        'medicine': 'Medicine 3',
        'time': '2022-05-07T12:00:00Z',
        'frequency': 'monthly',
        'custom': '',
        'startDate': '2022-05-07T12:00:00Z',
        'endDate': null,
        'noEndDate': true,
        'image': null,
      },
      '3': {
        'medicine': 'Medicine 4',
        'time': '2022-05-08T12:00:00Z',
        'frequency': 'custom',
        'custom': '1',
        'startDate': '2022-05-08T12:00:00Z',
        'endDate': '2022-05-08T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '4': {
        'medicine': 'Medicine 5',
        'time': '2022-05-09T12:00:00Z',
        'frequency': 'custom',
        'custom': '3',
        'startDate': '2022-05-09T12:00:00Z',
        'endDate': null,
        'noEndDate': true,
        'image': null,
      },
    },
    medicineDates: null,
    setErrorModalMsg: jest.fn(),
    errorModalVisible: false, 
    setErrorModalVisible: jest.fn(),
  }),
}));

describe('<SettingsScreen />', () => {
  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<SettingsScreen />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});