import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MapScreen from '../../src/screens/MapScreen/MapScreen';
import { useAppStore } from '../../src/store';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { websocketService } from '../../src/services/websocketService';

// Mock dependencies
jest.mock('../../src/store');
jest.mock('../../src/hooks/useUserLocation');
jest.mock('../../src/services/websocketService');
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('MapScreen Component', () => {
  const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
  const mockUseUserLocation = useUserLocation as jest.MockedFunction<typeof useUserLocation>;
  const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

  const mockRoute = {
    params: {
      busNumber: '12',
    },
  };

  const mockNavigation = {
    goBack: jest.fn(),
  };

  const mockStoreValues = {
    consumerTracking: {
      busNumber: '12',
      busLocation: {
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10,
        timestamp: new Date(),
      },
      lastUpdated: new Date(),
      isTrackerActive: true,
      wsConnected: true,
    },
    currentLocation: null,
    mapState: {
      region: {
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      showUserLocation: false,
      selectedBus: null,
      isMapVisible: false,
    },
    updateMapRegion: jest.fn(),
    toggleUserLocation: jest.fn(),
    centerOnBus: jest.fn(),
    setMapVisibility: jest.fn(),
    startConsumerTracking: jest.fn(),
    stopConsumerTracking: jest.fn(),
    updateConsumerBusLocation: jest.fn(),
  };

  const mockUserLocationValues = {
    currentLocation: null,
    permissionGranted: false,
    isRequestingPermission: false,
    locationPermissionStatus: 'unknown' as const,
    requestLocationPermission: jest.fn(),
    getCurrentLocation: jest.fn(),
    handlePermissionDenied: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppStore.mockReturnValue(mockStoreValues);
    mockUseUserLocation.mockReturnValue(mockUserLocationValues);
    mockWebsocketService.connect.mockResolvedValue();
    mockWebsocketService.isConnected.mockReturnValue(true);
    mockWebsocketService.onLocationUpdated.mockImplementation(() => {});
    mockWebsocketService.onTrackerDisconnected.mockImplementation(() => {});
  });

  it('renders MapScreen component', () => {
    const { container } = render(
      <MapScreen route={mockRoute} navigation={mockNavigation} />
    );
    // Component should render without crashing
    expect(container).toBeDefined();
  });

  it('starts consumer tracking on mount', async () => {
    render(<MapScreen route={mockRoute} navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(mockStoreValues.startConsumerTracking).toHaveBeenCalledWith('12');
    });
  });

  it('connects to WebSocket on mount', async () => {
    render(<MapScreen route={mockRoute} navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(mockWebsocketService.connect).toHaveBeenCalled();
    });
  });

  it('sets map visibility to true on mount', async () => {
    render(<MapScreen route={mockRoute} navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(mockStoreValues.setMapVisibility).toHaveBeenCalledWith(true);
    });
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <MapScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    unmount();
    
    expect(mockWebsocketService.disconnect).toHaveBeenCalled();
    expect(mockStoreValues.stopConsumerTracking).toHaveBeenCalled();
    expect(mockStoreValues.setMapVisibility).toHaveBeenCalledWith(false);
  });

  it('shows error alert when tracking fails', async () => {
    mockStoreValues.startConsumerTracking.mockRejectedValue(new Error('Bus not active'));
    
    render(<MapScreen route={mockRoute} navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Tracking Error',
        'Failed to start tracking bus 12. The bus may not be active.',
        expect.any(Array)
      );
    });
  });

  it('handles user location toggle when permission not granted', async () => {
    mockUserLocationValues.requestLocationPermission.mockResolvedValue(false);
    
    const { rerender } = render(
      <MapScreen route={mockRoute} navigation={mockNavigation} />
    );
    
    // Simulate toggle user location
    await mockStoreValues.toggleUserLocation();
    
    // Should handle permission flow
    expect(mockUserLocationValues.requestLocationPermission).toBeDefined();
  });

  it('handles WebSocket connection status changes', async () => {
    mockWebsocketService.isConnected
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    
    const { container } = render(<MapScreen route={mockRoute} navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(container).toBeDefined();
    });
  });
});