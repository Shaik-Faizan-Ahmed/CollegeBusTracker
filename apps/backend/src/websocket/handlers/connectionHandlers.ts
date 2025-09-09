import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms';
import { validateConnection } from '../middleware/websocketAuth';
import { WebSocketConnection } from '@cvr-bus-tracker/shared-types';

export class ConnectionHandlers {
  private io: Server;
  private roomManager: RoomManager;
  private connections: Map<string, WebSocketConnection> = new Map();

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
  }

  public handleConnection(socket: Socket): void {
    console.log(`WebSocket client connected: ${socket.id}`);

    // Handle client authentication and type identification
    socket.on('authenticate', async (data) => {
      try {
        const validation = validateConnection(socket, data);
        
        if (!validation.isValid) {
          socket.emit('authentication-error', { 
            error: validation.error 
          });
          socket.disconnect();
          return;
        }

        const connection = validation.connection!;
        this.connections.set(socket.id, connection);

        // Join the client to the appropriate bus room
        const roomId = `bus-${connection.busNumber}`;
        socket.join(roomId);

        if (connection.type === 'tracker') {
          const result = this.roomManager.addTrackerToRoom(
            connection.busNumber, 
            socket.id, 
            connection.sessionId!
          );

          if (!result.success) {
            socket.emit('tracker-conflict', { 
              error: result.error,
              busNumber: connection.busNumber 
            });
            socket.disconnect();
            return;
          }

          socket.emit('tracker-authenticated', { 
            busNumber: connection.busNumber,
            sessionId: connection.sessionId
          });
        } else {
          this.roomManager.addConsumerToRoom(connection.busNumber, socket.id);
          
          socket.emit('consumer-authenticated', { 
            busNumber: connection.busNumber,
            consumerId: data.consumerId
          });
        }

        console.log(`${connection.type} authenticated for bus ${connection.busNumber}: ${socket.id}`);

      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authentication-error', { 
          error: 'Authentication failed' 
        });
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      this.handleDisconnection(socket, 'error');
    });
  }

  private handleDisconnection(socket: Socket, reason: string): void {
    const connection = this.connections.get(socket.id);
    
    if (!connection) {
      console.log(`Client disconnected without authentication: ${socket.id}`);
      return;
    }

    console.log(`${connection.type} disconnected: ${socket.id}, reason: ${reason}`);

    if (connection.type === 'tracker') {
      // Handle tracker disconnection
      const result = this.roomManager.removeTrackerFromRoom(connection.busNumber, socket.id);
      
      if (result.success) {
        // Notify consumers that tracker disconnected
        const disconnectionReason = reason === 'client namespace disconnect' ? 'session_ended' : 'connection_lost';
        
        this.roomManager.broadcastToConsumers(connection.busNumber, 'tracker-disconnected', {
          busNumber: connection.busNumber,
          reason: disconnectionReason,
          timestamp: Date.now()
        });

        console.log(`Notified consumers of tracker disconnection for bus ${connection.busNumber}`);
      }
    } else {
      // Handle consumer disconnection
      this.roomManager.removeConsumerFromRoom(connection.busNumber, socket.id);
    }

    // Remove connection from tracking
    this.connections.delete(socket.id);

    // Update last activity for room cleanup
    const room = this.roomManager.getRoom(connection.busNumber);
    if (room) {
      room.lastUpdate = new Date();
    }
  }

  public getActiveConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  public getConnectionBySocketId(socketId: string): WebSocketConnection | undefined {
    return this.connections.get(socketId);
  }

  public getConnectionsByBus(busNumber: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.busNumber === busNumber
    );
  }

  public updateConnectionActivity(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }
}