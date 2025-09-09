import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {BecomeTrackerScreen} from '../../src/screens/BecomeTrackerScreen';

// Mock the store
jest.mock('../../src/store', () => ({
  useAppStore: () => ({
    navigateToScreen: jest.fn(),
    setUserRole: jest.fn(),
  }),
}));

// Mock useLocation hook
jest.mock('../../src/hooks/useLocation', () => ({
  useLocation: () => ({
    currentLocation: null,
    isTracking: false,
    loadingState: 'idle',
    locationError: null,
    permissionStatus: 'unknown',
    accuracy: null,
    getCurrentLocation: jest.fn(),
    startLocationTracking: jest.fn(),
    stopLocationTracking: jest.fn(),
  }),
}));

// Mock navigation specifically for this test
const mockNavigate = jest.fn();
const mockUseNavigation = require('@react-navigation/native')
  .useNavigation as jest.Mock;

describe('BecomeTrackerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });
  });

  const renderBecomeTrackerScreen = () => {
    return render(
      <NavigationContainer>
        <BecomeTrackerScreen />
      </NavigationContainer>,
    );
  };

  it('renders correctly with title and location tracking interface', () => {
    const {getByText, getByTestId} = renderBecomeTrackerScreen();

    expect(getByText('Become Tracker')).toBeTruthy();
    expect(
      getByText('Share your bus location with other students'),
    ).toBeTruthy();
    expect(getByText('No Location')).toBeTruthy();
    expect(getByTestId('start-tracking-button')).toBeTruthy();
    expect(getByTestId('refresh-location-button')).toBeTruthy();
    expect(getByTestId('back-to-home-button')).toBeTruthy();
  });

  it('navigates back to Home screen when back button pressed', async () => {
    const {getByTestId} = renderBecomeTrackerScreen();
    const backButton = getByTestId('back-to-home-button');

    fireEvent.press(backButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('has tracking controls disabled when no location permission', () => {
    const {getByTestId} = renderBecomeTrackerScreen();

    const startButton = getByTestId('start-tracking-button');
    const refreshButton = getByTestId('refresh-location-button');
    
    expect(startButton.props.accessibilityState.disabled).toBe(true);
    expect(refreshButton.props.accessibilityState.disabled).toBe(true);
  });

  it('has proper touch target sizes for all buttons', () => {
    const {getByTestId} = renderBecomeTrackerScreen();

    const startButton = getByTestId('start-tracking-button');
    const refreshButton = getByTestId('refresh-location-button');
    const backButton = getByTestId('back-to-home-button');
    
    expect(startButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 56,
      }),
    );
    expect(refreshButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 48,
      }),
    );
    expect(backButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 48,
      }),
    );
  });
});
