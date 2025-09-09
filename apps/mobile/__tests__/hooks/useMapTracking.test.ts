import { renderHook, act } from '@testing-library/react-hooks';
import { useMapTracking } from '../../src/hooks/useMapTracking';
import { BusLocation } from '@cvr-bus-tracker/shared-types';
import { mapService } from '../../src/services/mapService';

// Mock the mapService
jest.mock('../../src/services/mapService', () => ({
  mapService: {
    getMapRegion: jest.fn(),
    isLocationAccurate: jest.fn(),
    debounce: jest.fn(),
  },
}));

const mockedMapService = mapService as jest.Mocked<typeof mapService>;

describe('useMapTracking', () => {
  const mockBusLocation: BusLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 10,
    timestamp: new Date('2023-01-01T12:00:00Z'),
  };

  const mockMapRegion = {
    latitude: 17.3850,
    longitude: 78.4867,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedMapService.getMapRegion.mockReturnValue(mockMapRegion);
    mockedMapService.isLocationAccurate.mockReturnValue(true);
    
    // Mock debounce to return the original function for immediate execution in tests
    mockedMapService.debounce.mockImplementation((fn: any) => fn);
  });

  it('should initialize with null map region when no initial location', () => {
    const { result } = renderHook(() => useMapTracking({}));

    expect(result.current.mapRegion).toBeNull();
    expect(result.current.isRegionStale).toBe(false);
  });

  it('should initialize with map region when initial location provided', () => {
    const { result } = renderHook(() => 
      useMapTracking({ initialLocation: mockBusLocation })
    );

    expect(mockedMapService.getMapRegion).toHaveBeenCalledWith(mockBusLocation, 'medium');
    expect(result.current.mapRegion).toEqual(mockMapRegion);
  });

  it('should use custom zoom level', () => {
    renderHook(() => 
      useMapTracking({ 
        initialLocation: mockBusLocation, 
        zoomLevel: 'close' 
      })
    );

    expect(mockedMapService.getMapRegion).toHaveBeenCalledWith(mockBusLocation, 'close');
  });

  it('should update map region for accurate locations', () => {
    const { result } = renderHook(() => useMapTracking({}));

    act(() => {
      result.current.updateMapRegion(mockBusLocation);
    });

    expect(mockedMapService.isLocationAccurate).toHaveBeenCalledWith(mockBusLocation, 100);
    expect(mockedMapService.getMapRegion).toHaveBeenCalledWith(mockBusLocation, 'medium');
  });

  it('should not update map region for inaccurate locations', () => {
    mockedMapService.isLocationAccurate.mockReturnValue(false);
    
    const { result } = renderHook(() => useMapTracking({}));

    act(() => {
      result.current.updateMapRegion(mockBusLocation);
    });

    expect(mockedMapService.isLocationAccurate).toHaveBeenCalledWith(mockBusLocation, 100);
    expect(mockedMapService.getMapRegion).not.toHaveBeenCalled();
  });

  it('should center on location immediately', () => {
    const { result } = renderHook(() => useMapTracking({}));

    act(() => {
      result.current.centerOnLocation(mockBusLocation);
    });

    expect(mockedMapService.getMapRegion).toHaveBeenCalledWith(mockBusLocation, 'medium');
    expect(result.current.mapRegion).toEqual(mockMapRegion);
    expect(result.current.isRegionStale).toBe(false);
  });

  it('should have isRegionStale initially false', () => {
    const { result } = renderHook(() => useMapTracking({}));

    expect(result.current.isRegionStale).toBe(false);
  });

  it('should reset region staleness', () => {
    const { result } = renderHook(() => useMapTracking({}));

    act(() => {
      result.current.resetRegionStaleness();
    });

    expect(result.current.isRegionStale).toBe(false);
  });

  it('should use debounced updates', () => {
    const mockDebouncedFn = jest.fn();
    mockedMapService.debounce.mockReturnValue(mockDebouncedFn);

    const { result } = renderHook(() => useMapTracking({}));

    act(() => {
      result.current.updateMapRegion(mockBusLocation);
    });

    expect(mockedMapService.debounce).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it('should handle multiple rapid location updates', () => {
    const { result } = renderHook(() => useMapTracking({}));

    const location1 = { ...mockBusLocation, latitude: 17.3851 };
    const location2 = { ...mockBusLocation, latitude: 17.3852 };
    const location3 = { ...mockBusLocation, latitude: 17.3853 };

    act(() => {
      result.current.updateMapRegion(location1);
      result.current.updateMapRegion(location2);
      result.current.updateMapRegion(location3);
    });

    // Should have been called for each location
    expect(mockedMapService.isLocationAccurate).toHaveBeenCalledTimes(3);
  });
});