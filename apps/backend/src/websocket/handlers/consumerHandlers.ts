import { Server, Socket } from 'socket.io';
import { WebSocketService } from '../../services/websocketService';
import { validateBusRoomData } from '../middleware/sessionValidator';
import { JoinBusRoomPayload, LeaveBusRoomPayload } from '../../types/websocket';
import { databaseService } from '../../services/databaseService';

export class ConsumerHandlers {
  private io: Server;
  private websocketService: WebSocketService;

  constructor(io: Server, websocketService: WebSocketService) {
    this.io = io;
    this.websocketService = websocketService;
  }

  public registerHandlers(socket: Socket): void {
    // Handle consumer joining a bus room
    socket.on('join-bus-room', async (data: JoinBusRoomPayload) => {
      await this.handleJoinBusRoom(socket, data);
    });

    // Handle consumer leaving a bus room
    socket.on('leave-bus-room', async (data: LeaveBusRoomPayload) => {
      await this.handleLeaveBusRoom(socket, data);
    });

    // Handle consumer requesting current bus location
    socket.on('get-current-location', async (data: { busNumber: string }) => {
      await this.handleGetCurrentLocation(socket, data);
    });

    // Handle consumer heartbeat
    socket.on('consumer-heartbeat', (data: { busNumber: string; consumerId: string }) => {
      this.handleConsumerHeartbeat(socket, data);
    });
  }

  private async handleJoinBusRoom(socket: Socket, data: JoinBusRoomPayload): Promise<void> {
    try {
      const { busNumber, consumerId } = data;

      // Validate bus room data
      const validation = validateBusRoomData(data);
      if (!validation.isValid) {
        socket.emit('join-bus-room-error', {
          error: validation.error,
          busNumber,
          consumerId
        });
        return;
      }

      // Join the bus room through service
      const result = await this.websocketService.joinBusRoom(socket, busNumber, consumerId);
      
      if (!result.success) {
        socket.emit('join-bus-room-error', {
          error: result.error,
          busNumber,
          consumerId
        });
        return;
      }

      // Get current location if tracker is active
      try {
        const currentLocation = await databaseService.getActiveBusLocation(busNumber);
        
        if (currentLocation) {
          socket.emit('current-location', {
            busNumber,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
            timestamp: currentLocation.updated_at.getTime(),
            lastUpdated: currentLocation.updated_at
          });
        } else {
          socket.emit('no-active-tracker', {
            busNumber,
            message: `No active tracker found for bus ${busNumber}`
          });
        }
      } catch (locationError) {
        console.error('Error fetching current location:', locationError);
        // Don't fail the join operation if location fetch fails
        socket.emit('location-fetch-warning', {
          busNumber,
          message: 'Joined room successfully, but could not fetch current location'
        });
      }

      console.log(`Consumer ${consumerId} joined bus room: ${busNumber}`);

    } catch (error) {
      console.error('Join bus room error:', error);
      socket.emit('join-bus-room-error', {
        error: 'Failed to join bus room',
        busNumber: data.busNumber,
        consumerId: data.consumerId
      });
    }
  }

  private async handleLeaveBusRoom(socket: Socket, data: LeaveBusRoomPayload): Promise<void> {
    try {
      const { busNumber, consumerId } = data;

      // Validate bus room data
      const validation = validateBusRoomData(data);
      if (!validation.isValid) {
        socket.emit('leave-bus-room-error', {
          error: validation.error,
          busNumber,
          consumerId
        });
        return;
      }

      // Leave the bus room through service
      const result = await this.websocketService.leaveBusRoom(socket, busNumber, consumerId);
      
      if (!result.success) {
        socket.emit('leave-bus-room-error', {
          error: result.error,
          busNumber,
          consumerId
        });
        return;
      }

      console.log(`Consumer ${consumerId} left bus room: ${busNumber}`);

    } catch (error) {
      console.error('Leave bus room error:', error);
      socket.emit('leave-bus-room-error', {
        error: 'Failed to leave bus room',
        busNumber: data.busNumber,
        consumerId: data.consumerId
      });
    }
  }

  private async handleGetCurrentLocation(socket: Socket, data: { busNumber: string }): Promise<void> {
    try {
      const { busNumber } = data;

      if (!busNumber || typeof busNumber !== 'string') {
        socket.emit('current-location-error', {
          error: 'Bus number is required',
          busNumber
        });
        return;
      }

      // Get current location from database
      const currentLocation = await databaseService.getActiveBusLocation(busNumber);
      
      if (currentLocation) {
        socket.emit('current-location', {
          busNumber,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.updated_at.getTime(),
          lastUpdated: currentLocation.updated_at
        });
      } else {
        socket.emit('no-active-tracker', {
          busNumber,
          message: `No active tracker found for bus ${busNumber}`
        });
      }

      console.log(`Current location requested for bus ${busNumber}`);

    } catch (error) {
      console.error('Get current location error:', error);
      socket.emit('current-location-error', {
        error: 'Failed to get current location',
        busNumber: data.busNumber
      });
    }
  }

  private handleConsumerHeartbeat(socket: Socket, data: { busNumber: string; consumerId: string }): void {
    try {
      const { busNumber, consumerId } = data;

      // Update room activity
      const roomManager = this.websocketService.getRoomManager();
      const room = roomManager.getRoom(busNumber);
      
      if (room && room.consumers.has(socket.id)) {
        room.lastUpdate = new Date();
        
        socket.emit('consumer-heartbeat-ack', {
          busNumber,
          consumerId,
          timestamp: Date.now(),
          roomActive: room.isActive,
          consumerCount: room.consumerCount
        });
      } else {
        socket.emit('consumer-not-in-room', {
          busNumber,
          consumerId,
          message: 'Consumer not found in room'
        });
      }

    } catch (error) {
      console.error('Consumer heartbeat error:', error);
      socket.emit('heartbeat-error', {
        error: 'Failed to process heartbeat',
        timestamp: Date.now()
      });
    }
  }
}