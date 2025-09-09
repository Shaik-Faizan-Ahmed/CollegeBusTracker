import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { BusSession, TrackingSession, Location } from '@cvr-bus-tracker/shared-types';

const STORAGE_KEYS = {
  TRACKING_SESSION: 'cvr_bus_tracker_session',
  SESSION_ID: 'cvr_bus_tracker_session_id',
};

export interface StartTrackerRequest {
  busNumber: string;
  latitude: number;
  longitude: number;
}

export interface StartTrackerResponse {
  sessionId: string;
  busNumber: string;
  trackerId: string;
}

export interface StopTrackerResponse {
  message: string;
  busNumber: string;
}

export interface TrackerConflictError {
  code: 'BUS_ALREADY_TRACKED';
  message: string;
  existingTracker: {
    busNumber: string;
    lastUpdated: Date;
    trackerId: string;
  };
}

export class TrackerService {
  private currentSession: TrackingSession | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadStoredSession();
  }

  /**
   * Start a new tracking session
   */
  async startTracking(
    busNumber: string,
    location: Location
  ): Promise<StartTrackerResponse> {
    try {
      const request: StartTrackerRequest = {
        busNumber,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const response = await apiClient.post<StartTrackerResponse>(
        '/tracker/start',
        request
      );

      // Create and store tracking session
      const session: TrackingSession = {
        sessionId: response.sessionId,
        busNumber: response.busNumber,
        trackerId: response.trackerId,
        startedAt: new Date(),
        isActive: true,
      };

      await this.storeSession(session);
      this.currentSession = session;

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already has an active tracker')) {
        // This is a conflict error (409)
        throw new Error('BUS_ALREADY_TRACKED');
      }
      throw error;
    }
  }

  /**
   * Stop the current tracking session
   */
  async stopTracking(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active tracking session');
    }

    try {
      await apiClient.post<StopTrackerResponse>(
        '/tracker/stop',
        {},
        {
          'x-session-id': this.currentSession.sessionId,
        }
      );

      // Clear stored session
      await this.clearSession();
      this.currentSession = null;

      // Clear location update interval if running
      if (this.locationUpdateInterval) {
        clearInterval(this.locationUpdateInterval);
        this.locationUpdateInterval = null;
      }
    } catch (error) {
      // Even if API call fails, clear local session
      await this.clearSession();
      this.currentSession = null;
      throw error;
    }
  }

  /**
   * Update tracker location (for manual updates)
   */
  async updateLocation(location: Location): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active tracking session');
    }

    try {
      await apiClient.post(
        '/tracker/update',
        {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
        {
          'x-session-id': this.currentSession.sessionId,
        }
      );
    } catch (error) {
      console.error('Failed to update tracker location:', error);
      throw error;
    }
  }

  /**
   * Get current tracking session
   */
  getCurrentSession(): TrackingSession | null {
    return this.currentSession;
  }

  /**
   * Check if currently tracking
   */
  isTracking(): boolean {
    return this.currentSession?.isActive ?? false;
  }

  /**
   * Get current bus number being tracked
   */
  getCurrentBusNumber(): string | null {
    return this.currentSession?.busNumber ?? null;
  }

  /**
   * Start location update interval (10-15 seconds)
   */
  startLocationUpdates(
    locationProvider: () => Promise<Location>,
    intervalMs: number = 12000 // 12 seconds
  ): void {
    if (!this.currentSession) {
      throw new Error('No active tracking session');
    }

    // Clear existing interval
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    this.locationUpdateInterval = setInterval(async () => {
      try {
        const location = await locationProvider();
        await this.updateLocation(location);
      } catch (error) {
        console.error('Location update failed:', error);
        // Continue trying updates, don't stop the interval
      }
    }, intervalMs);
  }

  /**
   * Stop location updates
   */
  stopLocationUpdates(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  /**
   * Store session in AsyncStorage
   */
  private async storeSession(session: TrackingSession): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TRACKING_SESSION, JSON.stringify(session)],
        [STORAGE_KEYS.SESSION_ID, session.sessionId],
      ]);
    } catch (error) {
      console.error('Failed to store tracking session:', error);
    }
  }

  /**
   * Load session from AsyncStorage
   */
  private async loadStoredSession(): Promise<void> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.TRACKING_SESSION);
      if (sessionData) {
        const session: TrackingSession = JSON.parse(sessionData);
        // Validate session is still active (not expired)
        const now = new Date();
        const sessionAge = now.getTime() - new Date(session.startedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (sessionAge < maxAge && session.isActive) {
          this.currentSession = session;
        } else {
          // Session expired, clear it
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load stored session:', error);
      // Clear corrupted data
      await this.clearSession();
    }
  }

  /**
   * Clear stored session
   */
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRACKING_SESSION,
        STORAGE_KEYS.SESSION_ID,
      ]);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Handle app background/foreground transitions
   */
  handleAppStateChange(newState: string): void {
    if (newState === 'background' && this.isTracking()) {
      // Continue location updates in background
      console.log('App backgrounded, continuing location updates');
    } else if (newState === 'active' && this.isTracking()) {
      // App returned to foreground, ensure updates are still running
      console.log('App foregrounded, verifying location updates');
    }
  }
}

// Singleton instance
export const trackerService = new TrackerService();