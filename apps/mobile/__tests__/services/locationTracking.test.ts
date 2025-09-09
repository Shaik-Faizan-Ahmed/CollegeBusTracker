import { LocationTrackingService } from '../../src/services/locationTracking';
import { LocationService } from '../../src/services/location';
import { trackerService } from '../../src/services/trackerService';
import { websocketService } from '../../src/services/websocketService';
import { Location } from '@cvr-bus-tracker/shared-types';

// Mock dependencies
jest.mock('../../src/services/location');
jest.mock('../../src/services/trackerService');
jest.mock('../../src/services/websocketService');

const mockLocationService = LocationService as jest.MockedClass<typeof LocationService>;
const mockTrackerService = trackerService as jest.Mocked<typeof trackerService>;
const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('LocationTrackingService', () => {
  let service: LocationTrackingService;
  let locationServiceInstance: jest.Mocked<LocationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    locationServiceInstance = new mockLocationService() as jest.Mocked<LocationService>;
    service = new LocationTrackingService(locationServiceInstance);
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.stopTracking();
    jest.useRealTimers();
  });

  describe('startTracking', () => {
    beforeEach(() => {
      mockTrackerService.isTracking.mockReturnValue(true);
      locationServiceInstance.checkLocationPermission.mockResolvedValue(true);
      locationServiceInstance.getCurrentPosition.mockResolvedValue({
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
        },
        timestamp: Date.now(),
      } as any);
      mockTrackerService.getCurrentSession.mockReturnValue({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
        startedAt: new Date(),
        isActive: true,
      });
    });

    it('should start tracking with default options', async () => {
      await service.startTracking();

      expect(locationServiceInstance.checkLocationPermission).toHaveBeenCalled();
      expect(locationServiceInstance.getCurrentPosition).toHaveBeenCalled();
      expect(service.isLocationTracking()).toBe(true);
    });

    it('should start tracking with custom options', async () => {
      const options = {
        updateIntervalMs: 5000,
        minAccuracyMeters: 25,
        maxLocationAge: 60000,
      };

      await service.startTracking(options);

      expect(service.getOptions()).toMatchObject(options);
    });

    it('should handle already active tracking', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await service.startTracking();
      await service.startTracking(); // Second call

      expect(consoleSpy).toHaveBeenCalledWith('Location tracking already active');
      consoleSpy.mockRestore();
    });

    it('should throw error when no tracking session', async () => {
      mockTrackerService.isTracking.mockReturnValue(false);

      await expect(service.startTracking()).rejects.toThrow('No active tracking session');
    });

    it('should throw error when no location permission', async () => {
      locationServiceInstance.checkLocationPermission.mockResolvedValue(false);

      await expect(service.startTracking()).rejects.toThrow('Location permission not granted');
    });

    it('should get initial location and start interval updates', async () => {
      mockTrackerService.updateLocation.mockResolvedValue();
      mockWebsocketService.isConnected.mockReturnValue(true);

      await service.startTracking({ updateIntervalMs: 1000 });

      // Initial location update
      expect(mockTrackerService.updateLocation).toHaveBeenCalledTimes(1);

      // Advance timer for interval updates
      jest.advanceTimersByTime(1000);
      expect(mockTrackerService.updateLocation).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      expect(mockTrackerService.updateLocation).toHaveBeenCalledTimes(3);
    });

    it('should handle initial location error gracefully', async () => {
      locationServiceInstance.getCurrentPosition.mockRejectedValueOnce(new Error('GPS error'));
      mockTrackerService.updateLocation.mockResolvedValue();

      await service.startTracking({ updateIntervalMs: 1000 });

      // Should still start interval despite initial error
      jest.advanceTimersByTime(1000);
      expect(mockTrackerService.updateLocation).toHaveBeenCalled();
    });
  });

  describe('stopTracking', () => {
    beforeEach(async () => {
      mockTrackerService.isTracking.mockReturnValue(true);
      locationServiceInstance.checkLocationPermission.mockResolvedValue(true);
      locationServiceInstance.getCurrentPosition.mockResolvedValue({
        coords: { latitude: 17.3850, longitude: 78.4867, accuracy: 10 },
        timestamp: Date.now(),
      } as any);
      mockTrackerService.getCurrentSession.mockReturnValue({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
        startedAt: new Date(),
        isActive: true,
      });

      await service.startTracking();
    });

    it('should stop tracking successfully', () => {
      expect(service.isLocationTracking()).toBe(true);

      service.stopTracking();

      expect(service.isLocationTracking()).toBe(false);
    });

    it('should clear update interval', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.stopTracking();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle stop when not tracking', () => {
      service.stopTracking(); // Stop first time
      
      expect(() => service.stopTracking()).not.toThrow(); // Second stop should not throw
    });
  });

  describe('getCurrentLocation', () => {
    it('should get and validate current location', async () => {
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 15,
        },
        timestamp: Date.now(),
      };

      locationServiceInstance.getCurrentPosition.mockResolvedValue(mockPosition as any);

      const location = await service.getCurrentLocation();

      expect(location).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 15,
        timestamp: mockPosition.timestamp,
      });
    });

    it('should warn about poor accuracy', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 100, // Poor accuracy
        },
        timestamp: Date.now(),
      };

      locationServiceInstance.getCurrentPosition.mockResolvedValue(mockPosition as any);

      await service.getCurrentLocation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Location accuracy 100m exceeds threshold')
      );
      consoleSpy.mockRestore();
    });

    it('should warn about old location', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
        },
        timestamp: Date.now() - 60000, // 1 minute old
      };

      locationServiceInstance.getCurrentPosition.mockResolvedValue(mockPosition as any);

      await service.getCurrentLocation();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Location is')
      );
      consoleSpy.mockRestore();
    });

    it('should handle missing accuracy and timestamp', async () => {
      const mockPosition = {
        coords: {
          latitude: 17.3850,
          longitude: 78.4867,
          // No accuracy
        },
        // No timestamp
      };

      locationServiceInstance.getCurrentPosition.mockResolvedValue(mockPosition as any);

      const location = await service.getCurrentLocation();

      expect(location.accuracy).toBe(999); // Default fallback
      expect(location.timestamp).toBeCloseTo(Date.now(), -2); // Close to current time
    });
  });

  describe('location updates', () => {
    beforeEach(async () => {
      mockTrackerService.isTracking.mockReturnValue(true);
      locationServiceInstance.checkLocationPermission.mockResolvedValue(true);
      locationServiceInstance.getCurrentPosition.mockResolvedValue({
        coords: { latitude: 17.3850, longitude: 78.4867, accuracy: 10 },
        timestamp: Date.now(),
      } as any);
      mockTrackerService.getCurrentSession.mockReturnValue({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
        startedAt: new Date(),
        isActive: true,
      });
    });

    it('should update location via tracker service and websocket', async () => {
      mockTrackerService.updateLocation.mockResolvedValue();
      mockWebsocketService.isConnected.mockReturnValue(true);

      await service.startTracking();

      expect(mockTrackerService.updateLocation).toHaveBeenCalledWith({
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: expect.any(Number),
      });

      expect(mockWebsocketService.emitLocationUpdate).toHaveBeenCalledWith({
        busNumber: '12',
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: expect.any(Number),
        sessionId: 'session-123',
      });
    });

    it('should not emit websocket update when disconnected', async () => {
      mockTrackerService.updateLocation.mockResolvedValue();
      mockWebsocketService.isConnected.mockReturnValue(false);

      await service.startTracking();

      expect(mockTrackerService.updateLocation).toHaveBeenCalled();
      expect(mockWebsocketService.emitLocationUpdate).not.toHaveBeenCalled();
    });

    it('should handle location update errors gracefully', async () => {
      mockTrackerService.updateLocation.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.startTracking({ updateIntervalMs: 1000 });

      // Should log error but continue
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update location:', expect.any(Error));

      // Next interval should still try
      jest.advanceTimersByTime(1000);
      expect(mockTrackerService.updateLocation).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should handle no active session during update', async () => {
      mockTrackerService.getCurrentSession.mockReturnValue(null);

      await expect(service.startTracking()).resolves.not.toThrow();

      // Updates should fail gracefully
      jest.advanceTimersByTime(1000);
      // Should not crash
    });
  });

  describe('app state changes', () => {
    beforeEach(async () => {
      mockTrackerService.isTracking.mockReturnValue(true);
      locationServiceInstance.checkLocationPermission.mockResolvedValue(true);
      locationServiceInstance.getCurrentPosition.mockResolvedValue({
        coords: { latitude: 17.3850, longitude: 78.4867, accuracy: 10 },
        timestamp: Date.now(),
      } as any);
      mockTrackerService.getCurrentSession.mockReturnValue({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
        startedAt: new Date(),
        isActive: true,
      });

      await service.startTracking();
    });

    it('should handle background state', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.handleAppStateChange('background');

      expect(consoleSpy).toHaveBeenCalledWith('App backgrounded, continuing location tracking');
      consoleSpy.mockRestore();
    });

    it('should handle foreground state', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.handleAppStateChange('active');

      expect(consoleSpy).toHaveBeenCalledWith('App foregrounded, location tracking active');
      consoleSpy.mockRestore();
    });

    it('should restart tracking when returning to foreground without interval', async () => {
      // Stop tracking and clear interval
      service.stopTracking();

      // Mock that tracking is still active in tracker service
      expect(service.isLocationTracking()).toBe(false);

      service.handleAppStateChange('active');

      // Should not restart since tracking is stopped
      expect(service.isLocationTracking()).toBe(false);
    });

    it('should handle inactive state', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.handleAppStateChange('inactive');

      expect(consoleSpy).toHaveBeenCalledWith('App inactive, maintaining location tracking');
      consoleSpy.mockRestore();
    });
  });

  describe('options management', () => {
    it('should update options and restart tracking', async () => {
      mockTrackerService.isTracking.mockReturnValue(true);
      locationServiceInstance.checkLocationPermission.mockResolvedValue(true);
      locationServiceInstance.getCurrentPosition.mockResolvedValue({
        coords: { latitude: 17.3850, longitude: 78.4867, accuracy: 10 },
        timestamp: Date.now(),
      } as any);

      await service.startTracking({ updateIntervalMs: 1000 });

      const newOptions = { updateIntervalMs: 5000, minAccuracyMeters: 25 };
      service.updateOptions(newOptions);

      expect(service.getOptions().updateIntervalMs).toBe(5000);
      expect(service.getOptions().minAccuracyMeters).toBe(25);
    });

    it('should not restart tracking when not currently tracking', () => {
      const newOptions = { updateIntervalMs: 5000 };
      service.updateOptions(newOptions);

      expect(service.getOptions().updateIntervalMs).toBe(5000);
      expect(service.isLocationTracking()).toBe(false);
    });

    it('should return current options', () => {
      const options = service.getOptions();

      expect(options).toEqual({
        updateIntervalMs: 12000,
        minAccuracyMeters: 50,
        maxLocationAge: 30000,
      });
    });
  });
});