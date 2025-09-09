import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { BusLocationMarkerProps } from '../../../types/map';

const BusLocationMarker: React.FC<BusLocationMarkerProps> = ({
  coordinate,
  busNumber,
  isActive,
  lastUpdated,
}) => {
  const isRecent = Date.now() - lastUpdated.getTime() < 60000; // Last updated within 1 minute

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
    >
      <View style={[
        styles.markerContainer,
        isActive && isRecent ? styles.activeMarker : styles.inactiveMarker
      ]}>
        <View style={styles.busIcon}>
          <Text style={styles.busIconText}>🚌</Text>
        </View>
        <View style={styles.busNumberContainer}>
          <Text style={styles.busNumberText}>{busNumber}</Text>
        </View>
        {!isRecent && (
          <View style={styles.staleIndicator}>
            <Text style={styles.staleText}>⚠️</Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMarker: {
    opacity: 1,
  },
  inactiveMarker: {
    opacity: 0.7,
  },
  busIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  busIconText: {
    fontSize: 16,
  },
  busNumberContainer: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  busNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  staleIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staleText: {
    fontSize: 8,
  },
});

export default BusLocationMarker;