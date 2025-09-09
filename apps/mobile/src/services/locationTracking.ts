import { Location } from '@cvr-bus-tracker/shared-types';
import { LocationService } from './location';
import { trackerService } from './trackerService';
import { websocketService } from './websocketService';

export interface LocationTrackingOptions {
  updateIntervalMs?: number; // Default 12000 (12 seconds)
  minAccuracyMeters?: number; // Default 50 meters
  maxLocationAge?: number; // Default 30 seconds
}

export class LocationTrackingService {
  private locationService: LocationService;
  private isTracking = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private options: Required<LocationTrackingOptions>;

  constructor(locationService: LocationService) {
    this.locationService = locationService;
    this.options = {
      updateIntervalMs: 12000, // 12 seconds
      minAccuracyMeters: 50, // 50 meters accuracy
      maxLocationAge: 30000, // 30 seconds
    };
  }

  /**
   * Start continuous location tracking for active tracker
   */
  async startTracking(options?: LocationTrackingOptions): Promise<void> {
    if (this.isTracking) {
      console.warn('Location tracking already active');
      return;
    }

    // Merge options with defaults
    this.options = { ...this.options, ...options };

    // Verify we have an active tracking session
    if (!trackerService.isTracking()) {
      throw new Error('No active tracking session');
    }

    // Verify location permissions
    const hasPermission = await this.locationService.checkLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    // Start location updates
    this.isTracking = true;
    await this.startLocationUpdates();
    
    console.log('Location tracking started with options:', this.options);
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Location tracking stopped');
  }

  /**
   * Check if location tracking is active
   */
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get current location with validation
   */
  async getCurrentLocation(): Promise<Location> {
    const position = await this.locationService.getCurrentPosition();
    
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy || 999,
      timestamp: position.timestamp || Date.now(),
    };

    // Validate location quality
    if (location.accuracy > this.options.minAccuracyMeters) {
      console.warn(`Location accuracy ${location.accuracy}m exceeds threshold ${this.options.minAccuracyMeters}m`);
    }

    // Check if location is fresh
    const locationAge = Date.now() - location.timestamp;
    if (locationAge > this.options.maxLocationAge) {
      console.warn(`Location is ${locationAge}ms old, exceeds max age ${this.options.maxLocationAge}ms`);
    }

    return location;
  }

  /**
   * Start the location update interval
   */
  private async startLocationUpdates(): Promise<void> {
    // Get initial location immediately
    try {
      await this.updateLocationNow();
    } catch (error) {
      console.error('Initial location update failed:', error);
    }

    // Start periodic updates
    this.updateInterval = setInterval(async () => {
      if (!this.isTracking) {
        return;
      }

      try {
        await this.updateLocationNow();
      } catch (error) {
        console.error('Location update failed:', error);
        // Don't stop tracking on individual failures
      }
    }, this.options.updateIntervalMs);
  }

  /**
   * Update location immediately
   */
  private async updateLocationNow(): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      const session = trackerService.getCurrentSession();
      
      if (!session) {
        throw new Error('No active tracking session');
      }

      // Update via tracker service API
      await trackerService.updateLocation(location);

      // Emit via WebSocket for real-time updates
      if (websocketService.isConnected()) {
        websocketService.emitLocationUpdate({
          busNumber: session.busNumber,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          sessionId: session.sessionId,
        });
      }

      console.log(`Location updated: ${location.latitude}, ${location.longitude} (±${location.accuracy}m)`);
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  }

  /**
   * Handle app state changes
   */
  handleAppStateChange(newState: string): void {
    if (newState === 'background' && this.isTracking) {
      console.log('App backgrounded, continuing location tracking');
      // Continue tracking in background
    } else if (newState === 'active' && this.isTracking) {
      console.log('App foregrounded, location tracking active');
      // Ensure tracking is still running
      if (!this.updateInterval) {
        this.startLocationUpdates();
      }
    } else if (newState === 'inactive' && this.isTracking) {
      console.log('App inactive, maintaining location tracking');
      // Keep tracking during brief inactive states
    }
  }

  /**
   * Handle GPS signal loss and recovery
   */
  private handleLocationError(error: any): void {
    console.error('Location tracking error:', error);

    if (error.code === 1) { // PERMISSION_DENIED
      console.error('Location permission denied');
      this.stopTracking();
    } else if (error.code === 2) { // POSITION_UNAVAILABLE
      console.warn('GPS signal unavailable, continuing to retry');
      // Continue trying, don't stop tracking
    } else if (error.code === 3) { // TIMEOUT
      console.warn('Location timeout, continuing to retry');
      // Continue trying, don't stop tracking
    }
  }

  /**
   * Update tracking options
   */
  updateOptions(newOptions: LocationTrackingOptions): void {
    this.options = { ...this.options, ...newOptions };
    
    if (this.isTracking) {
      // Restart with new options
      this.stopTracking();
      this.startTracking();
    }
  }

  /**
   * Get current tracking options
   */
  getOptions(): Required<LocationTrackingOptions> {
    return { ...this.options };
  }
}

// Factory function to create service with location service dependency
export function createLocationTrackingService(): LocationTrackingService {
  const locationService = new LocationService();
  return new LocationTrackingService(locationService);
}

// Default instance
export const locationTrackingService = createLocationTrackingService();