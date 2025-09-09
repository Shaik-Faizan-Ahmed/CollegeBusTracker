import { MapRegion } from '../types/map';
import { BusLocation } from '@cvr-bus-tracker/shared-types';

export class MapService {
  /**
   * Calculate optimal region to display bus location with context
   */
  static calculateRegionForBus(busLocation: BusLocation): MapRegion {
    return {
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      latitudeDelta: 0.01, // ~1km zoom level
      longitudeDelta: 0.01,
    };
  }

  /**
   * Calculate region that includes multiple bus locations
   */
  static calculateRegionForMultipleBuses(busLocations: BusLocation[]): MapRegion {
    if (busLocations.length === 0) {
      // Default to campus region
      return {
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    if (busLocations.length === 1) {
      return this.calculateRegionForBus(busLocations[0]);
    }

    const lats = busLocations.map(loc => loc.latitude);
    const lngs = busLocations.map(loc => loc.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    // Ensure minimum zoom level
    const minDelta = 0.01;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, minDelta),
      longitudeDelta: Math.max(lngDelta, minDelta),
    };
  }

  /**
   * Check if two regions are significantly different (avoid unnecessary updates)
   */
  static areRegionsSignificantlyDifferent(region1: MapRegion, region2: MapRegion, threshold = 0.001): boolean {
    return (
      Math.abs(region1.latitude - region2.latitude) > threshold ||
      Math.abs(region1.longitude - region2.longitude) > threshold ||
      Math.abs(region1.latitudeDelta - region2.latitudeDelta) > threshold ||
      Math.abs(region1.longitudeDelta - region2.longitudeDelta) > threshold
    );
  }

  /**
   * Debounce region changes to prevent excessive updates
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}