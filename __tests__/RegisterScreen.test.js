import React from 'react';
import renderer from 'react-test-renderer';
import RegisterScreen from '../components/RegisterScreen';

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
    usernameText: 'test',
    medicines: {},
    setMedicines: jest.fn(),
    medicineDates: {},
    setMedicineDates: jest.fn(),
    setErrorModalMsg: jest.fn(),
    setErrorModalVisible: jest.fn(),
  }),
}));

const mockProps = {
  navigation: { navigate: jest.fn() },
  route: { params: { username: 'test' } },
};

describe('<RegisterScreen />', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => ['You cannot leave the username empty.', () => {}])
      .mockImplementationOnce(() => ['You cannot leave the password empty.', () => {}])
  });

  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<RegisterScreen {...mockProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});