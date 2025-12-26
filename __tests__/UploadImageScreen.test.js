import React from 'react';
import renderer from 'react-test-renderer';
import UploadImageScreen from '../components/UploadImageScreen';

jest.mock('../GlobalContext', () => ({
  useGlobalContext: () => ({
    medicines: {},
    medicineDates: null,
    setErrorModalMsg: jest.fn(),
    errorModalVisible: false, 
    setErrorModalVisible: jest.fn(),
  }),
}));

const mockProps = {
  navigation: { navigate: jest.fn() },
  route: { params: { } },
};

describe('<UploadImageScreen />', () => {
  it('renders correctly without crashing', () => {
    const tree = renderer
      .create(<UploadImageScreen {...mockProps} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});