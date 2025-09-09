import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BusMap } from '../../components/maps/BusMap';
import { MapControls, ConnectionStatus } from '../../components/maps/MapControls';
import { MapScreenProps } from '../../types/map';
import { useAppStore } from '../../store';
import { useUserLocation } from '../../hooks/useUserLocation';
import { websocketService } from '../../services/websocketService';
import { BusLocation, Location, LocationUpdate } from '@cvr-bus-tracker/shared-types';

const MapScreen: React.FC<MapScreenProps> = ({ route, navigation }) => {
  const { busNumber, initialRegion } = route.params;
  
  const {
    consumerTracking,
    currentLocation,
    mapState,
    updateMapRegion,
    toggleUserLocation,
    centerOnBus,
    setMapVisibility,
    startConsumerTracking,
    stopConsumerTracking,
    updateConsumerBusLocation,
  } = useAppStore();

  const {
    permissionGranted,
    isRequestingPermission,
    requestLocationPermission,
    getCurrentLocation,
    handlePermissionDenied,
  } = useUserLocation();

  const [isMapReady, setIsMapReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Initialize consumer tracking and WebSocket connection on mount
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        await startConsumerTracking(busNumber);
        
        // Connect to WebSocket for real-time updates (consumers use bus number)
        await websocketService.connect(`consumer-${busNumber}-${Date.now()}`);
        setIsConnected(websocketService.isConnected());
      } catch (error) {
        Alert.alert(
          'Tracking Error',
          `Failed to start tracking bus ${busNumber}. The bus may not be active.`,
          [
            { text: 'Try Again', onPress: initializeTracking },
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
        setIsConnected(false);
      }
    };

    initializeTracking();
    setMapVisibility(true);

    return () => {
      websocketService.disconnect();
      stopConsumerTracking();
      setMapVisibility(false);
    };
  }, [busNumber]);

  // Setup WebSocket event listeners
  useEffect(() => {
    // Handle real-time location updates
    const handleLocationUpdate = (locationUpdate: LocationUpdate) => {
      if (locationUpdate.busNumber === busNumber) {
        updateConsumerBusLocation(locationUpdate);
        setIsConnected(true);
        setIsReconnecting(false);
      }
    };

    // Handle tracker disconnection
    const handleTrackerDisconnected = (data: { busNumber: string; reason: string }) => {
      if (data.busNumber === busNumber) {
        Alert.alert(
          'Tracker Disconnected',
          `The tracker for bus ${busNumber} has disconnected. Real-time updates are no longer available.`,
          [{ text: 'OK' }]
        );
        setIsConnected(false);
      }
    };

    // Setup event listeners
    websocketService.onLocationUpdated(handleLocationUpdate);
    websocketService.onTrackerDisconnected(handleTrackerDisconnected);

    // Monitor connection status
    const connectionInterval = setInterval(() => {
      const connected = websocketService.isConnected();
      setIsConnected(connected);
      
      if (!connected && consumerTracking) {
        setIsReconnecting(true);
      }
    }, 2000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, [busNumber, updateConsumerBusLocation, consumerTracking]);

  // Handle hardware back button on Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        stopConsumerTracking();
        return false; // Let the default behavior handle navigation
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  const handleRegionChange = useCallback((region) => {
    updateMapRegion(region);
  }, [updateMapRegion]);

  const handleCenterOnBus = useCallback(() => {
    if (consumerTracking?.busLocation) {
      centerOnBus(busNumber);
      // The BusMap component will handle the actual centering animation
    }
  }, [consumerTracking?.busLocation, busNumber, centerOnBus]);

  const handleToggleUserLocation = useCallback(async () => {
    if (!mapState.showUserLocation) {
      // Turning on user location
      if (!permissionGranted) {
        const granted = await requestLocationPermission();
        if (!granted) {
          handlePermissionDenied();
          return;
        }
      }
      // Get current location and toggle visibility
      await getCurrentLocation();
    }
    toggleUserLocation();
  }, [mapState.showUserLocation, permissionGranted, requestLocationPermission, handlePermissionDenied, getCurrentLocation, toggleUserLocation]);

  // Get bus location for map display
  const busLocation: BusLocation | undefined = consumerTracking?.busLocation;
  const userLocation: Location | undefined = currentLocation || undefined;

  return (
    <View style={styles.container}>
      <BusMap
        busNumber={busNumber}
        busLocation={busLocation}
        userLocation={userLocation}
        showUserLocation={mapState.showUserLocation}
        onMapReady={handleMapReady}
        onRegionChange={handleRegionChange}
      />
      
      <ConnectionStatus
        isConnected={isConnected}
        isReconnecting={isReconnecting}
      />

      {isMapReady && (
        <MapControls
          onCenterOnBus={handleCenterOnBus}
          onToggleUserLocation={handleToggleUserLocation}
          showUserLocation={mapState.showUserLocation}
          hasActiveBus={!!busLocation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapScreen;