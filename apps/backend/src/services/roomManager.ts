import { RoomManager } from '../websocket/rooms';
import { Server } from 'socket.io';

export class RoomManagerService {
  private static instance: RoomManagerService;
  private roomManager: RoomManager | null = null;

  private constructor() {}

  public static getInstance(): RoomManagerService {
    if (!RoomManagerService.instance) {
      RoomManagerService.instance = new RoomManagerService();
    }
    return RoomManagerService.instance;
  }

  public initialize(io: Server): void {
    this.roomManager = new RoomManager(io);
    console.log('Room Manager Service initialized');
  }

  public getRoomManager(): RoomManager {
    if (!this.roomManager) {
      throw new Error('RoomManager not initialized. Call initialize() first.');
    }
    return this.roomManager;
  }

  public isInitialized(): boolean {
    return this.roomManager !== null;
  }

  public getRoomStatistics() {
    if (!this.roomManager) {
      return [];
    }
    
    return this.roomManager.getAllRooms().map(room => ({
      busNumber: room.busNumber,
      isActive: room.isActive,
      consumerCount: room.consumerCount,
      hasTracker: !!room.tracker,
      lastUpdate: room.lastUpdate
    }));
  }
}