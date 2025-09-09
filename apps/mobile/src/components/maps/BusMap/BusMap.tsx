import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Alert, Platform } from 'react-native';
import MapView from 'react-native-maps';
import { BusLocation, Location } from '@cvr-bus-tracker/shared-types';
import { MapRegion, CAMPUS_REGION } from '../../../types/map';
import { MapService } from '../../../services/mapService';
import BusLocationMarker from './BusLocationMarker';
import UserLocationMarker from './UserLocationMarker';

interface BusMapProps {
  busNumber: string;
  busLocation?: BusLocation;
  userLocation?: Location;
  showUserLocation?: boolean;
  onMapReady?: () => void;
  onRegionChange?: (region: MapRegion) => void;
}

const BusMap: React.FC<BusMapProps> = ({
  busNumber,
  busLocation,
  userLocation,
  showUserLocation = false,
  onMapReady,
  onRegionChange,
}) => {
  const mapRef = useRef<MapView>(null);

  // Debounced region change handler
  const debouncedRegionChange = useCallback(
    MapService.debounce((region: MapRegion) => {
      onRegionChange?.(region);
    }, 500),
    [onRegionChange]
  );

  // Performance optimizations based on device capability
  const mapPerformanceConfig = useMemo(() => {
    // Reduce quality on Android devices for better performance
    const isLowEndDevice = Platform.OS === 'android';
    
    return {
      zoomControlEnabled: false,
      scrollEnabled: true,
      zoomEnabled: true,
      rotateEnabled: false,
      pitchEnabled: false,
      showsBuildings: !isLowEndDevice,
      showsTraffic: false,
      showsIndoors: false,
      loadingEnabled: true,
      loadingBackgroundColor: '#f0f0f0',
      loadingIndicatorColor: '#2196F3',
      maxZoomLevel: 18,
      minZoomLevel: 10,
    };
  }, []);

  // Calculate initial region
  const getInitialRegion = (): MapRegion => {
    if (busLocation) {
      return MapService.calculateRegionForBus(busLocation);
    }
    return CAMPUS_REGION;
  };

  // Center map on bus location
  const centerOnBus = useCallback(() => {
    if (busLocation && mapRef.current) {
      const region = MapService.calculateRegionForBus(busLocation);
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [busLocation]);

  // Update map region when bus location changes (with performance optimization)
  useEffect(() => {
    if (busLocation && mapRef.current) {
      const newRegion = MapService.calculateRegionForBus(busLocation);
      // Use shorter animation time for better performance on slower devices
      const animationDuration = Platform.OS === 'android' ? 500 : 1000;
      mapRef.current.animateToRegion(newRegion, animationDuration);
    }
  }, [busLocation?.latitude, busLocation?.longitude]);

  // Memoized markers to prevent unnecessary re-renders
  const busMarker = useMemo(() => {
    if (!busLocation) return null;
    
    return (
      <BusLocationMarker
        coordinate={{
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
        }}
        busNumber={busNumber}
        isActive={true}
        lastUpdated={new Date(busLocation.lastUpdated || Date.now())}
      />
    );
  }, [busLocation?.latitude, busLocation?.longitude, busNumber, busLocation?.lastUpdated]);

  const userMarker = useMemo(() => {
    if (!showUserLocation || !userLocation) return null;
    
    return (
      <UserLocationMarker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        accuracy={userLocation.accuracy}
        showAccuracyCircle={true}
      />
    );
  }, [showUserLocation, userLocation?.latitude, userLocation?.longitude, userLocation?.accuracy]);

  const handleMapError = (error: any) => {
    console.error('Map error:', error);
    
    // Check for Google Maps API key issues
    const errorMessage = error.message || '';
    if (errorMessage.includes('API_KEY') || errorMessage.includes('unauthorized')) {
      Alert.alert(
        'Google Maps Setup Required',
        'Google Maps API key is missing or invalid. Please check the setup documentation for configuration instructions.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Map Error',
        'There was an issue loading the map. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={getInitialRegion()}
      onMapReady={onMapReady}
      onRegionChangeComplete={debouncedRegionChange}
      onError={handleMapError}
      showsUserLocation={false} // We handle this manually
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={true}
      mapType="standard"
      {...mapPerformanceConfig}
    >
      {busMarker}
      {userMarker}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default BusMap;