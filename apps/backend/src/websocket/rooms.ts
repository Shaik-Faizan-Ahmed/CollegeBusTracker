import { Server } from 'socket.io';
import { RoomState, RoomOperationResult } from '../types/websocket';

export class RoomManager {
  private io: Server;
  private rooms: Map<string, RoomState> = new Map();
  
  constructor(io: Server) {
    this.io = io;
  }

  public createBusRoom(busNumber: string): RoomOperationResult {
    const roomId = `bus-${busNumber}`;
    
    if (this.rooms.has(roomId)) {
      return {
        success: true,
        room: this.rooms.get(roomId)
      };
    }

    const room: RoomState = {
      busNumber,
      consumerCount: 0,
      lastUpdate: new Date(),
      isActive: false,
      consumers: new Set<string>()
    };

    this.rooms.set(roomId, room);
    
    return {
      success: true,
      room
    };
  }

  public addTrackerToRoom(busNumber: string, socketId: string, sessionId: string): RoomOperationResult {
    const roomId = `bus-${busNumber}`;
    let room = this.rooms.get(roomId);

    if (!room) {
      const createResult = this.createBusRoom(busNumber);
      if (!createResult.success) {
        return createResult;
      }
      room = createResult.room!;
    }

    // Check if room already has an active tracker
    if (room.tracker && room.isActive) {
      return {
        success: false,
        error: `Bus ${busNumber} already has an active tracker`
      };
    }

    // Add tracker to room
    room.tracker = { socketId, sessionId };
    room.trackerId = sessionId;
    room.isActive = true;
    room.lastUpdate = new Date();

    this.rooms.set(roomId, room);

    return {
      success: true,
      room
    };
  }

  public addConsumerToRoom(busNumber: string, socketId: string): RoomOperationResult {
    const roomId = `bus-${busNumber}`;
    let room = this.rooms.get(roomId);

    if (!room) {
      const createResult = this.createBusRoom(busNumber);
      if (!createResult.success) {
        return createResult;
      }
      room = createResult.room!;
    }

    // Check if consumer already exists before adding
    const wasAlreadyInRoom = room.consumers.has(socketId);
    room.consumers.add(socketId);
    room.consumerCount = room.consumers.size;
    room.lastUpdate = new Date();

    this.rooms.set(roomId, room);

    return {
      success: true,
      room
    };
  }

  public removeConsumerFromRoom(busNumber: string, socketId: string): RoomOperationResult {
    const roomId = `bus-${busNumber}`;
    const room = this.rooms.get(roomId);

    if (!room) {
      return {
        success: false,
        error: `Room for bus ${busNumber} not found`
      };
    }

    room.consumers.delete(socketId);
    room.consumerCount = room.consumers.size;
    room.lastUpdate = new Date();

    this.rooms.set(roomId, room);

    return {
      success: true,
      room
    };
  }

  public removeTrackerFromRoom(busNumber: string, socketId: string): RoomOperationResult {
    const roomId = `bus-${busNumber}`;
    const room = this.rooms.get(roomId);

    if (!room) {
      return {
        success: false,
        error: `Room for bus ${busNumber} not found`
      };
    }

    if (room.tracker?.socketId === socketId) {
      room.tracker = undefined;
      room.trackerId = undefined;
      room.isActive = false;
      room.lastUpdate = new Date();

      // Cleanup room if no consumers
      if (room.consumerCount === 0) {
        this.rooms.delete(roomId);
        return {
          success: true,
          room: undefined
        };
      }

      this.rooms.set(roomId, room);
    }

    return {
      success: true,
      room
    };
  }

  public getRoom(busNumber: string): RoomState | undefined {
    return this.rooms.get(`bus-${busNumber}`);
  }

  public getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  public broadcastToRoom(busNumber: string, event: string, data: any): void {
    const roomId = `bus-${busNumber}`;
    this.io.to(roomId).emit(event, data);
  }

  public broadcastToConsumers(busNumber: string, event: string, data: any): void {
    const roomId = `bus-${busNumber}`;
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.consumers.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public cleanupInactiveRooms(): void {
    const now = new Date();
    const cleanupThreshold = 30 * 60 * 1000; // 30 minutes

    this.rooms.forEach((room, roomId) => {
      const timeSinceLastUpdate = now.getTime() - room.lastUpdate.getTime();
      
      if (!room.isActive && room.consumerCount === 0 && timeSinceLastUpdate > cleanupThreshold) {
        this.rooms.delete(roomId);
        console.log(`Cleaned up inactive room: ${roomId}`);
      }
    });
  }

  // Method for testing - clear all rooms
  public clearAllRooms(): void {
    this.rooms.clear();
  }
}