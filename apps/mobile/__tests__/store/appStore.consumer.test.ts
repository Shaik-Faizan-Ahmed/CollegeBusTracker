import { useAppStore } from '../../src/store/appStore';
import { consumerService } from '../../src/services/consumerService';
import { BusLocation, ConsumerTrackingState, LocationUpdate } from '@cvr-bus-tracker/shared-types';

// Mock the consumer service
jest.mock('../../src/services/consumerService', () => ({
  consumerService: {
    getBusLocation: jest.fn(),
    getActiveBuses: jest.fn(),
  },
}));

const mockedConsumerService = consumerService as jest.Mocked<typeof consumerService>;

describe('AppStore - Consumer Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAppStore.setState({
      consumerTracking: null,
      activeBuses: [],
      locationLoadingState: 'idle',
      locationError: null,
      userRole: null,
      selectedBus: null,
    });
  });

  describe('startConsumerTracking', () => {
    it('should start consumer tracking successfully', async () => {
      const mockBusData = {
        id: 'session-123',
        busNumber: '12',
        latitude: 17.3850,
        longitude: 78.4867,
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
        isActive: true,
      };

      mockedConsumerService.getBusLocation.mockResolvedValue(mockBusData);

      const store = useAppStore.getState();
      
      await store.startConsumerTracking('12');

      const newState = useAppStore.getState();

      expect(mockedConsumerService.getBusLocation).toHaveBeenCalledWith('12');
      expect(newState.consumerTracking).toEqual({
        busNumber: '12',
        busLocation: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
          timestamp: mockBusData.lastUpdated,
        },
        lastUpdated: mockBusData.lastUpdated,
        isTrackerActive: true,
        wsConnected: false,
      });
      expect(newState.userRole).toBe('consumer');
      expect(newState.selectedBus).toBe('12');
      expect(newState.locationLoadingState).toBe('success');
    });

    it('should handle no active tracker error', async () => {
      const error = new Error('No active tracker found for bus 12');
      mockedConsumerService.getBusLocation.mockRejectedValue(error);

      const store = useAppStore.getState();

      await expect(store.startConsumerTracking('12')).rejects.toThrow(
        'No active tracker found for bus 12'
      );

      const newState = useAppStore.getState();

      expect(newState.locationLoadingState).toBe('error');
      expect(newState.locationError).toBe('No active tracker found for bus 12');
      expect(newState.consumerTracking).toBeNull();
    });

    it('should handle generic errors', async () => {
      const error = new Error('Network error');
      mockedConsumerService.getBusLocation.mockRejectedValue(error);

      const store = useAppStore.getState();

      await expect(store.startConsumerTracking('12')).rejects.toThrow('Network error');

      const newState = useAppStore.getState();

      expect(newState.locationLoadingState).toBe('error');
      expect(newState.locationError).toBe('Network error');
    });

    it('should set loading state during request', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockedConsumerService.getBusLocation.mockReturnValue(promise as any);

      const store = useAppStore.getState();
      const trackingPromise = store.startConsumerTracking('12');

      // Check loading state
      expect(useAppStore.getState().locationLoadingState).toBe('loading');

      // Resolve the promise
      resolvePromise!({
        id: 'session-123',
        busNumber: '12',
        latitude: 17.3850,
        longitude: 78.4867,
        lastUpdated: new Date(),
        isActive: true,
      });

      await trackingPromise;
    });
  });

  describe('stopConsumerTracking', () => {
    it('should stop consumer tracking', () => {
      // Set initial tracking state
      useAppStore.setState({
        consumerTracking: {
          busNumber: '12',
          busLocation: {
            latitude: 17.3850,
            longitude: 78.4867,
            accuracy: 10,
            timestamp: new Date(),
          },
          lastUpdated: new Date(),
          isTrackerActive: true,
          wsConnected: true,
        },
        userRole: 'consumer',
        locationLoadingState: 'success',
        locationError: null,
      });

      const store = useAppStore.getState();
      store.stopConsumerTracking();

      const newState = useAppStore.getState();

      expect(newState.consumerTracking).toBeNull();
      expect(newState.userRole).toBeNull();
      expect(newState.locationLoadingState).toBe('idle');
      expect(newState.locationError).toBeNull();
    });
  });

  describe('updateConsumerBusLocation', () => {
    it('should update bus location from WebSocket data', () => {
      const initialTracking: ConsumerTrackingState = {
        busNumber: '12',
        busLocation: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
          timestamp: new Date('2023-01-01T12:00:00Z'),
        },
        lastUpdated: new Date('2023-01-01T12:00:00Z'),
        isTrackerActive: true,
        wsConnected: false,
      };

      useAppStore.setState({ consumerTracking: initialTracking });

      const locationUpdate: LocationUpdate = {
        busNumber: '12',
        latitude: 17.3860,
        longitude: 78.4870,
        accuracy: 8,
        timestamp: Date.now(),
        sessionId: 'session-123',
      };

      const store = useAppStore.getState();
      store.updateConsumerBusLocation(locationUpdate);

      const newState = useAppStore.getState();

      expect(newState.consumerTracking?.busLocation).toEqual({
        latitude: 17.3860,
        longitude: 78.4870,
        accuracy: 8,
        timestamp: new Date(locationUpdate.timestamp),
      });
      expect(newState.consumerTracking?.wsConnected).toBe(true);
      expect(newState.consumerTracking?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should not update if tracking different bus', () => {
      const initialTracking: ConsumerTrackingState = {
        busNumber: '12',
        busLocation: {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
          timestamp: new Date(),
        },
        lastUpdated: new Date(),
        isTrackerActive: true,
        wsConnected: false,
      };

      useAppStore.setState({ consumerTracking: initialTracking });

      const locationUpdate: LocationUpdate = {
        busNumber: '13', // Different bus
        latitude: 17.3860,
        longitude: 78.4870,
        accuracy: 8,
        timestamp: Date.now(),
        sessionId: 'session-123',
      };

      const store = useAppStore.getState();
      store.updateConsumerBusLocation(locationUpdate);

      const newState = useAppStore.getState();

      // Should remain unchanged
      expect(newState.consumerTracking?.busLocation).toEqual(initialTracking.busLocation);
      expect(newState.consumerTracking?.wsConnected).toBe(false);
    });

    it('should not update if no consumer tracking active', () => {
      useAppStore.setState({ consumerTracking: null });

      const locationUpdate: LocationUpdate = {
        busNumber: '12',
        latitude: 17.3860,
        longitude: 78.4870,
        accuracy: 8,
        timestamp: Date.now(),
        sessionId: 'session-123',
      };

      const store = useAppStore.getState();
      store.updateConsumerBusLocation(locationUpdate);

      const newState = useAppStore.getState();

      expect(newState.consumerTracking).toBeNull();
    });
  });

  describe('fetchActiveBuses', () => {
    it('should fetch active buses successfully', async () => {
      const mockActiveBuses = {
        activeBuses: [
          {
            busNumber: '12',
            latitude: 17.3850,
            longitude: 78.4867,
            lastUpdated: new Date('2023-01-01T12:00:00Z'),
          },
          {
            busNumber: 'A5',
            latitude: 17.3900,
            longitude: 78.4900,
            lastUpdated: new Date('2023-01-01T12:05:00Z'),
          },
        ],
      };

      mockedConsumerService.getActiveBuses.mockResolvedValue(mockActiveBuses);

      const store = useAppStore.getState();
      await store.fetchActiveBuses();

      const newState = useAppStore.getState();

      expect(mockedConsumerService.getActiveBuses).toHaveBeenCalled();
      expect(newState.activeBuses).toEqual([
        {
          latitude: 17.3850,
          longitude: 78.4867,
          accuracy: 10,
          timestamp: mockActiveBuses.activeBuses[0].lastUpdated,
        },
        {
          latitude: 17.3900,
          longitude: 78.4900,
          accuracy: 10,
          timestamp: mockActiveBuses.activeBuses[1].lastUpdated,
        },
      ]);
    });

    it('should handle empty active buses list', async () => {
      mockedConsumerService.getActiveBuses.mockResolvedValue({ activeBuses: [] });

      const store = useAppStore.getState();
      await store.fetchActiveBuses();

      const newState = useAppStore.getState();

      expect(newState.activeBuses).toEqual([]);
    });

    it('should handle errors silently', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedConsumerService.getActiveBuses.mockRejectedValue(new Error('Network error'));

      const store = useAppStore.getState();
      
      // Should not throw
      await expect(store.fetchActiveBuses()).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch active buses:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});