import {useEffect, useCallback} from 'react';
import {Alert, AppState, AppStateStatus} from 'react-native';
import {Location} from '@cvr-bus-tracker/shared-types';
import {locationService, LocationServiceResult} from '../services/location';
import {requestLocationPermission, LocationPermissionResult} from '../services/permissions';
import {useAppStore} from '../store/appStore';

export type LocationLoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  requestPermission?: boolean;
  enableBackgroundTracking?: boolean;
}

export interface UseLocationReturn {
  // Current state
  currentLocation: Location | null;
  isTracking: boolean;
  loadingState: LocationLoadingState;
  locationError: string | null;
  permissionStatus: 'granted' | 'denied' | 'unknown';
  accuracy: number | null;
  signalStrength: 'none' | 'weak' | 'good' | 'excellent';
  
  // Actions
  getCurrentLocation: () => Promise<void>;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  requestPermission: () => Promise<void>;
}

export const useLocation = (options: UseLocationOptions = {}): UseLocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 30000,
    requestPermission: autoRequestPermission = false,
  } = options;

  const {
    currentLocation,
    isLocationTracking,
    locationLoadingState,
    locationError,
    locationPermissionStatus,
    setCurrentLocation,
    setLocationTracking,
    setLocationLoadingState,
    setLocationError,
    setLocationPermissionStatus,
  } = useAppStore();

  const accuracy = currentLocation?.accuracy ?? null;
  const signalStrength = accuracy ? locationService.getSignalStrength(accuracy) : 'none';

  // Handle app state changes for battery optimization
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isLocationTracking) {
        // Optionally pause tracking in background to save battery
        // For now, we'll keep tracking active for bus tracker functionality
        console.log('App moved to background, location tracking continues');
      } else if (nextAppState === 'active' && isLocationTracking) {
        console.log('App moved to foreground, location tracking active');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isLocationTracking]);

  // Auto-request permission on mount if enabled
  useEffect(() => {
    if (autoRequestPermission && locationPermissionStatus === 'unknown') {
      requestPermission();
    }
  }, [autoRequestPermission, locationPermissionStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      locationService.stopLocationTracking();
    };
  }, []);

  const handleLocationResult = useCallback((result: LocationServiceResult) => {
    if (result.success && result.location) {
      setCurrentLocation(result.location);
      setLocationLoadingState('success');
      setLocationError(null);
    } else {
      setLocationLoadingState('error');
      setLocationError(result.message || 'Unknown location error');
      
      // Show user-friendly error alerts for critical errors
      if (result.error === 'permission_denied') {
        Alert.alert(
          'Location Permission Required',
          'Please grant location permission to use bus tracking features.',
          [{text: 'OK'}]
        );
      } else if (result.error === 'timeout') {
        Alert.alert(
          'GPS Timeout',
          'Unable to get your location. Please ensure GPS is enabled and try again.',
          [{text: 'OK'}]
        );
      }
    }
  }, [setCurrentLocation, setLocationLoadingState, setLocationError]);

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    if (locationPermissionStatus !== 'granted') {
      await requestPermission();
      return;
    }

    setLocationLoadingState('loading');
    setLocationError(null);

    try {
      const result = await locationService.getCurrentLocation(timeout, enableHighAccuracy);
      handleLocationResult(result);
    } catch (error) {
      setLocationLoadingState('error');
      setLocationError('Failed to get current location');
    }
  }, [locationPermissionStatus, timeout, enableHighAccuracy, handleLocationResult, setLocationLoadingState, setLocationError]);

  const startLocationTracking = useCallback(async (): Promise<void> => {
    if (locationPermissionStatus !== 'granted') {
      await requestPermission();
      return;
    }

    if (isLocationTracking) {
      return;
    }

    setLocationLoadingState('loading');
    setLocationError(null);
    setLocationTracking(true);

    try {
      locationService.startLocationTracking(handleLocationResult, {
        enableHighAccuracy,
        timeout,
        interval: 5000, // Update every 5 seconds for bus tracking
        maximumAge: 5000,
      });
    } catch (error) {
      setLocationLoadingState('error');
      setLocationError('Failed to start location tracking');
      setLocationTracking(false);
    }
  }, [
    locationPermissionStatus,
    isLocationTracking,
    enableHighAccuracy,
    timeout,
    handleLocationResult,
    setLocationLoadingState,
    setLocationError,
    setLocationTracking,
  ]);

  const stopLocationTracking = useCallback((): void => {
    locationService.stopLocationTracking();
    setLocationTracking(false);
    setLocationLoadingState('idle');
  }, [setLocationTracking, setLocationLoadingState]);

  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      const result: LocationPermissionResult = await requestLocationPermission();
      
      if (result.status === 'granted') {
        setLocationPermissionStatus('granted');
      } else {
        setLocationPermissionStatus('denied');
        
        // Show appropriate error message
        if (result.message) {
          Alert.alert('Permission Required', result.message, [{text: 'OK'}]);
        }
      }
    } catch (error) {
      setLocationPermissionStatus('denied');
      Alert.alert(
        'Permission Error',
        'Failed to request location permission. Please try again.',
        [{text: 'OK'}]
      );
    }
  }, [setLocationPermissionStatus]);

  return {
    // Current state
    currentLocation,
    isTracking: isLocationTracking,
    loadingState: locationLoadingState,
    locationError,
    permissionStatus: locationPermissionStatus,
    accuracy,
    signalStrength,
    
    // Actions
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    requestPermission,
  };
};