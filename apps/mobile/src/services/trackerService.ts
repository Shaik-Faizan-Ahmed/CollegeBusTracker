import AsyncStorage from '@react-native-async-storage/async-storage';
import {io, Socket} from 'socket.io-client';
import {apiClient} from './api';
import {getMobileConfig} from '../config/environment';
import {
  TrackingSession,
  Location,
  StartTrackerResponse,
} from '@cvr-bus-tracker/shared-types';

const STORAGE_KEYS = {
  TRACKING_SESSION: 'cvr_bus_tracker_session',
};

export class TrackerService {
  private currentSession: TrackingSession | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private socket: Socket | null = null;

  constructor() {
    this.loadStoredSession();
  }

  private initializeSocket() {
    if (this.socket?.connected || !this.currentSession) {
      return;
    }

    const config = getMobileConfig();
    console.log(`Attempting to connect to socket at ${config.apiBaseUrl}`);

    // Disconnect any existing socket before creating a new one
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(config.websocketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket'], // Explicitly use websockets
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully:', this.socket?.id);
    });

    this.socket.on('disconnect', reason => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket connection error:', error.message);
    });
  }

  private disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected.');
    }
  }

  async startTracking(
    busNumber: string,
    location: Location,
  ): Promise<StartTrackerResponse> {
    try {
      // Debug: Log what we're about to send
      const payload = {busNumber, ...location};
      console.log('🚌 TrackerService.startTracking called with:');
      console.log('🚌 busNumber:', busNumber);
      console.log('🚌 location:', location);
      console.log('🚌 payload to send:', payload);
      console.log('🚌 payload JSON:', JSON.stringify(payload));
      
      // Validate payload before sending
      if (!busNumber) {
        throw new Error('Bus number is required');
      }
      if (typeof location.latitude !== 'number' || isNaN(location.latitude)) {
        throw new Error(`Invalid latitude: ${location.latitude} (type: ${typeof location.latitude})`);
      }
      if (typeof location.longitude !== 'number' || isNaN(location.longitude)) {
        throw new Error(`Invalid longitude: ${location.longitude} (type: ${typeof location.longitude})`);
      }
      
      const response = await apiClient.post<StartTrackerResponse>(
        '/tracker/start',
        payload,
      );

      const session: TrackingSession = {
        ...response,
        startedAt: new Date(),
        isActive: true,
      };

      await this.storeSession(session);
      this.currentSession = session;

      this.initializeSocket();

      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('already has an active tracker')
      ) {
        throw new Error('BUS_ALREADY_TRACKED');
      }
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active tracking session');
    }

    try {
      await apiClient.post('/tracker/stop', {},
        {
          'x-session-id': this.currentSession.sessionId,
        },
      );
    } catch(e) {
        console.error("Failed to stop tracker on server", e)
    } finally {
      this.disconnectSocket();
      if (this.locationUpdateInterval) {
        clearInterval(this.locationUpdateInterval);
        this.locationUpdateInterval = null;
      }
      await this.clearSession();
      this.currentSession = null;
    }
  }

  updateLocation(location: Location): void {
    if (!this.currentSession || !this.socket || !this.socket.connected) {
      console.error(
        'Cannot update location: no session or socket not connected.',
        {
          hasSession: !!this.currentSession,
          hasSocket: !!this.socket,
          isConnected: this.socket?.connected,
        },
      );
      // Attempt to re-initialize socket if we have a session but socket is not connected
      if (this.currentSession && (!this.socket || !this.socket.connected)) {
        this.initializeSocket();
      }
      return;
    }

    const payload = {
      sessionId: this.currentSession.sessionId,
      busNumber: this.currentSession.busNumber,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    };

    this.socket.emit('location-update', payload);
  }

  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }

  isTracking(): boolean {
    return this.currentSession?.isActive ?? false;
  }

  getCurrentBusNumber(): string | null {
    return this.currentSession?.busNumber ?? null;
  }

  startLocationUpdates(
    locationProvider: () => Promise<Location>,
    intervalMs: number = 12000,
  ): void {
    if (!this.currentSession) {
      throw new Error('No active tracking session');
    }

    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    const getLocationAndUpdate = async () => {
      try {
        const location = await locationProvider();
        this.updateLocation(location);
      } catch (error) {
        console.error('Location provider failed:', error);
      }
    };

    getLocationAndUpdate();
    this.locationUpdateInterval = setInterval(getLocationAndUpdate, intervalMs);
  }

  stopLocationUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  private async storeSession(session: TrackingSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.TRACKING_SESSION,
        JSON.stringify(session),
      );
    } catch (error) {
      console.error('Failed to store tracking session:', error);
    }
  }

  private async loadStoredSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(
        STORAGE_KEYS.TRACKING_SESSION,
      );
      if (sessionData) {
        const session: TrackingSession = JSON.parse(sessionData);
        const now = new Date();
        const sessionAge = now.getTime() - new Date(session.startedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge < maxAge && session.isActive) {
          this.currentSession = session;
          this.initializeSocket();
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load stored session:', error);
      await this.clearSession();
    }
  }

  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TRACKING_SESSION);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  handleAppStateChange(newState: string): void {
    if (newState === 'active' && this.isTracking()) {
      if (!this.socket || !this.socket.connected) {
        console.log('App foregrounded, re-establishing socket connection...');
        this.initializeSocket();
      }
    }
  }
}

export const trackerService = new TrackerService();