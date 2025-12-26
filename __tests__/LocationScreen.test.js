import React from 'react';
import renderer from 'react-test-renderer';
import LocationScreen from '../components/LocationScreen';

jest.mock('../GlobalContext', () => ({
  useGlobalContext: () => ({
    medicines: {},
    medicineDates: null,
    setErrorModalMsg: jest.fn(),
    errorModalVisible: false, 
    setErrorModalVisible: jest.fn(),
  }),
}));

jest.mock('expo-location');
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: () => jest.fn(),
}));

describe('LocationScreen', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [{
        latitude: 51.509865,
        longitude: -0.118092,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      }, () => {}])
      .mockImplementationOnce(() => [{
        latitude: 51.509865,
        longitude: -0.118092
      }, () => {}])
      .mockImplementationOnce(() => [true, () => {}])
  });

  it('renders correctly without crashing', async () => {
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(<LocationScreen />);
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});