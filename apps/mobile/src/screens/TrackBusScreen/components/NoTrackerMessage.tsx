import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NoTrackerMessageProps {
  busNumber: string;
  onTryDifferentBus?: () => void;
  onRefresh?: () => void;
}

export const NoTrackerMessage: React.FC<NoTrackerMessageProps> = ({
  busNumber,
  onTryDifferentBus,
  onRefresh
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.icon}>🚌</Text>
        <Text style={styles.title}>No Active Tracker</Text>
        <Text style={styles.message}>
          Bus {busNumber} doesn't have an active tracker right now.
        </Text>
        <Text style={styles.suggestion}>
          The bus might not be running yet, or no one is currently tracking it.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {onRefresh && (
          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]} 
            onPress={onRefresh}
          >
            <Text style={[styles.buttonText, styles.refreshButtonText]}>
              Check Again
            </Text>
          </TouchableOpacity>
        )}

        {onTryDifferentBus && (
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={onTryDifferentBus}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Try Different Bus
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestion: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButtonText: {
    color: '#666',
  },
  primaryButtonText: {
    color: 'white',
  },
});