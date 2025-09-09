import { renderHook, act } from '@testing-library/react-hooks';
import { useConsumerWebSocket } from '../../src/hooks/useConsumerWebSocket';
import { websocketService } from '../../src/services/websocketService';
import { LocationUpdate } from '@cvr-bus-tracker/shared-types';

// Mock the websocket service
jest.mock('../../src/services/websocketService', () => ({
  websocketService: {
    connect: jest.fn(),
  },
}));

const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  removeAllListeners: jest.fn(),
  disconnect: jest.fn(),
};

const mockedWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('useConsumerWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedWebsocketService.connect.mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.removeAllListeners.mockClear();
    mockSocket.disconnect.mockClear();
  });

  it('should initialize with default state', () => {
    const callbacks = {
      onLocationUpdate: jest.fn(),
      onTrackerDisconnected: jest.fn(),
      onConnectionChange: jest.fn(),
    };

    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should connect to WebSocket for specified bus', () => {
    const callbacks = {
      onLocationUpdate: jest.fn(),
    };

    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    expect(mockedWebsocketService.connect).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('location-updated', expect.any(Function));
    expect(mockSocket.emit).toHaveBeenCalledWith('join-bus-room', { busNumber: '12' });
  });

  it('should handle location updates', () => {
    const mockLocationUpdate: LocationUpdate = {
      busNumber: '12',
      latitude: 17.3850,
      longitude: 78.4867,
      accuracy: 10,
      timestamp: Date.now(),
      sessionId: 'session-123',
    };

    const callbacks = {
      onLocationUpdate: jest.fn(),
    };

    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    // Simulate location update event
    const locationUpdateHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'location-updated'
    )?.[1];

    act(() => {
      locationUpdateHandler?.(mockLocationUpdate);
    });

    expect(callbacks.onLocationUpdate).toHaveBeenCalledWith(mockLocationUpdate);
  });

  it('should handle tracker disconnection', () => {
    const mockDisconnectionData = {
      busNumber: '12',
      reason: 'session_ended',
    };

    const callbacks = {
      onTrackerDisconnected: jest.fn(),
    };

    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    // Simulate tracker disconnection event
    const trackerDisconnectedHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'tracker-disconnected'
    )?.[1];

    act(() => {
      trackerDisconnectedHandler?.(mockDisconnectionData);
    });

    expect(callbacks.onTrackerDisconnected).toHaveBeenCalledWith(mockDisconnectionData);
  });

  it('should handle connection state changes', () => {
    const callbacks = {
      onConnectionChange: jest.fn(),
    };

    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];

    act(() => {
      connectHandler?.();
    });

    expect(callbacks.onConnectionChange).toHaveBeenCalledWith(true);

    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'disconnect'
    )?.[1];

    act(() => {
      disconnectHandler?.();
    });

    expect(callbacks.onConnectionChange).toHaveBeenCalledWith(false);
  });

  it('should disconnect from WebSocket', () => {
    const callbacks = {};
    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should not create duplicate connections for same bus', () => {
    const callbacks = {};
    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    act(() => {
      result.current.connect('12'); // Same bus number
    });

    // Should only connect once
    expect(mockedWebsocketService.connect).toHaveBeenCalledTimes(1);
  });

  it('should disconnect from previous bus when connecting to new bus', () => {
    const callbacks = {};
    const { result } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    act(() => {
      result.current.connect('13'); // Different bus number
    });

    // Should disconnect from previous and connect to new
    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockedWebsocketService.connect).toHaveBeenCalledTimes(2);
  });

  it('should cleanup on unmount', () => {
    const callbacks = {};
    const { result, unmount } = renderHook(() => useConsumerWebSocket(callbacks));

    act(() => {
      result.current.connect('12');
    });

    unmount();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});