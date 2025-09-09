// This test needs the actual implementation, not mocks
jest.unmock('../../src/services/permissions');

import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {
  requestLocationPermission,
  showPermissionAlert,
} from '../../src/services/permissions';
import Geolocation from '@react-native-community/geolocation';

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('Permissions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLocationPermission', () => {
    describe('Android Platform', () => {
      beforeEach(() => {
        Platform.OS = 'android';
      });

      it('returns granted status when permission is granted', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.GRANTED,
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({status: 'granted'});
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          expect.objectContaining({
            title: 'Location Permission Required',
            message:
              'CVR Bus Tracker needs access to your location to show accurate bus tracking information.',
          }),
        );
      });

      it('returns denied status when permission is denied', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.DENIED,
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({
          status: 'denied',
          message: 'Location permission is required for bus tracking features.',
        });
      });

      it('returns never_ask_again status when permission is permanently denied', async () => {
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
          PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({
          status: 'never_ask_again',
          message:
            'Please enable location permission in Settings > Apps > CVR Bus Tracker > Permissions.',
        });
      });

      it('handles errors gracefully', async () => {
        (PermissionsAndroid.request as jest.Mock).mockRejectedValue(
          new Error('Permission error'),
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({
          status: 'denied',
          message: 'Failed to request location permission. Please try again.',
        });
      });
    });

    describe('iOS Platform', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
      });

      it('returns granted status when iOS permission is granted', async () => {
        const mockRequestAuthorization = jest.fn((success, error) => {
          success();
        });
        (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
          mockRequestAuthorization,
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({status: 'granted'});
        expect(Geolocation.requestAuthorization).toHaveBeenCalled();
      });

      it('returns denied status when iOS permission is denied', async () => {
        const mockRequestAuthorization = jest.fn((success, error) => {
          error(new Error('Permission denied'));
        });
        (Geolocation.requestAuthorization as jest.Mock).mockImplementation(
          mockRequestAuthorization,
        );

        const result = await requestLocationPermission();

        expect(result).toEqual({
          status: 'denied',
          message: 'Location permission is required to track buses accurately.',
        });
      });
    });

    describe('Unsupported Platform', () => {
      beforeEach(() => {
        Platform.OS = 'web' as any;
      });

      it('returns denied status for unsupported platforms', async () => {
        const result = await requestLocationPermission();

        expect(result).toEqual({
          status: 'denied',
          message: 'Platform not supported for location services.',
        });
      });
    });
  });

  describe('showPermissionAlert', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('shows alert for denied permission', () => {
      const result = {
        status: 'denied' as const,
        message: 'Permission required',
      };

      showPermissionAlert(result);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Permission Required',
        'Permission required',
        [{text: 'OK', style: 'default'}],
      );
    });

    it('shows settings alert for never_ask_again permission', () => {
      const result = {
        status: 'never_ask_again' as const,
        message: 'Go to settings',
      };

      showPermissionAlert(result);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Permission Required',
        'Go to settings',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: expect.any(Function)},
        ],
      );
    });

    it('does not show alert for granted permission', () => {
      const result = {
        status: 'granted' as const,
      };

      showPermissionAlert(result);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('uses default message when no message provided', () => {
      const result = {
        status: 'denied' as const,
      };

      showPermissionAlert(result);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Permission Required',
        'Location access is needed for bus tracking features.',
        [{text: 'OK', style: 'default'}],
      );
    });
  });
});
