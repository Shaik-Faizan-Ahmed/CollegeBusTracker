import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@cvr-bus-tracker/shared-types';

import BusNumberInput from './BusNumberInput';
import RecentBusList from './RecentBusList';
import ValidationError from './ValidationError';
import { validateBusNumber, sanitizeBusNumberInput } from '../../../services/validation';
import { BusStorageService } from '../../../services/storage';
import { useAppStore } from '../../../store';

interface BusSelectorProps {
  mode: 'track' | 'tracker';
  onBusSelected?: (busNumber: string) => void;
}

const BusSelector: React.FC<BusSelectorProps> = ({
  mode,
  onBusSelected,
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setSelectedBus, addRecentBusNumber, clearRecentBusNumbers } = useAppStore();
  
  const [busNumber, setBusNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recentBuses, setRecentBuses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent bus numbers on component mount
  useEffect(() => {
    loadRecentBuses();
  }, []);

  const loadRecentBuses = useCallback(async () => {
    try {
      const recent = await BusStorageService.getRecentBusNumbers();
      setRecentBuses(recent);
    } catch (error) {
      console.warn('Failed to load recent buses:', error);
    }
  }, []);

  const handleBusNumberChange = useCallback((text: string) => {
    const sanitized = sanitizeBusNumberInput(text);
    setBusNumber(sanitized);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleValidateAndSubmit = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const validation = validateBusNumber(busNumber);
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid bus number');
        setIsLoading(false);
        return;
      }

      const normalizedBusNumber = validation.normalizedValue || busNumber;
      
      // Save to recent buses
      const updatedRecent = await BusStorageService.addRecentBusNumber(normalizedBusNumber);
      setRecentBuses(updatedRecent);
      addRecentBusNumber(normalizedBusNumber);
      
      // Update global state
      setSelectedBus(normalizedBusNumber);
      
      // Call callback if provided
      if (onBusSelected) {
        onBusSelected(normalizedBusNumber);
      }
      
      // Navigate to appropriate screen
      if (mode === 'track') {
        navigation.navigate('TrackBus', { busNumber: normalizedBusNumber });
      } else {
        navigation.navigate('BecomeTracker', { busNumber: normalizedBusNumber });
      }
      
    } catch (error) {
      console.error('Error processing bus number:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [busNumber, isLoading, mode, onBusSelected, navigation, setSelectedBus, addRecentBusNumber]);

  const handleRecentBusSelect = useCallback((selectedBus: string) => {
    setBusNumber(selectedBus);
    setError(null);
  }, []);

  const handleClearHistory = useCallback(async () => {
    Alert.alert(
      'Clear Recent Buses',
      'Are you sure you want to clear all recent bus numbers?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await BusStorageService.clearRecentBusNumbers();
              setRecentBuses([]);
              clearRecentBusNumbers();
            } catch (error) {
              console.warn('Failed to clear recent buses:', error);
            }
          },
        },
      ]
    );
  }, [clearRecentBusNumbers]);

  const submitButtonTitle = mode === 'track' ? 'Track This Bus' : 'Start Tracking';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'track' ? 'Which bus do you want to track?' : 'Which bus are you on?'}
      </Text>
      
      <BusNumberInput
        value={busNumber}
        onChangeText={handleBusNumberChange}
        onSubmit={handleValidateAndSubmit}
        error={error}
        placeholder="e.g. 15, A1, B12"
        isLoading={isLoading}
      />

      <ValidationError error={error} />

      <RecentBusList
        recentBuses={recentBuses}
        onSelectBus={handleRecentBusSelect}
        onClearHistory={handleClearHistory}
      />

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!busNumber || isLoading) && styles.submitButtonDisabled
        ]}
        onPress={handleValidateAndSubmit}
        disabled={!busNumber || isLoading}
        accessibilityRole="button"
        accessibilityLabel={submitButtonTitle}
        accessibilityState={{ disabled: !busNumber || isLoading }}
      >
        <Text style={[
          styles.submitButtonText,
          (!busNumber || isLoading) && styles.submitButtonTextDisabled
        ]}>
          {isLoading ? 'Processing...' : submitButtonTitle}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    minHeight: 48, // Minimum touch target
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButtonTextDisabled: {
    color: '#8E8E93',
  },
});

export default BusSelector;