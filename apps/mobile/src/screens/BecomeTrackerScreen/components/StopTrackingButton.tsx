import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { TrackerStatus } from '../../../store/appStore';

interface StopTrackingButtonProps {
  onStopTracking: () => Promise<void>;
  busNumber: string | null;
  status: TrackerStatus;
  disabled?: boolean;
}

export const StopTrackingButton: React.FC<StopTrackingButtonProps> = ({
  onStopTracking,
  busNumber,
  status,
  disabled = false,
}) => {
  const handlePress = () => {
    Alert.alert(
      'Stop Tracking?',
      `Are you sure you want to stop tracking Bus ${busNumber}? Other students will no longer see your location.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            try {
              await onStopTracking();
            } catch (error) {
              Alert.alert(
                'Stop Tracking Failed',
                'Unable to stop tracking. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const isLoading = status === 'stopping';
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      testID="stop-tracking-button"
    >
      <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
        {isLoading ? 'Stopping...' : 'Stop Tracking'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonTextDisabled: {
    color: '#bdc3c7',
  },
});