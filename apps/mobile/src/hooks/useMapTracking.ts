import { useState, useCallback, useRef } from 'react';
import { Region } from 'react-native-maps';
import { BusLocation } from '@cvr-bus-tracker/shared-types';
import { mapService } from '../services/mapService';

interface UseMapTrackingProps {
  initialLocation?: BusLocation;
  zoomLevel?: 'close' | 'medium' | 'far';
}

interface UseMapTrackingReturn {
  mapRegion: Region | null;
  updateMapRegion: (location: BusLocation) => void;
  centerOnLocation: (location: BusLocation) => void;
  isRegionStale: boolean;
  resetRegionStaleness: () => void;
}

export const useMapTracking = ({
  initialLocation,
  zoomLevel = 'medium'
}: UseMapTrackingProps): UseMapTrackingReturn => {
  const [mapRegion, setMapRegion] = useState<Region | null>(
    initialLocation ? mapService.getMapRegion(initialLocation, zoomLevel) : null
  );
  const [isRegionStale, setIsRegionStale] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  const debouncedUpdate = mapService.debounce((location: BusLocation) => {
    const newRegion = mapService.getMapRegion(location, zoomLevel);
    setMapRegion(newRegion);
    setIsRegionStale(false);
    lastUpdateRef.current = Date.now();
  }, 1000);

  const updateMapRegion = useCallback((location: BusLocation) => {
    // Only update if location is accurate enough
    if (!mapService.isLocationAccurate(location, 100)) {
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Mark region as stale if it's been a while since last update
    if (timeSinceLastUpdate > 30000) { // 30 seconds
      setIsRegionStale(true);
    }

    debouncedUpdate(location);
  }, [debouncedUpdate, zoomLevel]);

  const centerOnLocation = useCallback((location: BusLocation) => {
    const newRegion = mapService.getMapRegion(location, zoomLevel);
    setMapRegion(newRegion);
    setIsRegionStale(false);
    lastUpdateRef.current = Date.now();
  }, [zoomLevel]);

  const resetRegionStaleness = useCallback(() => {
    setIsRegionStale(false);
    lastUpdateRef.current = Date.now();
  }, []);

  return {
    mapRegion,
    updateMapRegion,
    centerOnLocation,
    isRegionStale,
    resetRegionStaleness,
  };
};