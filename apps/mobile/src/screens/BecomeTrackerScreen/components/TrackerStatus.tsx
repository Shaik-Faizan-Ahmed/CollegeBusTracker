import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrackerStatus as TrackerStatusType } from '../../../store/appStore';

interface TrackerStatusProps {
  busNumber: string | null;
  status: TrackerStatusType;
  error: string | null;
}

export const TrackerStatus: React.FC<TrackerStatusProps> = ({
  busNumber,
  status,
  error,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#2ecc71';
      case 'starting':
        return '#f39c12';
      case 'stopping':
        return '#e67e22';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return `Currently Tracking Bus ${busNumber}`;
      case 'starting':
        return 'Starting tracker...';
      case 'stopping':
        return 'Stopping tracker...';
      case 'error':
        return 'Tracker error occurred';
      default:
        return 'Ready to track';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return '🚌';
      case 'starting':
      case 'stopping':
        return '⏳';
      case 'error':
        return '⚠️';
      default:
        return '📍';
    }
  };

  return (
    <View style={[styles.container, { borderColor: getStatusColor() }]}>
      <View style={styles.statusRow}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {status === 'active' && busNumber && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Other students can now see your bus location in real-time
          </Text>
          <Text style={styles.detailText}>
            Keep this app open and your phone unlocked while tracking
          </Text>
        </View>
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
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  detailText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e74c3c',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    fontWeight: '500',
  },
});