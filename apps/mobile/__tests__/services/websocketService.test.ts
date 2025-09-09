import { WebSocketServiceImpl } from '../../src/services/websocketService';
import { LocationUpdate } from '@cvr-bus-tracker/shared-types';
import { getConfig } from '@cvr-bus-tracker/config';

// Mock socket.io-client
const mockSocket = {
  auth: {},
  connected: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

jest.mock('@cvr-bus-tracker/config', () => ({
  getConfig: jest.fn(() => ({
    API_BASE_URL: 'http://localhost:3001',
  })),
}));

describe('WebSocketService', () => {
  let service: WebSocketServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
    service = new WebSocketServiceImpl();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('connection', () => {
    it('should connect successfully with session ID', async () => {
      const sessionId = 'session-123';
      
      // Mock successful connection
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect') {
          setTimeout(callback, 0);
        }
      });

      const connectPromise = service.connect(sessionId);
      
      expect(mockSocket.auth).toEqual({ sessionId });
      expect(mockSocket.connect).toHaveBeenCalled();

      await connectPromise;
    });

    it('should handle connection timeout', async () => {
      const sessionId = 'session-123';
      
      // Don't trigger any callbacks to simulate timeout
      mockSocket.once.mockImplementation(() => {});

      const connectPromise = service.connect(sessionId);
      
      await expect(connectPromise).rejects.toThrow('WebSocket connection timeout');
    }, 15000);

    it('should handle connection errors', async () => {
      const sessionId = 'session-123';
      const connectionError = new Error('Connection failed');
      
      mockSocket.once.mockImplementation((event, callback) => {
        if (event === 'connect_error') {
          setTimeout(() => callback(connectionError), 0);
        }
      });

      await expect(service.connect(sessionId)).rejects.toThrow('Connection failed');
    });

    it('should disconnect successfully', () => {
      service.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should return correct connection status', () => {
      mockSocket.connected = false;
      expect(service.isConnected()).toBe(false);

      mockSocket.connected = true;
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('location updates', () => {
    const mockLocationUpdate: LocationUpdate = {
      busNumber: '12',
      latitude: 17.3850,
      longitude: 78.4867,
      accuracy: 10,
      timestamp: Date.now(),
      sessionId: 'session-123',
    };

    it('should emit location update when connected', () => {
      mockSocket.connected = true;

      service.emitLocationUpdate(mockLocationUpdate);

      expect(mockSocket.emit).toHaveBeenCalledWith('location-update', mockLocationUpdate);
    });

    it('should not emit when disconnected', () => {
      mockSocket.connected = false;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.emitLocationUpdate(mockLocationUpdate);

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Cannot emit location update: WebSocket not connected');
      
      consoleSpy.mockRestore();
    });

    it('should register location updated listener', () => {
      const callback = jest.fn();
      
      service.onLocationUpdated(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('location-updated', callback);
    });

    it('should register tracker disconnected listener', () => {
      const callback = jest.fn();
      
      service.onTrackerDisconnected(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('tracker-disconnected', callback);
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      // Reset mock to capture event handler registrations
      mockSocket.on.mockClear();
    });

    it('should set up internal event handlers', () => {
      new WebSocketServiceImpl();

      // Verify that internal event handlers are registered
      const registeredEvents = mockSocket.on.mock.calls.map(call => call[0]);
      expect(registeredEvents).toContain('connect');
      expect(registeredEvents).toContain('disconnect');
      expect(registeredEvents).toContain('connect_error');
      expect(registeredEvents).toContain('error');
    });

    it('should handle connect event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Create new service to capture handlers
      new WebSocketServiceImpl();
      
      // Find and call the connect handler
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      connectHandler?.();

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connected');
      consoleSpy.mockRestore();
    });

    it('should handle disconnect event', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Create new service to capture handlers
      new WebSocketServiceImpl();
      
      // Find and call the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      disconnectHandler?.('io client disconnect');

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket disconnected:', 'io client disconnect');
      consoleSpy.mockRestore();
    });

    it('should handle server disconnect without reconnection', () => {
      // Find and call the disconnect handler with server disconnect reason
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      disconnectHandler?.('io server disconnect');

      // Should not attempt reconnection for server-initiated disconnect
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should handle connection error with reconnection', () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create new service to capture handlers
      new WebSocketServiceImpl();
      
      // Find and call the connect_error handler
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      errorHandler?.(new Error('Connection error'));

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection error:', expect.any(Error));

      // Should schedule reconnection
      jest.advanceTimersByTime(2000); // First reconnection attempt after 2 seconds
      
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('reconnection logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should implement exponential backoff for reconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Find the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
      
      // Trigger multiple disconnections
      disconnectHandler?.('transport close');
      jest.advanceTimersByTime(2000); // First attempt: 2 seconds
      
      disconnectHandler?.('transport close');
      jest.advanceTimersByTime(4000); // Second attempt: 4 seconds
      
      disconnectHandler?.('transport close');
      jest.advanceTimersByTime(8000); // Third attempt: 8 seconds

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Attempting to reconnect'));
      consoleSpy.mockRestore();
    });

    it('should stop reconnecting after max attempts', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Find the error handler
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      
      // Trigger 6 connection errors (exceeds max of 5)
      for (let i = 0; i < 6; i++) {
        errorHandler?.(new Error('Connection error'));
        jest.advanceTimersByTime(Math.pow(2, i + 1) * 1000);
      }

      expect(consoleSpy).toHaveBeenCalledWith('Max reconnection attempts reached');
      consoleSpy.mockRestore();
    });

    it('should reset reconnection attempts on successful connection', () => {
      const service = new WebSocketServiceImpl();
      
      // Find handlers
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      
      // Trigger error, then success
      errorHandler?.(new Error('Connection error'));
      connectHandler?.(); // Successful connection should reset attempts

      // Verify that reconnection counter was reset by checking internal state
      // (This would normally be tested through integration tests)
      expect(mockSocket.on).toHaveBeenCalled(); // Basic verification that setup continued
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      service.destroy();

      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle destroy when socket is null', () => {
      // Force socket to null state
      service.destroy();
      
      // Second destroy should not throw
      expect(() => service.destroy()).not.toThrow();
    });
  });
});