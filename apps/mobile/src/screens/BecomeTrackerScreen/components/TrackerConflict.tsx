import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TrackerConflictProps {
  busNumber: string;
  onTryDifferentBus: () => void;
  onRetry: () => void;
}

export const TrackerConflict: React.FC<TrackerConflictProps> = ({
  busNumber,
  onTryDifferentBus,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      
      <Text style={styles.title}>Bus Already Being Tracked</Text>
      
      <Text style={styles.message}>
        Bus {busNumber} already has an active tracker. Only one person can track each bus at a time.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onTryDifferentBus}
          testID="try-different-bus-button"
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            Try Different Bus
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onRetry}
          testID="retry-button"
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#856404',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#856404',
  },
});