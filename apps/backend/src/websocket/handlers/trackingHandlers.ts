import { Server, Socket } from 'socket.io';
import { WebSocketService } from '../../services/websocketService';
import { validateLocationUpdate, checkSessionActive } from '../middleware/sessionValidator';
import { checkRateLimit } from '../middleware/rateLimiter';
import { LocationUpdatePayload } from '../../types/websocket';

export class TrackingHandlers {
  private io: Server;
  private websocketService: WebSocketService;

  constructor(io: Server, websocketService: WebSocketService) {
    this.io = io;
    this.websocketService = websocketService;
  }

  public registerHandlers(socket: Socket): void {
    // Handle location updates from trackers
    socket.on('location-update', async (data: LocationUpdatePayload) => {
      await this.handleLocationUpdate(socket, data);
    });

    // Handle tracker session end
    socket.on('end-tracking-session', async (data: { sessionId: string; busNumber: string }) => {
      await this.handleEndTrackingSession(socket, data);
    });

    // Handle tracker heartbeat to maintain session
    socket.on('tracker-heartbeat', async (data: { sessionId: string; busNumber: string }) => {
      await this.handleTrackerHeartbeat(socket, data);
    });
  }

  private async handleLocationUpdate(socket: Socket, data: LocationUpdatePayload): Promise<void> {
    try {
      // Check rate limiting first
      const rateCheck = checkRateLimit(socket, 'location-update');
      if (!rateCheck.allowed) {
        socket.emit('rate-limit-exceeded', {
          error: rateCheck.reason,
          event: 'location-update',
          timestamp: Date.now()
        });
        return;
      }

      // Validate location update data
      const validation = validateLocationUpdate(data);
      if (!validation.isValid) {
        socket.emit('location-update-error', {
          error: validation.error,
          timestamp: Date.now()
        });
        return;
      }

      // Check if session is still active
      const isActive = await checkSessionActive(data.sessionId);
      if (!isActive) {
        socket.emit('session-expired', {
          error: 'Tracking session has expired',
          sessionId: data.sessionId,
          busNumber: data.busNumber
        });
        
        // Automatically handle tracker disconnection
        await this.websocketService.handleTrackerDisconnection(
          data.busNumber,
          data.sessionId,
          'session_ended'
        );
        
        socket.disconnect();
        return;
      }

      // Process location update through service
      const result = await this.websocketService.processLocationUpdate(socket, data);
      
      if (!result.success) {
        socket.emit('location-update-error', {
          error: result.error,
          timestamp: Date.now()
        });
        return;
      }

      // Send acknowledgment to tracker
      socket.emit('location-update-ack', {
        busNumber: data.busNumber,
        timestamp: data.timestamp,
        processed: Date.now()
      });

      console.log(`Location update processed successfully for bus ${data.busNumber}`);

    } catch (error) {
      console.error('Location update error:', error);
      socket.emit('location-update-error', {
        error: 'Failed to process location update',
        timestamp: Date.now()
      });
    }
  }

  private async handleEndTrackingSession(
    socket: Socket, 
    data: { sessionId: string; busNumber: string }
  ): Promise<void> {
    try {
      const { sessionId, busNumber } = data;

      // Verify session ownership
      const isActive = await checkSessionActive(sessionId);
      if (!isActive) {
        socket.emit('session-not-found', {
          error: 'Session not found or already ended',
          sessionId,
          busNumber
        });
        return;
      }

      // Handle tracker disconnection through service
      await this.websocketService.handleTrackerDisconnection(
        busNumber,
        sessionId,
        'session_ended'
      );

      // Remove tracker from room
      const roomManager = this.websocketService.getRoomManager();
      roomManager.removeTrackerFromRoom(busNumber, socket.id);

      // Send confirmation to tracker
      socket.emit('tracking-session-ended', {
        busNumber,
        sessionId,
        timestamp: Date.now()
      });

      // Disconnect the tracker socket
      socket.disconnect();

      console.log(`Tracking session ended for bus ${busNumber}, session: ${sessionId}`);

    } catch (error) {
      console.error('End tracking session error:', error);
      socket.emit('end-session-error', {
        error: 'Failed to end tracking session',
        timestamp: Date.now()
      });
    }
  }

  private async handleTrackerHeartbeat(
    socket: Socket, 
    data: { sessionId: string; busNumber: string }
  ): Promise<void> {
    try {
      const { sessionId, busNumber } = data;

      // Check session status
      const isActive = await checkSessionActive(sessionId);
      if (!isActive) {
        socket.emit('session-expired', {
          error: 'Tracking session has expired',
          sessionId,
          busNumber
        });
        
        // Handle automatic disconnection
        await this.websocketService.handleTrackerDisconnection(
          busNumber,
          sessionId,
          'session_ended'
        );
        
        socket.disconnect();
        return;
      }

      // Send heartbeat acknowledgment
      socket.emit('tracker-heartbeat-ack', {
        busNumber,
        sessionId,
        timestamp: Date.now(),
        status: 'active'
      });

      // Update room activity
      const roomManager = this.websocketService.getRoomManager();
      const room = roomManager.getRoom(busNumber);
      if (room) {
        room.lastUpdate = new Date();
      }

    } catch (error) {
      console.error('Tracker heartbeat error:', error);
      socket.emit('heartbeat-error', {
        error: 'Failed to process heartbeat',
        timestamp: Date.now()
      });
    }
  }
}