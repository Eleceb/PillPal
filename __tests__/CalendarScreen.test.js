import React from 'react';
import renderer from 'react-test-renderer';
import CalendarScreen from '../components/CalendarScreen';

jest.mock('../GlobalContext', () => ({
  useGlobalContext: () => ({
    medicines: {
      '0': {
        'medicine': 'Medicine 1',
        'time': '2025-03-10T12:00:00Z',
        'frequency': 'daily',
        'custom': '',
        'startDate': '2025-03-10T12:00:00Z',
        'endDate': '2025-03-10T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '1': {
        'medicine': 'Medicine 2',
        'time': '2025-03-10T12:00:00Z',
        'frequency': 'weekly',
        'custom': '',
        'startDate': '2025-03-10T12:00:00Z',
        'endDate': '2025-03-10T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
      '2': {
        'medicine': 'Medicine 3',
        'time': '2025-03-10T12:00:00Z',
        'frequency': 'monthly',
        'custom': '',
        'startDate': '2025-03-10T12:00:00Z',
        'endDate': '2025-03-10T12:00:00Z',
        'noEndDate': false,
        'image': null,
      },
    },
    medicineDates: null,
    setErrorModalMsg: jest.fn(),
    errorModalVisible: false, 
    setErrorModalVisible: jest.fn(),
  }),
}));

describe('<CalendarScreen />', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [false, () => {}])
      .mockImplementationOnce(() => [{
        'medicines': ['Medicine 1', 'Medicine 2', 'Medicine 3'], 
        'imageUris': [null, null, null],
        'startDates': ['2025-03-10', '2025-03-10', '2025-03-10'],
        'endDates': ['2025-03-10', '2025-03-10', '2025-03-10'],
        'noEndDates': [false, false, false],
        'frequencies': ['Daily', 'Weekly', 'Monthly'],
        'times': ['12:00', '12:00', '12:00'],
      }, () => {}])
      .mockImplementationOnce(() => ['2025-03-10', () => {}])
      .mockImplementationOnce(() => [{
        '2025-03-10': {
          dots: [
            {key: '0', color: 'red'}, 
            {key: '1', color: 'red'}, 
            {key: '2', color: 'red'}
          ]
      }}, () => {}])
  });

  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<CalendarScreen />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});