import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackerService, TrackerService } from '../../src/services/trackerService';
import { apiClient } from '../../src/services/api';
import { Location } from '@cvr-bus-tracker/shared-types';

// Mock dependencies
jest.mock('../../src/services/api');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('TrackerService', () => {
  let service: TrackerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrackerService();
  });

  afterEach(() => {
    // Clear any intervals
    jest.clearAllTimers();
  });

  describe('startTracking', () => {
    const mockLocation: Location = {
      latitude: 17.3850,
      longitude: 78.4867,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const mockResponse = {
      sessionId: 'session-123',
      busNumber: '12',
      trackerId: 'tracker-456',
    };

    it('should start tracking successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockAsyncStorage.multiSet.mockResolvedValueOnce();

      const result = await service.startTracking('12', mockLocation);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tracker/start', {
        busNumber: '12',
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
      });
      expect(result).toEqual(mockResponse);
      expect(service.getCurrentSession()).toMatchObject({
        sessionId: mockResponse.sessionId,
        busNumber: mockResponse.busNumber,
        trackerId: mockResponse.trackerId,
        isActive: true,
      });
    });

    it('should handle bus already tracked error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('already has an active tracker'));

      await expect(service.startTracking('12', mockLocation)).rejects.toThrow('BUS_ALREADY_TRACKED');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValueOnce(networkError);

      await expect(service.startTracking('12', mockLocation)).rejects.toThrow('Network error');
    });

    it('should store session in AsyncStorage', async () => {
      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockAsyncStorage.multiSet.mockResolvedValueOnce();

      await service.startTracking('12', mockLocation);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        ['cvr_bus_tracker_session', expect.stringContaining(mockResponse.sessionId)],
        ['cvr_bus_tracker_session_id', mockResponse.sessionId],
      ]);
    });
  });

  describe('stopTracking', () => {
    beforeEach(async () => {
      // Set up an active session
      mockApiClient.post.mockResolvedValueOnce({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
      });
      mockAsyncStorage.multiSet.mockResolvedValueOnce();
      
      await service.startTracking('12', {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: Date.now(),
      });
    });

    it('should stop tracking successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        message: 'Tracking session stopped',
        busNumber: '12',
      });
      mockAsyncStorage.multiRemove.mockResolvedValueOnce();

      await service.stopTracking();

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/tracker/stop',
        {},
        { 'x-session-id': 'session-123' }
      );
      expect(service.getCurrentSession()).toBeNull();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should handle no active session', async () => {
      service = new TrackerService(); // Fresh instance with no session

      await expect(service.stopTracking()).rejects.toThrow('No active tracking session');
    });

    it('should clear session even if API call fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));
      mockAsyncStorage.multiRemove.mockResolvedValueOnce();

      await expect(service.stopTracking()).rejects.toThrow('Network error');
      expect(service.getCurrentSession()).toBeNull();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('updateLocation', () => {
    const mockLocation: Location = {
      latitude: 17.3851,
      longitude: 78.4868,
      accuracy: 15,
      timestamp: Date.now(),
    };

    beforeEach(async () => {
      // Set up an active session
      mockApiClient.post.mockResolvedValueOnce({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
      });
      await service.startTracking('12', mockLocation);
    });

    it('should update location successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({});

      await service.updateLocation(mockLocation);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/tracker/update',
        {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          accuracy: mockLocation.accuracy,
          timestamp: mockLocation.timestamp,
        },
        { 'x-session-id': 'session-123' }
      );
    });

    it('should handle no active session', async () => {
      service = new TrackerService(); // Fresh instance

      await expect(service.updateLocation(mockLocation)).rejects.toThrow('No active tracking session');
    });

    it('should handle API errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Location update failed'));

      await expect(service.updateLocation(mockLocation)).rejects.toThrow('Location update failed');
    });
  });

  describe('session state management', () => {
    it('should return correct tracking status', async () => {
      expect(service.isTracking()).toBe(false);
      expect(service.getCurrentBusNumber()).toBeNull();

      mockApiClient.post.mockResolvedValueOnce({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
      });

      await service.startTracking('12', {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: Date.now(),
      });

      expect(service.isTracking()).toBe(true);
      expect(service.getCurrentBusNumber()).toBe('12');
    });

    it('should load stored session on initialization', async () => {
      const storedSession = {
        sessionId: 'stored-session',
        busNumber: 'A1',
        trackerId: 'stored-tracker',
        startedAt: new Date().toISOString(),
        isActive: true,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedSession));

      const newService = new TrackerService();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(newService.getCurrentSession()).toMatchObject({
        sessionId: storedSession.sessionId,
        busNumber: storedSession.busNumber,
        isActive: storedSession.isActive,
      });
    });

    it('should clear expired session on initialization', async () => {
      const expiredSession = {
        sessionId: 'expired-session',
        busNumber: 'A1',
        trackerId: 'expired-tracker',
        startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        isActive: true,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(expiredSession));
      mockAsyncStorage.multiRemove.mockResolvedValueOnce();

      const newService = new TrackerService();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(newService.getCurrentSession()).toBeNull();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('location updates', () => {
    const mockLocationProvider = jest.fn();

    beforeEach(async () => {
      // Set up active session
      mockApiClient.post.mockResolvedValueOnce({
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
      });
      await service.startTracking('12', {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: Date.now(),
      });

      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start location updates with correct interval', () => {
      mockLocationProvider.mockResolvedValue({
        latitude: 17.3851,
        longitude: 78.4868,
        accuracy: 12,
        timestamp: Date.now(),
      });

      service.startLocationUpdates(mockLocationProvider, 1000);

      expect(mockLocationProvider).toHaveBeenCalledTimes(1); // Initial call

      jest.advanceTimersByTime(1000);
      expect(mockLocationProvider).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      expect(mockLocationProvider).toHaveBeenCalledTimes(3);
    });

    it('should stop location updates', () => {
      service.startLocationUpdates(mockLocationProvider, 1000);
      service.stopLocationUpdates();

      jest.advanceTimersByTime(2000);
      expect(mockLocationProvider).toHaveBeenCalledTimes(1); // Only initial call
    });

    it('should handle location provider errors gracefully', () => {
      mockLocationProvider.mockRejectedValue(new Error('GPS error'));

      service.startLocationUpdates(mockLocationProvider, 1000);

      jest.advanceTimersByTime(1000);
      // Should not throw, should continue running
      expect(mockLocationProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('app state handling', () => {
    it('should handle background state', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.handleAppStateChange('background');
      
      expect(consoleSpy).toHaveBeenCalledWith('App backgrounded, continuing location updates');
      
      consoleSpy.mockRestore();
    });

    it('should handle foreground state', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service.handleAppStateChange('active');
      
      expect(consoleSpy).toHaveBeenCalledWith('App foregrounded, verifying location updates');
      
      consoleSpy.mockRestore();
    });
  });
});