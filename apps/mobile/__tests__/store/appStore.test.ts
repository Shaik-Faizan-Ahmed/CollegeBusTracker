import {renderHook, act} from '@testing-library/react-hooks';
import {useAppStore} from '../../src/store/appStore';
import { Location, TrackingSession } from '@cvr-bus-tracker/shared-types';

// Mock services
const mockTrackerService = {
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
};

const mockLocationService = {
  getCurrentPosition: jest.fn(),
};

const mockLocationTrackingService = {
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
};

const mockWebsocketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('../../src/services/trackerService', () => ({
  trackerService: mockTrackerService,
}));

jest.mock('../../src/services/location', () => ({
  LocationService: jest.fn(() => mockLocationService),
}));

jest.mock('../../src/services/locationTracking', () => ({
  locationTrackingService: mockLocationTrackingService,
}));

jest.mock('../../src/services/websocketService', () => ({
  websocketService: mockWebsocketService,
}));

describe('App Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state before each test
    const {result} = renderHook(() => useAppStore());
    act(() => {
      result.current.navigateToScreen('Home');
      result.current.setUserRole(null);
      result.current.setTrackingSession(null);
      result.current.setTrackerStatus('idle');
      result.current.setTrackerError(null);
    });
  });

  it('initializes with default state', () => {
    const {result} = renderHook(() => useAppStore());

    expect(result.current.currentScreen).toBe('home');
    expect(result.current.userRole).toBeNull();
  });

  describe('navigateToScreen', () => {
    it('updates currentScreen when navigating to Home', () => {
      const {result} = renderHook(() => useAppStore());

      act(() => {
        result.current.navigateToScreen('Home');
      });

      expect(result.current.currentScreen).toBe('home');
    });

    it('updates currentScreen when navigating to TrackBus', () => {
      const {result} = renderHook(() => useAppStore());

      act(() => {
        result.current.navigateToScreen('TrackBus');
      });

      expect(result.current.currentScreen).toBe('trackbus');
    });

    it('updates currentScreen when navigating to BecomeTracker', () => {
      const {result} = renderHook(() => useAppStore());

      act(() => {
        result.current.navigateToScreen('BecomeTracker');
      });

      expect(result.current.currentScreen).toBe('becometracker');
    });
  });

  describe('setUserRole', () => {
    it('sets user role to consumer', () => {
      const {result} = renderHook(() => useAppStore());

      act(() => {
        result.current.setUserRole('consumer');
      });

      expect(result.current.userRole).toBe('consumer');
    });

    it('sets user role to tracker', () => {
      const {result} = renderHook(() => useAppStore());

      act(() => {
        result.current.setUserRole('tracker');
      });

      expect(result.current.userRole).toBe('tracker');
    });

    it('clears user role when set to null', () => {
      const {result} = renderHook(() => useAppStore());

      // First set a role
      act(() => {
        result.current.setUserRole('consumer');
      });

      expect(result.current.userRole).toBe('consumer');

      // Then clear it
      act(() => {
        result.current.setUserRole(null);
      });

      expect(result.current.userRole).toBeNull();
    });
  });

  describe('store persistence', () => {
    it('maintains state across multiple hook calls', () => {
      const {result: result1} = renderHook(() => useAppStore());
      const {result: result2} = renderHook(() => useAppStore());

      act(() => {
        result1.current.setUserRole('tracker');
        result1.current.navigateToScreen('BecomeTracker');
      });

      // Both hooks should have the same state
      expect(result1.current.userRole).toBe('tracker');
      expect(result2.current.userRole).toBe('tracker');
      expect(result1.current.currentScreen).toBe('becometracker');
      expect(result2.current.currentScreen).toBe('becometracker');
    });
  });

  describe('tracker functionality', () => {
    describe('initial tracker state', () => {
      it('should have correct initial tracker state', () => {
        const { result } = renderHook(() => useAppStore());

        expect(result.current.trackingSession).toBeNull();
        expect(result.current.isActiveTracker).toBe(false);
        expect(result.current.trackerStatus).toBe('idle');
        expect(result.current.trackerError).toBeNull();
      });
    });

    describe('startTracking', () => {
      const mockLocation: Location = {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const mockStartResponse = {
        sessionId: 'session-123',
        busNumber: '12',
        trackerId: 'tracker-456',
      };

      beforeEach(() => {
        mockLocationService.getCurrentPosition.mockResolvedValue({
          coords: {
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude,
            accuracy: mockLocation.accuracy,
          },
          timestamp: mockLocation.timestamp,
        });
        mockTrackerService.startTracking.mockResolvedValue(mockStartResponse);
        mockWebsocketService.connect.mockResolvedValue(undefined);
        mockLocationTrackingService.startTracking.mockResolvedValue(undefined);
      });

      it('should start tracking successfully', async () => {
        const { result } = renderHook(() => useAppStore());

        await act(async () => {
          await result.current.startTracking('12');
        });

        expect(result.current.trackerStatus).toBe('active');
        expect(result.current.isActiveTracker).toBe(true);
        expect(result.current.userRole).toBe('tracker');
        expect(result.current.selectedBus).toBe('12');
        expect(result.current.trackingSession).toMatchObject({
          sessionId: mockStartResponse.sessionId,
          busNumber: mockStartResponse.busNumber,
          trackerId: mockStartResponse.trackerId,
          isActive: true,
        });
      });

      it('should handle bus already tracked error', async () => {
        const { result } = renderHook(() => useAppStore());
        
        mockTrackerService.startTracking.mockRejectedValue(new Error('BUS_ALREADY_TRACKED'));

        await act(async () => {
          await expect(result.current.startTracking('12')).rejects.toThrow('BUS_ALREADY_TRACKED');
        });

        expect(result.current.trackerStatus).toBe('error');
        expect(result.current.trackerError).toBe('BUS_ALREADY_TRACKED');
        expect(result.current.isActiveTracker).toBe(false);
        expect(result.current.trackingSession).toBeNull();
      });
    });

    describe('stopTracking', () => {
      beforeEach(async () => {
        // Set up active tracking session
        const { result } = renderHook(() => useAppStore());
        
        act(() => {
          result.current.setTrackingSession({
            sessionId: 'session-123',
            busNumber: '12',
            trackerId: 'tracker-456',
            startedAt: new Date(),
            isActive: true,
          });
          result.current.setTrackerStatus('active');
        });
        
        mockLocationTrackingService.stopTracking.mockResolvedValue(undefined);
        mockWebsocketService.disconnect.mockResolvedValue(undefined);
        mockTrackerService.stopTracking.mockResolvedValue(undefined);
      });

      it('should stop tracking successfully', async () => {
        const { result } = renderHook(() => useAppStore());

        await act(async () => {
          await result.current.stopTracking();
        });

        expect(result.current.trackingSession).toBeNull();
        expect(result.current.isActiveTracker).toBe(false);
        expect(result.current.trackerStatus).toBe('idle');
        expect(result.current.userRole).toBeNull();
        expect(result.current.isLocationTracking).toBe(false);
      });
    });

    describe('tracker state setters', () => {
      it('should set tracking session', () => {
        const { result } = renderHook(() => useAppStore());
        const session: TrackingSession = {
          sessionId: 'session-123',
          busNumber: '12',
          trackerId: 'tracker-456',
          startedAt: new Date(),
          isActive: true,
        };

        act(() => {
          result.current.setTrackingSession(session);
        });

        expect(result.current.trackingSession).toEqual(session);
        expect(result.current.isActiveTracker).toBe(true);
      });

      it('should set tracker status', () => {
        const { result } = renderHook(() => useAppStore());

        act(() => {
          result.current.setTrackerStatus('starting');
        });

        expect(result.current.trackerStatus).toBe('starting');
      });
    });
  });
});
