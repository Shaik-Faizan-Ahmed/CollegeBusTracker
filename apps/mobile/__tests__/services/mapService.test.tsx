import { MapService } from '../../src/services/mapService';
import { BusLocation } from '@cvr-bus-tracker/shared-types';

describe('MapService', () => {
  const mockBusLocation: BusLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 10,
    timestamp: new Date(),
  };

  describe('calculateRegionForBus', () => {
    it('calculates correct region for single bus location', () => {
      const region = MapService.calculateRegionForBus(mockBusLocation);
      
      expect(region).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });
  });

  describe('calculateRegionForMultipleBuses', () => {
    it('returns campus region when no buses provided', () => {
      const region = MapService.calculateRegionForMultipleBuses([]);
      
      expect(region).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });

    it('returns single bus region when one bus provided', () => {
      const region = MapService.calculateRegionForMultipleBuses([mockBusLocation]);
      
      expect(region).toEqual({
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });

    it('calculates correct region for multiple buses', () => {
      const buses: BusLocation[] = [
        { latitude: 17.3800, longitude: 78.4800, accuracy: 10, timestamp: new Date() },
        { latitude: 17.3900, longitude: 78.4900, accuracy: 10, timestamp: new Date() },
      ];
      
      const region = MapService.calculateRegionForMultipleBuses(buses);
      
      expect(region.latitude).toBeCloseTo(17.385, 5); // Center lat
      expect(region.longitude).toBeCloseTo(78.485, 5); // Center lng
      expect(region.latitudeDelta).toBeGreaterThan(0.01); // Should have padding
      expect(region.longitudeDelta).toBeGreaterThan(0.01); // Should have padding
    });

    it('ensures minimum delta values', () => {
      const closeBuses: BusLocation[] = [
        { latitude: 17.3850, longitude: 78.4867, accuracy: 10, timestamp: new Date() },
        { latitude: 17.3851, longitude: 78.4868, accuracy: 10, timestamp: new Date() },
      ];
      
      const region = MapService.calculateRegionForMultipleBuses(closeBuses);
      
      expect(region.latitudeDelta).toBe(0.01); // Minimum delta
      expect(region.longitudeDelta).toBe(0.01); // Minimum delta
    });
  });

  describe('areRegionsSignificantlyDifferent', () => {
    const region1 = {
      latitude: 17.3850,
      longitude: 78.4867,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    it('returns false for identical regions', () => {
      const result = MapService.areRegionsSignificantlyDifferent(region1, region1);
      expect(result).toBe(false);
    });

    it('returns false for regions with small differences', () => {
      const region2 = {
        ...region1,
        latitude: region1.latitude + 0.0001,
      };
      
      const result = MapService.areRegionsSignificantlyDifferent(region1, region2);
      expect(result).toBe(false);
    });

    it('returns true for regions with significant differences', () => {
      const region2 = {
        ...region1,
        latitude: region1.latitude + 0.01,
      };
      
      const result = MapService.areRegionsSignificantlyDifferent(region1, region2);
      expect(result).toBe(true);
    });

    it('uses custom threshold correctly', () => {
      const region2 = {
        ...region1,
        latitude: region1.latitude + 0.0001,
      };
      
      const result = MapService.areRegionsSignificantlyDifferent(
        region1, 
        region2, 
        0.00005
      );
      expect(result).toBe(true);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('debounces function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = MapService.debounce(mockFn, 100);
      
      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.runAllTimers();
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = MapService.debounce(mockFn, 100);
      
      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });
});