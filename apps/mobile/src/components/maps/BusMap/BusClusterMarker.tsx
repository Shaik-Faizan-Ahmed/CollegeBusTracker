import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

interface BusClusterMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  busCount: number;
  busNumbers: string[];
}

const BusClusterMarker: React.FC<BusClusterMarkerProps> = ({
  coordinate,
  busCount,
  busNumbers,
}) => {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
    >
      <View style={styles.clusterContainer}>
        <View style={[styles.clusterCircle, getClusterStyle(busCount)]}>
          <Text style={styles.clusterText}>{busCount}</Text>
        </View>
        <View style={styles.busNumbersContainer}>
          <Text style={styles.busNumbersText}>
            {busNumbers.slice(0, 3).join(', ')}
            {busNumbers.length > 3 ? '...' : ''}
          </Text>
        </View>
      </View>
    </Marker>
  );
};

const getClusterStyle = (count: number) => {
  if (count >= 10) {
    return { backgroundColor: '#E91E63', width: 50, height: 50 };
  }
  if (count >= 5) {
    return { backgroundColor: '#FF9800', width: 45, height: 45 };
  }
  return { backgroundColor: '#4CAF50', width: 40, height: 40 };
};

const styles = StyleSheet.create({
  clusterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterCircle: {
    borderRadius: 25,
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
  clusterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  busNumbersContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    maxWidth: 120,
  },
  busNumbersText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default BusClusterMarker;