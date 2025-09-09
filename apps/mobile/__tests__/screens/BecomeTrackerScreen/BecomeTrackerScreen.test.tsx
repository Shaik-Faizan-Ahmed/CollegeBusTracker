import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BecomeTrackerScreen } from '../../../src/screens/BecomeTrackerScreen/BecomeTrackerScreen';
import { useAppStore } from '../../../src/store';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('../../../src/store', () => ({
  useAppStore: jest.fn(),
}));

jest.mock('react-native-keep-awake', () => ({
  activate: jest.fn(),
  deactivate: jest.fn(),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

const mockNavigation = {
  navigate: jest.fn(),
};

const mockRoute = {
  params: undefined,
};

const mockStore = {
  isActiveTracker: false,
  trackingSession: null,
  trackerStatus: 'idle' as const,
  trackerError: null,
  selectedBus: null,
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
  setTrackerError: jest.fn(),
};

describe('BecomeTrackerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
    (useRoute as jest.Mock).mockReturnValue(mockRoute);
    (useAppStore as jest.Mock).mockReturnValue(mockStore);
    (Alert.alert as jest.Mock).mockClear();
  });

  describe('rendering', () => {
    it('should render initial state correctly', () => {
      const { getByText, getByTestId } = render(<BecomeTrackerScreen />);

      expect(getByText('Become Tracker')).toBeTruthy();
      expect(getByText('Share your bus location with other students in real-time')).toBeTruthy();
      expect(getByTestId('start-tracking-button')).toBeTruthy();
      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('should show select bus button when no bus selected', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      expect(getByTestId('select-bus-button')).toBeTruthy();
    });

    it('should show bus number when selected', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
      });

      const { getByText } = render(<BecomeTrackerScreen />);

      expect(getByText('Selected Bus')).toBeTruthy();
      expect(getByText('12')).toBeTruthy();
    });

    it('should use bus number from route params', () => {
      (useRoute as jest.Mock).mockReturnValue({
        params: { busNumber: 'A1' },
      });

      const { getByText } = render(<BecomeTrackerScreen />);

      expect(getByText('A1')).toBeTruthy();
    });
  });

  describe('tracker status display', () => {
    it('should show tracker status component', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        trackerStatus: 'active',
        isActiveTracker: true,
        trackingSession: {
          sessionId: 'session-123',
          busNumber: '12',
          trackerId: 'tracker-456',
          startedAt: new Date(),
          isActive: true,
        },
      });

      const { getByText } = render(<BecomeTrackerScreen />);

      expect(getByText('Currently Tracking Bus 12')).toBeTruthy();
    });

    it('should show loading state during tracking start', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        trackerStatus: 'starting',
      });

      const { getByText } = render(<BecomeTrackerScreen />);

      expect(getByText('Starting tracking...')).toBeTruthy();
    });

    it('should show error state', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        trackerStatus: 'error',
        trackerError: 'Failed to start tracking',
      });

      const { getByText } = render(<BecomeTrackerScreen />);

      expect(getByText('Tracker error occurred')).toBeTruthy();
    });
  });

  describe('start tracking', () => {
    it('should start tracking when bus selected', async () => {
      const startTracking = jest.fn().mockResolvedValue(undefined);
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        startTracking,
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('start-tracking-button'));

      await waitFor(() => {
        expect(startTracking).toHaveBeenCalledWith('12');
      });
    });

    it('should show alert when no bus selected', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('start-tracking-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'No Bus Selected',
        'Please select a bus number to track.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Select Bus' }),
          expect.objectContaining({ text: 'Cancel' }),
        ])
      );
    });

    it('should navigate to bus selector when select bus pressed', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('select-bus-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('BusSelector', { mode: 'tracker' });
    });

    it('should handle bus already tracked error', async () => {
      const startTracking = jest.fn().mockRejectedValue(new Error('BUS_ALREADY_TRACKED'));
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        startTracking,
      });

      const { getByTestId, getByText } = render(<BecomeTrackerScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('start-tracking-button'));
      });

      await waitFor(() => {
        expect(getByText('Bus Already Being Tracked')).toBeTruthy();
      });
    });

    it('should handle generic tracking errors', async () => {
      const startTracking = jest.fn().mockRejectedValue(new Error('Network error'));
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        startTracking,
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('start-tracking-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Tracking Failed',
          'Network error',
          expect.arrayContaining([{ text: 'OK' }])
        );
      });
    });

    it('should disable start button during tracking start', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        trackerStatus: 'starting',
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);
      const button = getByTestId('start-tracking-button');

      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('stop tracking', () => {
    beforeEach(() => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        isActiveTracker: true,
        trackerStatus: 'active',
        trackingSession: {
          sessionId: 'session-123',
          busNumber: '12',
          trackerId: 'tracker-456',
          startedAt: new Date(),
          isActive: true,
        },
      });
    });

    it('should show stop tracking button when active', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      expect(getByTestId('stop-tracking-button')).toBeTruthy();
    });

    it('should show confirmation before stopping', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('stop-tracking-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Stop Tracking?',
        expect.stringContaining('Are you sure you want to stop tracking Bus 12'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Stop Tracking' }),
        ])
      );
    });
  });

  describe('conflict resolution', () => {
    it('should show conflict component when bus already tracked', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        trackerError: 'BUS_ALREADY_TRACKED',
      });

      const { getByText, getByTestId } = render(<BecomeTrackerScreen />);

      expect(getByText('Bus Already Being Tracked')).toBeTruthy();
      expect(getByTestId('try-different-bus-button')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    it('should navigate to bus selector on try different bus', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        trackerError: 'BUS_ALREADY_TRACKED',
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('try-different-bus-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('BusSelector', { mode: 'tracker' });
    });

    it('should retry tracking on retry button', async () => {
      const startTracking = jest.fn().mockResolvedValue(undefined);
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        startTracking,
        trackerError: 'BUS_ALREADY_TRACKED',
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('retry-button'));
      });

      expect(startTracking).toHaveBeenCalledWith('12');
    });
  });

  describe('back navigation', () => {
    it('should navigate back when not tracking', () => {
      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('back-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });

    it('should show confirmation when tracking active', () => {
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        isActiveTracker: true,
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('back-button'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Stop Tracking?',
        'Going back will stop location tracking. Continue?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Go Back' }),
        ])
      );
    });

    it('should stop tracking and navigate on confirmation', async () => {
      const stopTracking = jest.fn().mockResolvedValue(undefined);
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        isActiveTracker: true,
        stopTracking,
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('back-button'));

      // Simulate alert confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const goBackAction = alertCall[2][1]; // Second button
      
      await act(async () => {
        goBackAction.onPress();
      });

      expect(stopTracking).toHaveBeenCalled();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });

    it('should force navigation if stop tracking fails', async () => {
      const stopTracking = jest.fn().mockRejectedValue(new Error('Stop failed'));
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        isActiveTracker: true,
        stopTracking,
      });

      const { getByTestId } = render(<BecomeTrackerScreen />);

      fireEvent.press(getByTestId('back-button'));

      // Simulate alert confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const goBackAction = alertCall[2][1];
      
      await act(async () => {
        goBackAction.onPress();
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  describe('tracker error handling', () => {
    it('should show and clear bus already tracked error', async () => {
      const setTrackerError = jest.fn();
      
      // Start with no error
      const { rerender } = render(<BecomeTrackerScreen />);

      // Update with error
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedBus: '12',
        trackerError: 'BUS_ALREADY_TRACKED',
        setTrackerError,
      });

      rerender(<BecomeTrackerScreen />);

      await waitFor(() => {
        expect(setTrackerError).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('device sleep prevention', () => {
    it('should activate keep awake when tracking active', async () => {
      const KeepAwake = require('react-native-keep-awake');
      
      (useAppStore as jest.Mock).mockReturnValue({
        ...mockStore,
        isActiveTracker: true,
        trackerStatus: 'active',
      });

      render(<BecomeTrackerScreen />);

      await waitFor(() => {
        expect(KeepAwake.activate).toHaveBeenCalled();
      });
    });

    it('should deactivate keep awake when not tracking', async () => {
      const KeepAwake = require('react-native-keep-awake');
      
      render(<BecomeTrackerScreen />);

      await waitFor(() => {
        expect(KeepAwake.deactivate).toHaveBeenCalled();
      });
    });
  });
});