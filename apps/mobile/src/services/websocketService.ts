import { io, Socket } from 'socket.io-client';
import { getConfig } from '@cvr-bus-tracker/config';
import { LocationUpdate } from '@cvr-bus-tracker/shared-types';

export interface WebSocketService {
  connect(sessionId: string): Promise<void>;
  disconnect(): void;
  emitLocationUpdate(update: LocationUpdate): void;
  isConnected(): boolean;
  onLocationUpdated(callback: (data: LocationUpdate) => void): void;
  onTrackerDisconnected(callback: (data: { busNumber: string; reason: string }) => void): void;
}

export class WebSocketServiceImpl implements WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    const config = getConfig();
    // WebSocket URL is typically the same as API base URL but with ws:// or wss://
    const wsUrl = config.API_BASE_URL.replace(/^http/, 'ws');
    
    this.socket = io(wsUrl, {
      autoConnect: false,
      timeout: 10000,
      transports: ['websocket'],
    });

    this.setupEventHandlers();
  }

  /**
   * Connect to WebSocket with session authentication
   */
  async connect(sessionId: string): Promise<void> {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.socket!.auth = { sessionId };
      
      this.socket!.once('connect', () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        console.log('WebSocket connected successfully');
        resolve();
      });

      this.socket!.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('WebSocket connection failed:', error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Emit location update to server
   */
  emitLocationUpdate(update: LocationUpdate): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot emit location update: WebSocket not connected');
      return;
    }

    this.socket.emit('location-update', update);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Listen for location updates from other trackers
   */
  onLocationUpdated(callback: (data: LocationUpdate) => void): void {
    if (!this.socket) return;
    
    this.socket.on('location-updated', callback);
  }

  /**
   * Listen for tracker disconnection events
   */
  onTrackerDisconnected(callback: (data: { busNumber: string; reason: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.on('tracker-disconnected', callback);
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server-initiated disconnect, don't reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketServiceImpl();