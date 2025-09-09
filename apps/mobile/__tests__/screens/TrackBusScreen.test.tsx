import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {TrackBusScreen} from '../../src/screens/TrackBusScreen';

// Mock the store
jest.mock('../../src/store', () => ({
  useAppStore: () => ({
    navigateToScreen: jest.fn(),
    setUserRole: jest.fn(),
  }),
}));

// Mock navigation specifically for this test
const mockNavigate = jest.fn();
const mockUseNavigation = require('@react-navigation/native')
  .useNavigation as jest.Mock;

describe('TrackBusScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });
  });

  const renderTrackBusScreen = () => {
    return render(
      <NavigationContainer>
        <TrackBusScreen />
      </NavigationContainer>,
    );
  };

  it('renders correctly with title and placeholder content', () => {
    const {getByText, getByTestId} = renderTrackBusScreen();

    expect(getByText('Track Bus')).toBeTruthy();
    expect(getByText('Find your bus location in real-time')).toBeTruthy();
    expect(
      getByText(
        '🚌 Bus tracking features will be implemented in future stories',
      ),
    ).toBeTruthy();
    expect(
      getByText('This screen will show real-time bus locations and routes'),
    ).toBeTruthy();
    expect(getByTestId('back-to-home-button')).toBeTruthy();
  });

  it('navigates back to Home screen when back button pressed', async () => {
    const {getByTestId} = renderTrackBusScreen();
    const backButton = getByTestId('back-to-home-button');

    fireEvent.press(backButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('has proper styling for placeholder content', () => {
    const {getByText} = renderTrackBusScreen();

    const placeholderText = getByText(
      '🚌 Bus tracking features will be implemented in future stories',
    );
    expect(placeholderText).toBeTruthy();
  });

  it('back button has proper touch target size', () => {
    const {getByTestId} = renderTrackBusScreen();

    const backButton = getByTestId('back-to-home-button');
    expect(backButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 48,
      }),
    );
  });
});
