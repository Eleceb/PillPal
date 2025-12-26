import React from 'react';
import renderer from 'react-test-renderer';
import AddMedicineScreen from '../components/AddMedicineScreen';

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

jest.mock('@react-native-community/datetimepicker', () => ({}));

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
  navigation: { 
    navigate: jest.fn(), 
    isFocused: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
  },
  route: { params: { } },
};

describe('<AddMedicineScreen />', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => React.useState({
        'medicine': 'You cannot leave the name of medicine empty.',
        'time': 'Please select the medication time.',
        'frequency': 'Please select the repetition frequency.',
        'startDate': 'Please select the medication start date.',
        'endDate': 'Please select the medication end date.',
      }));
  });

  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<AddMedicineScreen {...mockProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});