import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketService } from '../../../src/services/websocketService';
import { databaseService } from '../../../src/services/databaseService';
import { LocationUpdatePayload } from '../../../src/types/websocket';
import eventFixtures from '../../fixtures/websocket-events.json';
import sessionFixtures from '../../fixtures/session-data.json';

// Mock database service
jest.mock('../../../src/services/databaseService');
const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('WebSocketService', () => {
  let httpServer: any;
  let io: Server;
  let websocketService: WebSocketService;
  let mockSocket: any;

  beforeAll(() => {
    httpServer = createServer();
    io = new Server(httpServer);
    websocketService = new WebSocketService(io);
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rooms for test isolation
    websocketService.getRoomManager().clearAllRooms();
    mockSocket = {
      id: 'mock-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn()
    };
  });

  describe('processLocationUpdate', () => {
    it('should process valid location update successfully', async () => {
      const locationData: LocationUpdatePayload = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];

      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      const result = await websocketService.processLocationUpdate(mockSocket, locationData);

      expect(result.success).toBe(true);
      expect(mockDatabaseService.findActiveSession).toHaveBeenCalledWith(locationData.sessionId);
      expect(mockDatabaseService.updateSession).toHaveBeenCalledWith(
        locationData.sessionId,
        expect.objectContaining({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy
        })
      );
    });

    it('should reject location update for inactive session', async () => {
      const locationData: LocationUpdatePayload = eventFixtures.locationUpdate.valid;

      mockDatabaseService.findActiveSession.mockResolvedValue(null);

      const result = await websocketService.processLocationUpdate(mockSocket, locationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('no longer active');
      expect(mockDatabaseService.updateSession).not.toHaveBeenCalled();
    });

    it('should reject location update for wrong bus number', async () => {
      const locationData: LocationUpdatePayload = eventFixtures.locationUpdate.valid;
      const mockSession = { ...sessionFixtures.activeSessions[0], bus_number: 'A5' };

      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);

      const result = await websocketService.processLocationUpdate(mockSocket, locationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('bus number mismatch');
      expect(mockDatabaseService.updateSession).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const locationData: LocationUpdatePayload = eventFixtures.locationUpdate.valid;

      mockDatabaseService.findActiveSession.mockRejectedValue(new Error('Database error'));

      const result = await websocketService.processLocationUpdate(mockSocket, locationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process');
    });

    it('should handle database update errors', async () => {
      const locationData: LocationUpdatePayload = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];

      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockRejectedValue(new Error('Update failed'));

      const result = await websocketService.processLocationUpdate(mockSocket, locationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process');
    });
  });

  describe('handleTrackerDisconnection', () => {
    it('should handle tracker disconnection with session end reason', async () => {
      const busNumber = '12';
      const sessionId = 'session-123';
      const reason = 'session_ended';

      mockDatabaseService.deactivateSession.mockResolvedValue();

      await websocketService.handleTrackerDisconnection(busNumber, sessionId, reason);

      expect(mockDatabaseService.deactivateSession).toHaveBeenCalledWith(sessionId);
    });

    it('should handle tracker disconnection with connection lost reason', async () => {
      const busNumber = '12';
      const sessionId = 'session-123';
      const reason = 'connection_lost';

      mockDatabaseService.deactivateSession.mockResolvedValue();

      await websocketService.handleTrackerDisconnection(busNumber, sessionId, reason);

      expect(mockDatabaseService.deactivateSession).toHaveBeenCalledWith(sessionId);
    });

    it('should handle database error during disconnection', async () => {
      const busNumber = '12';
      const sessionId = 'session-123';
      const reason = 'session_ended';

      mockDatabaseService.deactivateSession.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(
        websocketService.handleTrackerDisconnection(busNumber, sessionId, reason)
      ).resolves.toBeUndefined();
    });
  });

  describe('joinBusRoom', () => {
    it('should join bus room successfully', async () => {
      const busNumber = '12';
      const consumerId = 'consumer-123';

      const result = await websocketService.joinBusRoom(mockSocket, busNumber, consumerId);

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith(`bus-${busNumber}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('bus-room-joined', expect.objectContaining({
        busNumber,
        hasActiveTracker: expect.any(Boolean),
        consumerCount: expect.any(Number)
      }));
    });

    it('should handle errors during room join', async () => {
      const busNumber = '12';
      const consumerId = 'consumer-123';

      mockSocket.join.mockImplementation(() => {
        throw new Error('Socket error');
      });

      const result = await websocketService.joinBusRoom(mockSocket, busNumber, consumerId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to join');
    });
  });

  describe('leaveBusRoom', () => {
    it('should leave bus room successfully', async () => {
      const busNumber = '12';
      const consumerId = 'consumer-123';

      // First join the room
      await websocketService.joinBusRoom(mockSocket, busNumber, consumerId);

      const result = await websocketService.leaveBusRoom(mockSocket, busNumber, consumerId);

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith(`bus-${busNumber}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('bus-room-left', expect.objectContaining({
        busNumber,
        consumerCount: expect.any(Number)
      }));
    });

    it('should handle errors during room leave', async () => {
      const busNumber = '12';
      const consumerId = 'consumer-123';

      mockSocket.leave.mockImplementation(() => {
        throw new Error('Socket error');
      });

      const result = await websocketService.leaveBusRoom(mockSocket, busNumber, consumerId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to leave');
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics', () => {
      // Create some rooms
      const roomManager = websocketService.getRoomManager();
      roomManager.createBusRoom('12');
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      roomManager.addConsumerToRoom('12', 'consumer-socket-456');

      const stats = websocketService.getRoomStats();

      expect(stats).toHaveLength(1);
      expect(stats[0]).toEqual({
        busNumber: '12',
        consumerCount: 2,
        hasTracker: true
      });
    });

    it('should return empty array when no rooms exist', () => {
      const stats = websocketService.getRoomStats();
      expect(stats).toHaveLength(0);
    });
  });

  describe('startCleanupInterval', () => {
    it('should start cleanup interval', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(websocketService.getRoomManager(), 'cleanupInactiveRooms');

      websocketService.startCleanupInterval();

      // Fast-forward 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(spy).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('getRoomManager', () => {
    it('should return room manager instance', () => {
      const roomManager = websocketService.getRoomManager();
      expect(roomManager).toBeDefined();
      expect(typeof roomManager.createBusRoom).toBe('function');
      expect(typeof roomManager.addTrackerToRoom).toBe('function');
      expect(typeof roomManager.addConsumerToRoom).toBe('function');
    });
  });
});