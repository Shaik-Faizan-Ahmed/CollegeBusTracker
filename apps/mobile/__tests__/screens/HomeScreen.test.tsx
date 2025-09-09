import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {HomeScreen} from '../../src/screens/HomeScreen';

// Get mocked functions from global mocks
const mockRequestLocationPermission = jest.mocked(
  require('../../src/services/permissions').requestLocationPermission,
);
const mockShowPermissionAlert = jest.mocked(
  require('../../src/services/permissions').showPermissionAlert,
);

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

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });
    // Set default permission response
    mockRequestLocationPermission.mockResolvedValue({status: 'granted'});
  });

  const renderHomeScreen = () => {
    return render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>,
    );
  };

  it('renders correctly with app branding and buttons', () => {
    const {getByText, getByTestId} = renderHomeScreen();

    expect(getByText('CVR Bus Tracker')).toBeTruthy();
    expect(getByText('Real-time bus tracking for students')).toBeTruthy();
    expect(getByTestId('track-bus-button')).toBeTruthy();
    expect(getByTestId('become-tracker-button')).toBeTruthy();
    expect(getByText('Track Bus')).toBeTruthy();
    expect(getByText('Become Tracker')).toBeTruthy();
  });

  it('displays proper button subtexts', () => {
    const {getByText} = renderHomeScreen();

    expect(getByText('Find your bus location')).toBeTruthy();
    expect(getByText('Share bus location')).toBeTruthy();
  });

  describe('Track Bus button interaction', () => {
    it('navigates to TrackBus screen when permission granted', async () => {
      mockRequestLocationPermission.mockResolvedValue({status: 'granted'});

      const {getByTestId} = renderHomeScreen();
      const trackBusButton = getByTestId('track-bus-button');

      fireEvent.press(trackBusButton);

      await waitFor(() => {
        expect(mockRequestLocationPermission).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('TrackBus');
      });
    });

    it('shows permission alert when permission denied', async () => {
      const permissionResult = {
        status: 'denied',
        message: 'Permission required',
      };
      mockRequestLocationPermission.mockResolvedValue(permissionResult);

      const {getByTestId} = renderHomeScreen();
      const trackBusButton = getByTestId('track-bus-button');

      fireEvent.press(trackBusButton);

      await waitFor(() => {
        expect(mockRequestLocationPermission).toHaveBeenCalled();
        expect(mockShowPermissionAlert).toHaveBeenCalledWith(permissionResult);
        expect(mockNavigate).not.toHaveBeenCalledWith('TrackBus');
      });
    });
  });

  describe('Become Tracker button interaction', () => {
    it('navigates to BecomeTracker screen when permission granted', async () => {
      mockRequestLocationPermission.mockResolvedValue({status: 'granted'});

      const {getByTestId} = renderHomeScreen();
      const becomeTrackerButton = getByTestId('become-tracker-button');

      fireEvent.press(becomeTrackerButton);

      await waitFor(() => {
        expect(mockRequestLocationPermission).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('BecomeTracker');
      });
    });

    it('shows permission alert when permission denied', async () => {
      const permissionResult = {
        status: 'denied',
        message: 'Permission required',
      };
      mockRequestLocationPermission.mockResolvedValue(permissionResult);

      const {getByTestId} = renderHomeScreen();
      const becomeTrackerButton = getByTestId('become-tracker-button');

      fireEvent.press(becomeTrackerButton);

      await waitFor(() => {
        expect(mockRequestLocationPermission).toHaveBeenCalled();
        expect(mockShowPermissionAlert).toHaveBeenCalledWith(permissionResult);
        expect(mockNavigate).not.toHaveBeenCalledWith('BecomeTracker');
      });
    });
  });

  it('has proper touch target sizes (accessibility)', () => {
    const {getByTestId} = renderHomeScreen();

    const trackBusButton = getByTestId('track-bus-button');
    const becomeTrackerButton = getByTestId('become-tracker-button');

    // Check that buttons have proper styling for touch targets (minHeight: 80 in styles)
    expect(trackBusButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 80,
      }),
    );

    expect(becomeTrackerButton.props.style).toMatchObject(
      expect.objectContaining({
        minHeight: 80,
      }),
    );
  });
});
