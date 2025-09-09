// Test setup for React Native mobile app

// Set up environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.API_BASE_URL = 'http://localhost:3001';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const MockView = (props: any) => React.createElement('View', props);

  return {
    __esModule: true,
    default: MockView,
    Marker: MockView,
    Callout: MockView,
  };
});

// Mock geolocation
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  NavigationContainer: ({children}: any) => children,
  useFocusEffect: jest.fn(),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}: any) => children,
    Screen: ({children}: any) => children,
  }),
}));

// Mock PermissionsAndroid
jest.mock(
  'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
  () => ({
    request: jest.fn(() => Promise.resolve('granted')),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
  }),
);

// Mock permissions service globally
jest.mock('../src/services/permissions', () => ({
  requestLocationPermission: jest.fn(() =>
    Promise.resolve({status: 'granted'}),
  ),
  showPermissionAlert: jest.fn(),
}));

// Silence console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
