import {locationService, LocationServiceResult} from '../../src/services/location';
import Geolocation from '@react-native-community/geolocation';

// Mock Geolocation
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  requestAuthorization: jest.fn(),
}));

const mockedGeolocation = Geolocation as jest.Mocked<typeof Geolocation>;

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    locationService.stopLocationTracking();
  });

  afterEach(() => {
    locationService.destroy();
  });

  describe('getCurrentLocation', () => {
    it('should return location with good accuracy', async () => {
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(true);
      expect(result.location).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle poor accuracy location', async () => {
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 50, // Poor accuracy > 20m
        },
        timestamp: Date.now(),
      };

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('poor_signal');
      expect(result.message).toContain('50m');
      expect(result.message).toContain('20m');
    });

    it('should handle permission denied error', async () => {
      const mockError = {code: 1, message: 'Permission denied'};

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success, error) => error && error(mockError)
      );

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('permission_denied');
      expect(result.message).toContain('Location permission denied');
    });

    it('should handle GPS unavailable error', async () => {
      const mockError = {code: 2, message: 'Position unavailable'};

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success, error) => error && error(mockError)
      );

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('gps_unavailable');
      expect(result.message).toContain('GPS signal unavailable');
    });

    it('should handle timeout error', async () => {
      const mockError = {code: 3, message: 'Timeout'};

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success, error) => error && error(mockError)
      );

      const result = await locationService.getCurrentLocation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout');
      expect(result.message).toContain('Location request timed out');
    });
  });

  describe('startLocationTracking', () => {
    it('should start tracking successfully', () => {
      const mockWatchId = 123;
      const callback = jest.fn();

      mockedGeolocation.watchPosition.mockReturnValueOnce(mockWatchId);

      locationService.startLocationTracking(callback);

      expect(locationService.isLocationTracking()).toBe(true);
      expect(mockedGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 5000,
        })
      );
    });

    it('should handle location updates during tracking', () => {
      const callback = jest.fn();
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 15,
        },
        timestamp: Date.now(),
      };

      mockedGeolocation.watchPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      locationService.startLocationTracking(callback);

      const [successCallback] = mockedGeolocation.watchPosition.mock.calls[0];
      successCallback(mockPosition);

      expect(callback).toHaveBeenCalledWith({
        success: true,
        location: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 15,
          timestamp: mockPosition.timestamp,
        },
      });
    });

    it('should prevent multiple tracking sessions', () => {
      const callback = jest.fn();

      locationService.startLocationTracking(callback);
      locationService.startLocationTracking(callback);

      expect(callback).toHaveBeenCalledWith({
        success: false,
        error: 'unknown',
        message: 'Location tracking is already active',
      });
    });
  });

  describe('stopLocationTracking', () => {
    it('should stop tracking successfully', () => {
      const mockWatchId = 123;
      const callback = jest.fn();

      mockedGeolocation.watchPosition.mockReturnValueOnce(mockWatchId);
      locationService.startLocationTracking(callback);

      locationService.stopLocationTracking();

      expect(locationService.isLocationTracking()).toBe(false);
      expect(mockedGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two locations', () => {
      const loc1 = {latitude: 17.3850, longitude: 78.4867, accuracy: 10, timestamp: Date.now()};
      const loc2 = {latitude: 17.3851, longitude: 78.4868, accuracy: 10, timestamp: Date.now()};

      const distance = locationService.calculateDistance(loc1, loc2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(20); // Should be small distance
    });
  });

  describe('getSignalStrength', () => {
    it('should return excellent for very accurate location', () => {
      expect(locationService.getSignalStrength(5)).toBe('excellent');
    });

    it('should return good for moderately accurate location', () => {
      expect(locationService.getSignalStrength(15)).toBe('good');
    });

    it('should return weak for less accurate location', () => {
      expect(locationService.getSignalStrength(25)).toBe('weak');
    });

    it('should return none for very poor accuracy', () => {
      expect(locationService.getSignalStrength(100)).toBe('none');
    });
  });

  describe('isLocationAccurate', () => {
    it('should return true for accurate location', () => {
      const location = {latitude: 17.3850, longitude: 78.4867, accuracy: 15, timestamp: Date.now()};
      expect(locationService.isLocationAccurate(location)).toBe(true);
    });

    it('should return false for inaccurate location', () => {
      const location = {latitude: 17.3850, longitude: 78.4867, accuracy: 25, timestamp: Date.now()};
      expect(locationService.isLocationAccurate(location)).toBe(false);
    });
  });

  describe('getLastKnownLocation', () => {
    it('should return last known location', async () => {
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockedGeolocation.getCurrentPosition.mockImplementationOnce(
        (success) => success(mockPosition)
      );

      await locationService.getCurrentLocation();
      const lastLocation = locationService.getLastKnownLocation();

      expect(lastLocation).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      });
    });

    it('should return null when no location available', () => {
      expect(locationService.getLastKnownLocation()).toBeNull();
    });
  });
});