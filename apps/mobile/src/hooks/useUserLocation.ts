import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { locationService, LocationServiceResult } from '../services/location';
import { useAppStore } from '../store';

export const useUserLocation = () => {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const {
    currentLocation,
    locationPermissionStatus,
    setCurrentLocation,
    setLocationPermissionStatus,
  } = useAppStore();

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionGranted(isGranted);
        setLocationPermissionStatus(isGranted ? 'granted' : 'denied');
        return isGranted;
      } else {
        // iOS permissions are handled automatically by the location service
        setPermissionGranted(true);
        setLocationPermissionStatus('granted');
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermissionStatus('denied');
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }, [setLocationPermissionStatus]);

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    if (!permissionGranted && locationPermissionStatus !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permission to see your position on the map.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      const result: LocationServiceResult = await locationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setCurrentLocation(result.location);
      } else {
        Alert.alert(
          'Location Error',
          result.message || 'Failed to get current location',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get current location. Please check your GPS settings.',
        [{ text: 'OK' }]
      );
    }
  }, [permissionGranted, locationPermissionStatus, requestLocationPermission, setCurrentLocation]);

  // Handle permission denied scenarios
  const handlePermissionDenied = useCallback(() => {
    Alert.alert(
      'Location Permission Denied',
      'Location permission is required to show your position on the map. You can enable it in your device settings.',
      [
        { text: 'Cancel' },
        { text: 'Try Again', onPress: requestLocationPermission }
      ]
    );
  }, [requestLocationPermission]);

  // Check initial permission status
  useEffect(() => {
    if (locationPermissionStatus === 'granted') {
      setPermissionGranted(true);
    }
  }, [locationPermissionStatus]);

  return {
    currentLocation,
    permissionGranted,
    isRequestingPermission,
    locationPermissionStatus,
    requestLocationPermission,
    getCurrentLocation,
    handlePermissionDenied,
  };
};