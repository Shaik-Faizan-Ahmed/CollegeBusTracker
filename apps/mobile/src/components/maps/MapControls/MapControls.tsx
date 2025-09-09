import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MapControlsProps {
  onCenterOnBus: () => void;
  onToggleUserLocation: () => void;
  showUserLocation: boolean;
  hasActiveBus: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onCenterOnBus,
  onToggleUserLocation,
  showUserLocation,
  hasActiveBus,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !hasActiveBus && styles.disabledButton]}
        onPress={onCenterOnBus}
        disabled={!hasActiveBus}
      >
        <Text style={styles.buttonIcon}>🎯</Text>
        <Text style={[styles.buttonText, !hasActiveBus && styles.disabledText]}>
          Center on Bus
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, showUserLocation && styles.activeButton]}
        onPress={onToggleUserLocation}
      >
        <Text style={styles.buttonIcon}>📍</Text>
        <Text style={[styles.buttonText, showUserLocation && styles.activeButtonText]}>
          My Location
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
  },
  activeButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#999999',
  },
});

export default MapControls;