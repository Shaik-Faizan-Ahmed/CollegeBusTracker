import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Location} from '@cvr-bus-tracker/shared-types';

export interface LocationStatusProps {
  location: Location | null;
  accuracy: number | null;
  isTracking: boolean;
  error: string | null;
  showCoordinates?: boolean;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  location,
  accuracy,
  isTracking,
  error,
  showCoordinates = false,
}) => {
  const getStatusColor = (): string => {
    if (error) return '#E53E3E';
    if (!location) return '#A0A0A0';
    if (accuracy && accuracy <= 10) return '#38A169';
    if (accuracy && accuracy <= 20) return '#D69E2E';
    return '#E53E3E';
  };

  const getStatusText = (): string => {
    if (error) return 'Location Error';
    if (!location) return 'No Location';
    if (isTracking) return 'Tracking Active';
    return 'Location Found';
  };

  const getAccuracyText = (): string => {
    if (!accuracy) return 'Unknown accuracy';
    if (accuracy <= 5) return 'Excellent accuracy';
    if (accuracy <= 10) return 'Good accuracy';
    if (accuracy <= 20) return 'Fair accuracy';
    return 'Poor accuracy';
  };

  const formatCoordinate = (value: number, digits: number = 6): string => {
    return value.toFixed(digits);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, {backgroundColor: getStatusColor()}]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {location && (
        <>
          {showCoordinates && (
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinateLabel}>Coordinates:</Text>
              <Text style={styles.coordinateText}>
                {formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}
              </Text>
            </View>
          )}

          <View style={styles.accuracyContainer}>
            <Text style={styles.accuracyLabel}>Accuracy:</Text>
            <Text style={[styles.accuracyValue, {color: getStatusColor()}]}>
              {accuracy ? `±${Math.round(accuracy)}m` : 'Unknown'}
            </Text>
            <Text style={styles.accuracyDescription}>
              ({getAccuracyText()})
            </Text>
          </View>

          <View style={styles.timestampContainer}>
            <Text style={styles.timestampLabel}>Last updated:</Text>
            <Text style={styles.timestampValue}>
              {formatTimestamp(location.timestamp)}
            </Text>
          </View>
        </>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  coordinatesContainer: {
    marginVertical: 4,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  coordinateText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2D3748',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginRight: 4,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  accuracyDescription: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestampLabel: {
    fontSize: 12,
    color: '#718096',
    marginRight: 4,
  },
  timestampValue: {
    fontSize: 12,
    color: '#4A5568',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FED7D7',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#C53030',
  },
});