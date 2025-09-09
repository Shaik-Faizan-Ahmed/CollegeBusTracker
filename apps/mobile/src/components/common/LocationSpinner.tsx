import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

export interface LocationSpinnerProps {
  isLoading: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LocationSpinner: React.FC<LocationSpinnerProps> = ({
  isLoading,
  message = 'Getting your location...',
  size = 'large',
  color = '#3182CE',
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>
        Please ensure GPS is enabled and you have a clear view of the sky
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginVertical: 8,
  },
  message: {
    fontSize: 16,
    color: '#2D3748',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  hint: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});