import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface ValidationErrorProps {
  error: string | null;
  visible?: boolean;
}

const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  visible = true,
}) => {
  if (!error || !visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text 
        style={styles.errorText}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        {error}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ValidationError;