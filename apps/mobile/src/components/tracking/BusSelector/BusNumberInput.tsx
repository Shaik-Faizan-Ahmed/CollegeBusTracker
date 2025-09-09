import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';

interface BusNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  error?: string | null;
  placeholder?: string;
  isLoading?: boolean;
}

const BusNumberInput: React.FC<BusNumberInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  error,
  placeholder = 'Enter bus number',
  isLoading = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback((text: string) => {
    // Allow alphanumeric input for bus numbers like A1, B2, etc.
    const sanitized = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    onChangeText(sanitized);
  }, [onChangeText]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const keyboardType: KeyboardTypeOptions = 'default'; // Allow both letters and numbers

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bus Number</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError
          ]}
          value={value}
          onChangeText={handleChangeText}
          onSubmitEditing={onSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          returnKeyType="done"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isLoading}
          maxLength={10}
          accessibilityLabel="Bus number input"
          accessibilityHint="Enter the bus number you want to track or operate"
        />
      </View>
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48, // Minimum 44pt touch target + padding
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  input: {
    padding: 12,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputError: {
    color: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BusNumberInput;