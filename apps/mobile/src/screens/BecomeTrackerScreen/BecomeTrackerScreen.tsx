import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KeepAwake from 'react-native-keep-awake';
import { RootStackParamList } from '@cvr-bus-tracker/shared-types';
import { useAppStore } from '../../store';
import { TrackerStatus, StopTrackingButton, TrackerConflict } from './components';

type BecomeTrackerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BecomeTracker'
>;

type BecomeTrackerScreenRouteProp = RouteProp<
  RootStackParamList,
  'BecomeTracker'
>;

export const BecomeTrackerScreen: React.FC = () => {
  const navigation = useNavigation<BecomeTrackerScreenNavigationProp>();
  const route = useRoute<BecomeTrackerScreenRouteProp>();
  const [showConflict, setShowConflict] = useState(false);
  const [conflictBusNumber, setConflictBusNumber] = useState<string | null>(null);

  const {
    // State
    isActiveTracker,
    trackingSession,
    trackerStatus,
    trackerError,
    selectedBus,
    // Actions
    startTracking,
    stopTracking,
    setTrackerError,
  } = useAppStore();

  // Get bus number from route params or use selected bus
  const busNumber = route.params?.busNumber || selectedBus;

  useEffect(() => {
    // Keep screen awake when actively tracking
    if (isActiveTracker && trackerStatus === 'active') {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }

    // Cleanup on unmount
    return () => {
      KeepAwake.deactivate();
    };
  }, [isActiveTracker, trackerStatus]);

  useEffect(() => {
    // Handle tracker errors
    if (trackerError === 'BUS_ALREADY_TRACKED') {
      setShowConflict(true);
      setConflictBusNumber(busNumber);
      setTrackerError(null); // Clear error after handling
    }
  }, [trackerError, busNumber, setTrackerError]);

  const handleStartTracking = async () => {
    if (!busNumber) {
      Alert.alert(
        'No Bus Selected',
        'Please select a bus number to track.',
        [
          {
            text: 'Select Bus',
            onPress: () => navigation.navigate('BusSelector', { mode: 'tracker' }),
          },
          { text: 'Cancel' },
        ]
      );
      return;
    }

    try {
      await startTracking(busNumber);
      setShowConflict(false);
    } catch (error) {
      if (error instanceof Error && error.message === 'BUS_ALREADY_TRACKED') {
        setShowConflict(true);
        setConflictBusNumber(busNumber);
      } else {
        Alert.alert(
          'Tracking Failed',
          error instanceof Error ? error.message : 'Unable to start tracking. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
      setShowConflict(false);
    } catch (error) {
      // Error is handled in the StopTrackingButton component
      throw error;
    }
  };

  const handleTryDifferentBus = () => {
    setShowConflict(false);
    navigation.navigate('BusSelector', { mode: 'tracker' });
  };

  const handleRetryTracking = () => {
    setShowConflict(false);
    if (busNumber) {
      handleStartTracking();
    }
  };

  const handleGoBack = () => {
    if (isActiveTracker) {
      Alert.alert(
        'Stop Tracking?',
        'Going back will stop location tracking. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Back',
            onPress: async () => {
              try {
                await stopTracking();
                navigation.navigate('Home');
              } catch (error) {
                // Force navigation even if stop fails
                navigation.navigate('Home');
              }
            },
          },
        ]
      );
    } else {
      navigation.navigate('Home');
    }
  };

  const renderContent = () => {
    if (showConflict && conflictBusNumber) {
      return (
        <TrackerConflict
          busNumber={conflictBusNumber}
          onTryDifferentBus={handleTryDifferentBus}
          onRetry={handleRetryTracking}
        />
      );
    }

    return (
      <>
        {/* Bus Number Display */}
        {busNumber && (
          <View style={styles.busNumberContainer}>
            <Text style={styles.busNumberLabel}>Selected Bus</Text>
            <Text style={styles.busNumberText}>{busNumber}</Text>
          </View>
        )}

        {/* Tracker Status */}
        <TrackerStatus
          busNumber={trackingSession?.busNumber || busNumber}
          status={trackerStatus}
          error={trackerError}
        />

        {/* Loading State */}
        {(trackerStatus === 'starting' || trackerStatus === 'stopping') && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>
              {trackerStatus === 'starting' ? 'Starting tracking...' : 'Stopping tracking...'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {!isActiveTracker ? (
            <TouchableOpacity
              style={[
                styles.startButton,
                (trackerStatus === 'starting') && styles.buttonDisabled,
              ]}
              onPress={handleStartTracking}
              disabled={trackerStatus === 'starting'}
              testID="start-tracking-button"
            >
              <Text style={styles.startButtonText}>
                {trackerStatus === 'starting' ? 'Starting...' : 'Become Tracker'}
              </Text>
            </TouchableOpacity>
          ) : (
            <StopTrackingButton
              onStopTracking={handleStopTracking}
              busNumber={trackingSession?.busNumber}
              status={trackerStatus}
              disabled={trackerStatus === 'stopping'}
            />
          )}

          {!busNumber && (
            <TouchableOpacity
              style={styles.selectBusButton}
              onPress={() => navigation.navigate('BusSelector', { mode: 'tracker' })}
              testID="select-bus-button"
            >
              <Text style={styles.selectBusButtonText}>Select Bus Number</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Become Tracker</Text>
          <Text style={styles.subtitle}>
            Share your bus location with other students in real-time
          </Text>
        </View>

        {renderContent()}

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          testID="back-button"
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  busNumberContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 200,
  },
  busNumberLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  busNumberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
  },
  buttonsContainer: {
    width: '100%',
    marginVertical: 24,
    gap: 16,
  },
  startButton: {
    backgroundColor: '#2ecc71',
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
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectBusButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  selectBusButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});