/**
 * CVR Bus Tracker Mobile App
 *
 * @format
 */

import React, {useRef} from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@cvr-bus-tracker/shared-types';

import {HomeScreen, TrackBusScreen, BecomeTrackerScreen, MapScreen} from './src/screens';
import {setNavigationRef} from './src/services/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): JSX.Element {
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);

  React.useEffect(() => {
    setNavigationRef(navigationRef);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Hide headers for cleaner UI
          animation: 'slide_from_right', // Smooth transitions
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            orientation: 'default', // Allow rotation
          }}
        />
        <Stack.Screen
          name="TrackBus"
          component={TrackBusScreen}
          options={{
            orientation: 'default',
          }}
        />
        <Stack.Screen
          name="BecomeTracker"
          component={BecomeTrackerScreen}
          options={{
            orientation: 'default',
          }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            orientation: 'default',
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
