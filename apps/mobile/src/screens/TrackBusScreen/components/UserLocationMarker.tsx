import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { BusLocation } from '@cvr-bus-tracker/shared-types';

interface UserLocationMarkerProps {
  userLocation: BusLocation;
  onPress?: () => void;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  userLocation,
  onPress
}) => {
  const coordinate = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  };

  return (
    <Marker
      coordinate={coordinate}
      identifier="user-location"
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.markerContainer}>
        <View style={styles.outerRing}>
          <View style={styles.innerDot} />
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
});