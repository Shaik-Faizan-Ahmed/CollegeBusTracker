import { Server } from 'socket.io';
import { createServer } from 'http';
import { RoomManager } from '../../../src/websocket/rooms';

describe('RoomManager', () => {
  let httpServer: any;
  let io: Server;
  let roomManager: RoomManager;

  beforeAll(() => {
    httpServer = createServer();
    io = new Server(httpServer);
    roomManager = new RoomManager(io);
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    // Clear all rooms before each test for proper isolation
    roomManager.clearAllRooms();
  });

  describe('createBusRoom', () => {
    it('should create a new bus room', () => {
      const result = roomManager.createBusRoom('12');
      
      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room!.busNumber).toBe('12');
      expect(result.room!.consumerCount).toBe(0);
      expect(result.room!.isActive).toBe(false);
    });

    it('should return existing room if already created', () => {
      const firstResult = roomManager.createBusRoom('12');
      const secondResult = roomManager.createBusRoom('12');
      
      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
      expect(firstResult.room).toEqual(secondResult.room);
    });
  });

  describe('addTrackerToRoom', () => {
    it('should add tracker to room successfully', () => {
      const result = roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      
      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room!.tracker).toEqual({
        socketId: 'socket-123',
        sessionId: 'session-123'
      });
      expect(result.room!.trackerId).toBe('session-123');
      expect(result.room!.isActive).toBe(true);
    });

    it('should reject adding tracker when room already has active tracker', () => {
      // Add first tracker
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      
      // Try to add second tracker
      const result = roomManager.addTrackerToRoom('12', 'socket-456', 'session-456');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already has an active tracker');
    });

    it('should allow adding tracker to room with inactive tracker', () => {
      // Add and remove tracker to make room inactive
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      roomManager.removeTrackerFromRoom('12', 'socket-123');
      
      // Add new tracker
      const result = roomManager.addTrackerToRoom('12', 'socket-456', 'session-456');
      
      expect(result.success).toBe(true);
      expect(result.room!.tracker!.socketId).toBe('socket-456');
      expect(result.room!.isActive).toBe(true);
    });
  });

  describe('addConsumerToRoom', () => {
    it('should add consumer to room', () => {
      const result = roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(1);
      expect(result.room!.consumers.has('consumer-socket-123')).toBe(true);
    });

    it('should increment consumer count when adding multiple consumers', () => {
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      const result = roomManager.addConsumerToRoom('12', 'consumer-socket-456');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(2);
      expect(result.room!.consumers.has('consumer-socket-123')).toBe(true);
      expect(result.room!.consumers.has('consumer-socket-456')).toBe(true);
    });

    it('should not increment count for same consumer added twice', () => {
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      const result = roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(1);
    });
  });

  describe('removeConsumerFromRoom', () => {
    it('should remove consumer from room', () => {
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      const result = roomManager.removeConsumerFromRoom('12', 'consumer-socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(0);
      expect(result.room!.consumers.has('consumer-socket-123')).toBe(false);
    });

    it('should decrement consumer count correctly', () => {
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      roomManager.addConsumerToRoom('12', 'consumer-socket-456');
      
      const result = roomManager.removeConsumerFromRoom('12', 'consumer-socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(1);
      expect(result.room!.consumers.has('consumer-socket-456')).toBe(true);
    });

    it('should handle removing non-existent consumer', () => {
      roomManager.createBusRoom('12');
      const result = roomManager.removeConsumerFromRoom('12', 'non-existent-socket');
      
      expect(result.success).toBe(true);
      expect(result.room!.consumerCount).toBe(0);
    });

    it('should return error for non-existent room', () => {
      const result = roomManager.removeConsumerFromRoom('99', 'consumer-socket-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Room for bus 99 not found');
    });
  });

  describe('removeTrackerFromRoom', () => {
    it('should remove tracker from room', () => {
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      roomManager.addConsumerToRoom('12', 'consumer-socket-123'); // Add consumer so room isn't deleted
      const result = roomManager.removeTrackerFromRoom('12', 'socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.tracker).toBeUndefined();
      expect(result.room!.trackerId).toBeUndefined();
      expect(result.room!.isActive).toBe(false);
    });

    it('should delete room when removing tracker with no consumers', () => {
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      const result = roomManager.removeTrackerFromRoom('12', 'socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room).toBeUndefined();
      expect(roomManager.getRoom('12')).toBeUndefined();
    });

    it('should keep room when removing tracker but consumers exist', () => {
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      roomManager.addConsumerToRoom('12', 'consumer-socket-456');
      
      const result = roomManager.removeTrackerFromRoom('12', 'socket-123');
      
      expect(result.success).toBe(true);
      expect(result.room!.tracker).toBeUndefined();
      expect(result.room!.isActive).toBe(false);
      expect(result.room!.consumerCount).toBe(1);
      expect(roomManager.getRoom('12')).toBeDefined();
    });

    it('should handle removing tracker from room with different socket ID', () => {
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      const result = roomManager.removeTrackerFromRoom('12', 'different-socket');
      
      expect(result.success).toBe(true);
      expect(result.room!.tracker).toBeDefined();
      expect(result.room!.isActive).toBe(true);
    });
  });

  describe('getRoom', () => {
    it('should return room if exists', () => {
      roomManager.createBusRoom('12');
      const room = roomManager.getRoom('12');
      
      expect(room).toBeDefined();
      expect(room!.busNumber).toBe('12');
    });

    it('should return undefined for non-existent room', () => {
      const room = roomManager.getRoom('99');
      expect(room).toBeUndefined();
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms', () => {
      roomManager.createBusRoom('12');
      roomManager.createBusRoom('A5');
      
      const rooms = roomManager.getAllRooms();
      expect(rooms).toHaveLength(2);
      expect(rooms.map(r => r.busNumber)).toContain('12');
      expect(rooms.map(r => r.busNumber)).toContain('A5');
    });

    it('should return empty array when no rooms exist', () => {
      const rooms = roomManager.getAllRooms();
      expect(rooms).toHaveLength(0);
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should cleanup inactive rooms older than threshold', () => {
      // Create inactive room
      roomManager.createBusRoom('12');
      const room = roomManager.getRoom('12')!;
      
      // Simulate old timestamp (more than 30 minutes ago)
      room.lastUpdate = new Date(Date.now() - 35 * 60 * 1000);
      room.isActive = false;
      room.consumerCount = 0;
      
      roomManager.cleanupInactiveRooms();
      
      expect(roomManager.getRoom('12')).toBeUndefined();
    });

    it('should not cleanup active rooms', () => {
      roomManager.addTrackerToRoom('12', 'socket-123', 'session-123');
      const room = roomManager.getRoom('12')!;
      
      // Simulate old timestamp
      room.lastUpdate = new Date(Date.now() - 35 * 60 * 1000);
      
      roomManager.cleanupInactiveRooms();
      
      expect(roomManager.getRoom('12')).toBeDefined();
    });

    it('should not cleanup inactive rooms with consumers', () => {
      roomManager.createBusRoom('12');
      roomManager.addConsumerToRoom('12', 'consumer-socket-123');
      const room = roomManager.getRoom('12')!;
      
      // Simulate old timestamp and make inactive
      room.lastUpdate = new Date(Date.now() - 35 * 60 * 1000);
      room.isActive = false;
      
      roomManager.cleanupInactiveRooms();
      
      expect(roomManager.getRoom('12')).toBeDefined();
    });

    it('should not cleanup recent inactive rooms', () => {
      roomManager.createBusRoom('12');
      const room = roomManager.getRoom('12')!;
      
      // Recent timestamp (less than 30 minutes ago)
      room.lastUpdate = new Date(Date.now() - 10 * 60 * 1000);
      room.isActive = false;
      room.consumerCount = 0;
      
      roomManager.cleanupInactiveRooms();
      
      expect(roomManager.getRoom('12')).toBeDefined();
    });
  });
});