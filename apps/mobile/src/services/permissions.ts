import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'never_ask_again';

export interface LocationPermissionResult {
  status: LocationPermissionStatus;
  message?: string;
}

export const requestLocationPermission =
  async (): Promise<LocationPermissionResult> => {
    if (Platform.OS === 'ios') {
      return new Promise(resolve => {
        Geolocation.requestAuthorization(
          () => {
            resolve({status: 'granted'});
          },
          _error => {
            resolve({
              status: 'denied',
              message:
                'Location permission is required to track buses accurately.',
            });
          },
        );
      });
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message:
              'CVR Bus Tracker needs access to your location to show accurate bus tracking information.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return {status: 'granted'};
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          return {
            status: 'denied',
            message:
              'Location permission is required for bus tracking features.',
          };
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return {
            status: 'never_ask_again',
            message:
              'Please enable location permission in Settings > Apps > CVR Bus Tracker > Permissions.',
          };
        }
      } catch (err) {
        return {
          status: 'denied',
          message: 'Failed to request location permission. Please try again.',
        };
      }
    }

    return {
      status: 'denied',
      message: 'Platform not supported for location services.',
    };
  };

export const showPermissionAlert = (result: LocationPermissionResult): void => {
  if (result.status === 'denied' || result.status === 'never_ask_again') {
    Alert.alert(
      'Location Permission Required',
      result.message || 'Location access is needed for bus tracking features.',
      result.status === 'never_ask_again'
        ? [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Open Settings',
              onPress: () => {
                // On a real app, we'd open settings here
                // For now, just show another alert
                Alert.alert(
                  'Please enable location permission in your device settings.',
                );
              },
            },
          ]
        : [{text: 'OK', style: 'default'}],
    );
  }
};
