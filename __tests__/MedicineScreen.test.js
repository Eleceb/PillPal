import React from 'react';
import renderer from 'react-test-renderer';
import MedicineScreen from '../components/MedicineScreen';

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
        'time': '2022-05-05T13:00:00Z',
        'frequency': 'weekly',
        'custom': '',
        'startDate': '2022-05-05T12:00:00Z',
        'endDate': '2022-05-05T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '2': {
        'medicine': 'Medicine 3',
        'time': '2022-05-05T14:00:00Z',
        'frequency': 'monthly',
        'custom': '',
        'startDate': '2022-05-05T12:00:00Z',
        'endDate': '2022-05-05T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
    },
    medicineDates: null,
    setErrorModalMsg: jest.fn(),
    errorModalVisible: false, 
    setErrorModalVisible: jest.fn(),
    isTakenToday: {}
  }),
}));

describe('<MedicineScreen />', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => React.useState({
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
          'time': '2022-05-05T13:00:00Z',
          'frequency': 'weekly',
          'custom': '',
          'startDate': '2022-05-05T12:00:00Z',
          'endDate': '2022-05-05T12:00:00Z',
          'noEndDate': false,
          'image': null,
        },
        '2': {
          'medicine': 'Medicine 3',
          'time': '2022-05-05T14:00:00Z',
          'frequency': 'monthly',
          'custom': '',
          'startDate': '2022-05-05T12:00:00Z',
          'endDate': '2022-05-05T12:00:00Z',
          'noEndDate': false,
          'image': null,
        },
      }));
  });

  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<MedicineScreen />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});