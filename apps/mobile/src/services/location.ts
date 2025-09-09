import Geolocation from '@react-native-community/geolocation';
import {Platform} from 'react-native';
import {Location} from '@cvr-bus-tracker/shared-types';

export type LocationError = 
  | 'permission_denied'
  | 'gps_unavailable'
  | 'timeout'
  | 'poor_signal'
  | 'service_disabled'
  | 'unknown';

export interface LocationUpdateOptions {
  interval?: number; // Update interval in milliseconds
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationServiceResult {
  success: boolean;
  location?: Location;
  error?: LocationError;
  message?: string;
}

class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private lastKnownLocation: Location | null = null;
  private updateCallback: ((result: LocationServiceResult) => void) | null = null;

  constructor() {
    // Configure Geolocation
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
      locationProvider: 'auto',
    });
  }

  /**
   * Get current location once
   */
  getCurrentLocation(
    timeout = 30000,
    enableHighAccuracy = true,
  ): Promise<LocationServiceResult> {
    return new Promise((resolve) => {
      const options: Geolocation.GeoOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge: 5000, // Use cached location if less than 5 seconds old
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          this.lastKnownLocation = location;

          // Validate accuracy requirement (20 meters)
          if (location.accuracy <= 20) {
            resolve({
              success: true,
              location,
            });
          } else {
            resolve({
              success: false,
              error: 'poor_signal',
              message: `Location accuracy is ${Math.round(location.accuracy)}m. Need accuracy within 20m for bus tracking.`,
            });
          }
        },
        (error) => {
          resolve(this.handleLocationError(error));
        },
        options,
      );
    });
  }

  /**
   * Start continuous location tracking
   */
  startLocationTracking(
    callback: (result: LocationServiceResult) => void,
    options: LocationUpdateOptions = {},
  ): void {
    if (this.isTracking) {
      callback({
        success: false,
        error: 'unknown',
        message: 'Location tracking is already active',
      });
      return;
    }

    this.updateCallback = callback;
    this.isTracking = true;

    const geoOptions: Geolocation.GeoOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 30000,
      maximumAge: options.maximumAge ?? 5000,
      distanceFilter: Platform.OS === 'android' ? 5 : 10, // Minimum distance in meters
    };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        this.lastKnownLocation = location;

        if (this.updateCallback) {
          // Check accuracy requirement
          if (location.accuracy <= 20) {
            this.updateCallback({
              success: true,
              location,
            });
          } else {
            this.updateCallback({
              success: false,
              error: 'poor_signal',
              location, // Still provide location even if poor accuracy
              message: `GPS accuracy: ${Math.round(location.accuracy)}m (target: ≤20m)`,
            });
          }
        }
      },
      (error) => {
        if (this.updateCallback) {
          this.updateCallback(this.handleLocationError(error));
        }
      },
      geoOptions,
    );
  }

  /**
   * Stop continuous location tracking
   */
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.updateCallback = null;
  }

  /**
   * Check if location tracking is active
   */
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  /**
   * Check if location meets accuracy requirements
   */
  isLocationAccurate(location: Location): boolean {
    return location.accuracy <= 20;
  }

  /**
   * Calculate distance between two locations in meters
   */
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get GPS signal strength based on accuracy
   */
  getSignalStrength(accuracy: number): 'none' | 'weak' | 'good' | 'excellent' {
    if (accuracy === undefined || accuracy === null || accuracy > 50) {
      return 'none';
    }
    if (accuracy > 20) {
      return 'weak';
    }
    if (accuracy > 10) {
      return 'good';
    }
    return 'excellent';
  }

  /**
   * Handle location errors with user-friendly messages
   */
  private handleLocationError(error: Geolocation.GeoError): LocationServiceResult {
    let locationError: LocationError;
    let message: string;

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        locationError = 'permission_denied';
        message = 'Location permission denied. Please grant location access to use bus tracking.';
        break;
      case 2: // POSITION_UNAVAILABLE
        locationError = 'gps_unavailable';
        message = 'GPS signal unavailable. Please ensure GPS is enabled and you have a clear view of the sky.';
        break;
      case 3: // TIMEOUT
        locationError = 'timeout';
        message = 'Location request timed out. Please try again or move to an area with better GPS signal.';
        break;
      default:
        locationError = 'unknown';
        message = 'Failed to get location. Please check your GPS settings and try again.';
        break;
    }

    return {
      success: false,
      error: locationError,
      message,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopLocationTracking();
    this.lastKnownLocation = null;
    this.updateCallback = null;
  }
}

// Export singleton instance
export const locationService = new LocationService();