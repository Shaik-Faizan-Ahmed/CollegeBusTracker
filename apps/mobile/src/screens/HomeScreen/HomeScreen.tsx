import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@cvr-bus-tracker/shared-types';
import {useAppStore} from '../../store';
import {GPSIndicator} from '../../components/common';
import {useLocation} from '../../hooks/useLocation';
import {
  requestLocationPermission,
  showPermissionAlert,
} from '../../services/permissions';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {navigateToScreen, setUserRole} = useAppStore();
  const {permissionStatus, accuracy, signalStrength} = useLocation({requestPermission: true});

  useEffect(() => {
    // Request location permission when the app starts
    const initializePermissions = async () => {
      const result = await requestLocationPermission();
      if (result.status !== 'granted') {
        showPermissionAlert(result);
      }
    };

    initializePermissions();
  }, []);

  const handleTrackBus = async () => {
    const result = await requestLocationPermission();
    if (result.status === 'granted') {
      setUserRole('consumer');
      navigateToScreen('TrackBus');
      navigation.navigate('TrackBus');
    } else {
      showPermissionAlert(result);
    }
  };

  const handleBecomeTracker = async () => {
    const result = await requestLocationPermission();
    if (result.status === 'granted') {
      setUserRole('tracker');
      navigateToScreen('BecomeTracker');
      navigation.navigate('BecomeTracker');
    } else {
      showPermissionAlert(result);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.content}>
        {/* App Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.title}>CVR Bus Tracker</Text>
          <Text style={styles.subtitle}>
            Real-time bus tracking for students
          </Text>
        </View>

        {/* Location Permission Status */}
        <View style={styles.permissionStatusContainer}>
          <GPSIndicator 
            signalStrength={permissionStatus === 'granted' ? signalStrength : 'none'}
            accuracy={permissionStatus === 'granted' ? accuracy : null}
            showLabel={true}
          />
          {permissionStatus === 'denied' && (
            <Text style={styles.permissionWarning}>
              Location permission required for bus tracking
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTrackBus}
            activeOpacity={0.8}
            testID="track-bus-button">
            <Text style={styles.primaryButtonText}>Track Bus</Text>
            <Text style={styles.buttonSubtext}>Find your bus location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBecomeTracker}
            activeOpacity={0.8}
            testID="become-tracker-button">
            <Text style={styles.secondaryButtonText}>Become Tracker</Text>
            <Text style={styles.buttonSubtext}>Share bus location</Text>
          </TouchableOpacity>
        </View>
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
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  permissionStatusContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  permissionWarning: {
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  secondaryButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
