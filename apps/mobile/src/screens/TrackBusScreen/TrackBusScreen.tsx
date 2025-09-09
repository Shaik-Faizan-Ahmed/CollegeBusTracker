import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { RootStackParamList, BusLocation, LocationUpdate } from '@cvr-bus-tracker/shared-types';
import { useAppStore } from '../../store/appStore';
import { useConsumerWebSocket } from '../../hooks/useConsumerWebSocket';
import { mapService } from '../../services/mapService';
import { BusLocationMarker, UserLocationMarker, NoTrackerMessage } from './components';

type TrackBusScreenRouteProp = RouteProp<RootStackParamList, 'TrackBus'>;
type TrackBusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TrackBus'>;

interface Props {
  route: TrackBusScreenRouteProp;
  navigation: TrackBusScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export const TrackBusScreen: React.FC<Props> = ({ route, navigation }) => {
  const { busNumber } = route.params || {};
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<BusLocation | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    consumerTracking,
    locationLoadingState,
    locationError,
    startConsumerTracking,
    stopConsumerTracking,
    updateConsumerBusLocation,
    currentLocation,
  } = useAppStore();

  const debouncedMapUpdate = mapService.debounce((location: BusLocation) => {
    const newRegion = mapService.getMapRegion(location, 'medium');
    setMapRegion(newRegion);
  }, 1000);

  const handleLocationUpdate = useCallback((locationData: LocationUpdate) => {
    updateConsumerBusLocation(locationData);
    
    // Update map region with debouncing to prevent jarring
    if (mapService.isLocationAccurate({ 
      latitude: locationData.latitude, 
      longitude: locationData.longitude, 
      accuracy: locationData.accuracy, 
      timestamp: new Date(locationData.timestamp) 
    }, 100)) {
      debouncedMapUpdate({ 
        latitude: locationData.latitude, 
        longitude: locationData.longitude, 
        accuracy: locationData.accuracy, 
        timestamp: new Date(locationData.timestamp) 
      });
    }
  }, [updateConsumerBusLocation, debouncedMapUpdate]);

  const handleTrackerDisconnected = useCallback((data: { busNumber: string; reason: string }) => {
    Alert.alert(
      'Tracker Disconnected', 
      `Bus ${data.busNumber} tracker has disconnected. Location updates will stop.`,
      [
        { text: 'OK', onPress: () => {} },
        { text: 'Try Again', onPress: () => initializeTracking() }
      ]
    );
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log('WebSocket connection changed:', connected);
  }, []);

  const { connect: connectWebSocket, disconnect: disconnectWebSocket } = useConsumerWebSocket({
    onLocationUpdate: handleLocationUpdate,
    onTrackerDisconnected: handleTrackerDisconnected,
    onConnectionChange: handleConnectionChange,
  });

  const initializeTracking = useCallback(async () => {
    if (!busNumber) {
      navigation.goBack();
      return;
    }

    try {
      await startConsumerTracking(busNumber);
      connectWebSocket(busNumber);
    } catch (error) {
      console.error('Failed to start consumer tracking:', error);
      // Error is already handled in the store, just log it
    }
  }, [busNumber, startConsumerTracking, connectWebSocket, navigation]);

  const handleRefresh = useCallback(() => {
    initializeTracking();
  }, [initializeTracking]);

  const handleTryDifferentBus = useCallback(() => {
    navigation.navigate('BusSelector', { mode: 'track' });
  }, [navigation]);

  const handleMapPress = useCallback(() => {
    // Handle map interactions if needed
  }, []);

  // Initialize tracking on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeTracking();
      setIsInitialized(true);
    }
  }, [initializeTracking, isInitialized]);

  // Set initial map region when bus location is available
  useEffect(() => {
    if (consumerTracking?.busLocation && !mapRegion) {
      const region = mapService.getMapRegion(consumerTracking.busLocation, 'medium');
      setMapRegion(region);
    }
  }, [consumerTracking?.busLocation, mapRegion]);

  // Set user location from current location
  useEffect(() => {
    if (currentLocation) {
      setUserLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        timestamp: new Date(currentLocation.timestamp),
      });
    }
  }, [currentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      stopConsumerTracking();
    };
  }, [disconnectWebSocket, stopConsumerTracking]);

  const showNoTracker = locationError && locationError.includes('No active tracker');
  const busLocation = consumerTracking?.busLocation;

  return (
    <View style={styles.container}>
      {mapRegion && (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          onPress={handleMapPress}
          onRegionChangeComplete={(region) => {
            // Don't update state here to avoid conflicts with programmatic updates
          }}
        >
          {busLocation && busNumber && (
            <BusLocationMarker
              busLocation={busLocation}
              busNumber={busNumber}
              onPress={() => {}}
            />
          )}
          
          {userLocation && (
            <UserLocationMarker
              userLocation={userLocation}
              onPress={() => {}}
            />
          )}
        </MapView>
      )}

      {showNoTracker && busNumber && (
        <NoTrackerMessage
          busNumber={busNumber}
          onRefresh={handleRefresh}
          onTryDifferentBus={handleTryDifferentBus}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
});