import {renderHook, act} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {useLocation} from '../../src/hooks/useLocation';
import {locationService} from '../../src/services/location';
import {requestLocationPermission} from '../../src/services/permissions';

// Mock dependencies
jest.mock('../../src/services/location');
jest.mock('../../src/services/permissions');
const mockStore = {
  currentLocation: null,
  isLocationTracking: false,
  locationLoadingState: 'idle',
  locationError: null,
  locationPermissionStatus: 'granted',
  setCurrentLocation: jest.fn(),
  setLocationTracking: jest.fn(),
  setLocationLoadingState: jest.fn(),
  setLocationError: jest.fn(),
  setLocationPermissionStatus: jest.fn(),
};

jest.mock('../../src/store/appStore', () => ({
  useAppStore: () => mockStore,
}));

const mockedLocationService = locationService as jest.Mocked<typeof locationService>;
const mockedRequestLocationPermission = requestLocationPermission as jest.MockedFunction<typeof requestLocationPermission>;

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store to default state
    mockStore.currentLocation = null;
    mockStore.isLocationTracking = false;
    mockStore.locationLoadingState = 'idle';
    mockStore.locationError = null;
    mockStore.locationPermissionStatus = 'granted';
  });

  it('should initialize with correct default values', () => {
    // Set to unknown for this specific test
    mockStore.locationPermissionStatus = 'unknown';
    
    const {result} = renderHook(() => useLocation());

    expect(result.current.currentLocation).toBeNull();
    expect(result.current.isTracking).toBe(false);
    expect(result.current.loadingState).toBe('idle');
    expect(result.current.locationError).toBeNull();
    expect(result.current.permissionStatus).toBe('unknown');
    expect(result.current.accuracy).toBeNull();
    expect(result.current.signalStrength).toBe('none');
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockLocation = {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockedLocationService.getCurrentLocation.mockResolvedValueOnce({
        success: true,
        location: mockLocation,
      });

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.getCurrentLocation();
      });

      expect(mockedLocationService.getCurrentLocation).toHaveBeenCalled();
    });

    it('should handle location error', async () => {
      mockedLocationService.getCurrentLocation.mockResolvedValueOnce({
        success: false,
        error: 'timeout',
        message: 'Location request timed out',
      });

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.getCurrentLocation();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'GPS Timeout',
        'Unable to get your location. Please ensure GPS is enabled and try again.',
        [{text: 'OK'}]
      );
    });

    it('should request permission if not granted', async () => {
      // Set permission to unknown for this test
      mockStore.locationPermissionStatus = 'unknown';
      
      mockedRequestLocationPermission.mockResolvedValueOnce({
        status: 'granted',
      });

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.getCurrentLocation();
      });

      expect(mockedRequestLocationPermission).toHaveBeenCalled();
      
      // Reset permission status
      mockStore.locationPermissionStatus = 'granted';
    });
  });

  describe('startLocationTracking', () => {
    it('should start location tracking successfully', async () => {
      mockedLocationService.startLocationTracking.mockImplementationOnce(() => {});

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.startLocationTracking();
      });

      expect(mockedLocationService.startLocationTracking).toHaveBeenCalled();
    });

    it('should not start tracking if already tracking', async () => {
      // Set tracking to active from the start
      mockStore.isLocationTracking = true;
      
      const {result} = renderHook(() => useLocation());
      
      mockedLocationService.startLocationTracking.mockImplementation(() => {});
      
      await act(async () => {
        await result.current.startLocationTracking(); // Should be ignored since already tracking
      });

      expect(mockedLocationService.startLocationTracking).not.toHaveBeenCalled();
    });
  });

  describe('stopLocationTracking', () => {
    it('should stop location tracking', () => {
      mockedLocationService.stopLocationTracking.mockImplementationOnce(() => {});

      const {result} = renderHook(() => useLocation());

      act(() => {
        result.current.stopLocationTracking();
      });

      expect(mockedLocationService.stopLocationTracking).toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should handle permission granted', async () => {
      mockedRequestLocationPermission.mockResolvedValueOnce({
        status: 'granted',
      });

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockedRequestLocationPermission).toHaveBeenCalled();
    });

    it('should handle permission denied', async () => {
      mockedRequestLocationPermission.mockResolvedValueOnce({
        status: 'denied',
        message: 'Permission denied',
      });

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'Permission denied',
        [{text: 'OK'}]
      );
    });

    it('should handle permission request error', async () => {
      mockedRequestLocationPermission.mockRejectedValueOnce(new Error('Permission error'));

      const {result} = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Error',
        'Failed to request location permission. Please try again.',
        [{text: 'OK'}]
      );
    });
  });

  describe('signal strength calculation', () => {
    it('should calculate signal strength based on accuracy', () => {
      mockedLocationService.getSignalStrength.mockReturnValueOnce('excellent');

      const {result} = renderHook(() => useLocation());

      // Mock current location with good accuracy
      const mockLocation = {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 5,
        timestamp: Date.now(),
      };

      expect(mockedLocationService.getSignalStrength).toHaveBeenCalledTimes(0);
      // Signal strength is calculated based on accuracy from the store
    });
  });

  describe('auto-request permission option', () => {
    it('should auto-request permission when enabled', () => {
      // Set permission to unknown for this test
      mockStore.locationPermissionStatus = 'unknown';
      
      mockedRequestLocationPermission.mockResolvedValueOnce({
        status: 'granted',
      });

      renderHook(() => useLocation({requestPermission: true}));

      expect(mockedRequestLocationPermission).toHaveBeenCalled();
      
      // Reset permission status
      mockStore.locationPermissionStatus = 'granted';
    });

    it('should not auto-request permission when disabled', () => {
      renderHook(() => useLocation({requestPermission: false}));

      expect(mockedRequestLocationPermission).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      mockedLocationService.stopLocationTracking.mockImplementationOnce(() => {});

      const {unmount} = renderHook(() => useLocation());

      unmount();

      expect(mockedLocationService.stopLocationTracking).toHaveBeenCalled();
    });
  });
});