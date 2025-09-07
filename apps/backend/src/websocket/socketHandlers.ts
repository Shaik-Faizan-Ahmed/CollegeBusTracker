import { Server, Socket } from 'socket.io';
import { LocationUpdateEvent, BusSessionEvent } from '@cvr-bus-tracker/shared-types';

export class SocketHandlers {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);

    // Handle location updates from trackers
    socket.on('location_update', (data: LocationUpdateEvent) => {
      console.log('Location update received:', data);
      // Broadcast to all connected clients
      socket.broadcast.emit('location_update', data);
    });

    // Handle bus session updates
    socket.on('bus_session_update', (data: BusSessionEvent) => {
      console.log('Bus session update received:', data);
      // Broadcast to all connected clients
      socket.broadcast.emit('bus_session_update', data);
    });

    // Handle tracker joining a specific bus room
    socket.on('join_bus_room', (busNumber: string) => {
      socket.join(`bus_${busNumber}`);
      console.log(`Socket ${socket.id} joined room: bus_${busNumber}`);
    });

    // Handle tracker leaving a bus room
    socket.on('leave_bus_room', (busNumber: string) => {
      socket.leave(`bus_${busNumber}`);
      console.log(`Socket ${socket.id} left room: bus_${busNumber}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  }

  // Broadcast location update to specific bus room
  public broadcastLocationUpdate(busNumber: string, data: LocationUpdateEvent) {
    this.io.to(`bus_${busNumber}`).emit('location_update', data);
  }

  // Broadcast bus session update to all clients
  public broadcastBusSessionUpdate(data: BusSessionEvent) {
    this.io.emit('bus_session_update', data);
  }
}