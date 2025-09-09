import { Server, Socket } from 'socket.io';
import { RoomManager } from '../websocket/rooms';
import { databaseService } from './databaseService';
import { LocationUpdatePayload, TrackerDisconnectedPayload, LocationBroadcastPayload } from '../types/websocket';

export class WebSocketService {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = new RoomManager(io);
  }

  public getRoomManager(): RoomManager {
    return this.roomManager;
  }

  public async processLocationUpdate(
    socket: Socket,
    data: LocationUpdatePayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { busNumber, latitude, longitude, accuracy, timestamp, sessionId } = data;

      // Verify session is still active
      const session = await databaseService.findActiveSession(sessionId);
      if (!session || !session.is_active) {
        return {
          success: false,
          error: 'Session is no longer active'
        };
      }

      // Verify the session belongs to the correct bus
      if (session.bus_number !== busNumber) {
        return {
          success: false,
          error: 'Session bus number mismatch'
        };
      }

      // Update database with new location
      await databaseService.updateSession(sessionId, {
        latitude,
        longitude,
        accuracy,
        updated_at: new Date()
      });

      // Broadcast to all consumers in the bus room
      const broadcastData: LocationBroadcastPayload = {
        busNumber,
        latitude,
        longitude,
        accuracy,
        timestamp
      };

      this.roomManager.broadcastToConsumers(busNumber, 'location-updated', broadcastData);

      // Update room state
      const room = this.roomManager.getRoom(busNumber);
      if (room) {
        room.lastUpdate = new Date();
      }

      console.log(`Location update processed for bus ${busNumber}`);

      return { success: true };

    } catch (error) {
      console.error('Error processing location update:', error);
      return {
        success: false,
        error: 'Failed to process location update'
      };
    }
  }

  public async handleTrackerDisconnection(
    busNumber: string,
    sessionId: string,
    reason: 'session_ended' | 'connection_lost'
  ): Promise<void> {
    try {
      // Mark session as inactive in database
      await databaseService.deactivateSession(sessionId);

      // Broadcast tracker disconnection to consumers
      const disconnectionData: TrackerDisconnectedPayload = {
        busNumber,
        reason,
        timestamp: Date.now()
      };

      this.roomManager.broadcastToConsumers(busNumber, 'tracker-disconnected', disconnectionData);

      console.log(`Tracker disconnection handled for bus ${busNumber}, reason: ${reason}`);

    } catch (error) {
      console.error('Error handling tracker disconnection:', error);
    }
  }

  public async joinBusRoom(
    socket: Socket,
    busNumber: string,
    consumerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const roomId = `bus-${busNumber}`;
      socket.join(roomId);

      const result = this.roomManager.addConsumerToRoom(busNumber, socket.id);
      
      if (!result.success) {
        return result;
      }

      // Check if there's an active tracker for this bus
      const room = this.roomManager.getRoom(busNumber);
      const hasActiveTracker = room && room.isActive;

      socket.emit('bus-room-joined', {
        busNumber,
        hasActiveTracker,
        consumerCount: room?.consumerCount || 0
      });

      console.log(`Consumer ${consumerId} joined bus room: ${busNumber}`);

      return { success: true };

    } catch (error) {
      console.error('Error joining bus room:', error);
      return {
        success: false,
        error: 'Failed to join bus room'
      };
    }
  }

  public async leaveBusRoom(
    socket: Socket,
    busNumber: string,
    consumerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const roomId = `bus-${busNumber}`;
      socket.leave(roomId);

      const result = this.roomManager.removeConsumerFromRoom(busNumber, socket.id);
      
      if (!result.success) {
        return result;
      }

      socket.emit('bus-room-left', {
        busNumber,
        consumerCount: result.room?.consumerCount || 0
      });

      console.log(`Consumer ${consumerId} left bus room: ${busNumber}`);

      return { success: true };

    } catch (error) {
      console.error('Error leaving bus room:', error);
      return {
        success: false,
        error: 'Failed to leave bus room'
      };
    }
  }

  public getRoomStats(): Array<{ busNumber: string; consumerCount: number; hasTracker: boolean }> {
    return this.roomManager.getAllRooms().map(room => ({
      busNumber: room.busNumber,
      consumerCount: room.consumerCount,
      hasTracker: room.isActive
    }));
  }

  public startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.roomManager.cleanupInactiveRooms();
    }, 5 * 60 * 1000);

    console.log('WebSocket cleanup interval started');
  }
}