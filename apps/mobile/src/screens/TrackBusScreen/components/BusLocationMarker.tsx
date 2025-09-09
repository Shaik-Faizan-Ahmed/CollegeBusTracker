import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { BusLocation } from '@cvr-bus-tracker/shared-types';

interface BusLocationMarkerProps {
  busLocation: BusLocation;
  busNumber: string;
  onPress?: () => void;
}

export const BusLocationMarker: React.FC<BusLocationMarkerProps> = ({
  busLocation,
  busNumber,
  onPress
}) => {
  const coordinate = {
    latitude: busLocation.latitude,
    longitude: busLocation.longitude,
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy <= 20) return '#4CAF50'; // Good accuracy - green
    if (accuracy <= 50) return '#FF9800'; // Fair accuracy - orange
    return '#F44336'; // Poor accuracy - red
  };

  return (
    <Marker
      coordinate={coordinate}
      identifier={`bus-${busNumber}`}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.markerContainer, { borderColor: getAccuracyColor(busLocation.accuracy) }]}>
        <View style={styles.busIcon}>
          <Text style={styles.busNumber}>{busNumber}</Text>
        </View>
        <View style={styles.markerTriangle} />
      </View>
      
      <Callout style={styles.callout}>
        <View style={styles.calloutContent}>
          <Text style={styles.calloutTitle}>Bus {busNumber}</Text>
          <Text style={styles.calloutSubtitle}>
            Last updated: {formatTime(busLocation.timestamp)}
          </Text>
          <Text style={styles.calloutAccuracy}>
            Accuracy: {Math.round(busLocation.accuracy)}m
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  busIcon: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  busNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2196F3',
    marginTop: -3,
  },
  callout: {
    width: 150,
    borderRadius: 8,
  },
  calloutContent: {
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  calloutAccuracy: {
    fontSize: 11,
    color: '#999',
  },
});