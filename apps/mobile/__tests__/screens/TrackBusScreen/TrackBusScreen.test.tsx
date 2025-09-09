import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { TrackBusScreen } from '../../../src/screens/TrackBusScreen/TrackBusScreen';
import { useAppStore } from '../../../src/store/appStore';
import { useConsumerWebSocket } from '../../../src/hooks/useConsumerWebSocket';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../../src/store/appStore');
jest.mock('../../../src/hooks/useConsumerWebSocket');
jest.mock('../../../src/services/mapService');
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, testID, ...props }: any) => (
      <View testID={testID || 'MapView'} {...props}>
        {children}
      </View>
    ),
    Marker: ({ children, testID, ...props }: any) => (
      <View testID={testID || 'Marker'} {...props}>
        {children}
      </View>
    ),
    Callout: ({ children, testID, ...props }: any) => (
      <View testID={testID || 'Callout'} {...props}>
        {children}
      </View>
    ),
    PROVIDER_GOOGLE: 'google',
  };
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: { busNumber: '12' },
};

const mockedUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
const mockedUseConsumerWebSocket = useConsumerWebSocket as jest.MockedFunction<
  typeof useConsumerWebSocket
>;

const mockStoreState = {
  consumerTracking: null,
  locationLoadingState: 'idle' as const,
  locationError: null,
  currentLocation: null,
  startConsumerTracking: jest.fn(),
  stopConsumerTracking: jest.fn(),
  updateConsumerBusLocation: jest.fn(),
};

const mockWebSocketHooks = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: false,
};

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('TrackBusScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppStore.mockReturnValue(mockStoreState);
    mockedUseConsumerWebSocket.mockReturnValue(mockWebSocketHooks);
  });

  it('should render correctly', () => {
    const storeWithTracking = {
      ...mockStoreState,
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
    };
    mockedUseAppStore.mockReturnValue(storeWithTracking);

    const component = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    // Should render without errors
    expect(component).toBeTruthy();
  });

  it('should initialize tracking on mount', async () => {
    render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    await waitFor(() => {
      expect(mockStoreState.startConsumerTracking).toHaveBeenCalledWith('12');
    });

    expect(mockWebSocketHooks.connect).toHaveBeenCalledWith('12');
  });

  it('should navigate back if no bus number provided', () => {
    const routeWithoutBus = { params: {} };

    render(
      <TrackBusScreen 
        route={routeWithoutBus as any} 
        navigation={mockNavigation as any} 
      />
    );

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should show no tracker message when no active tracker', () => {
    const storeWithError = {
      ...mockStoreState,
      locationError: 'No active tracker found for bus 12',
    };
    mockedUseAppStore.mockReturnValue(storeWithError);

    const { getByText } = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    expect(getByText('No Active Tracker')).toBeTruthy();
    expect(getByText("Bus 12 doesn't have an active tracker right now.")).toBeTruthy();
  });

  it('should display bus location marker when tracking is active', () => {
    const storeWithTracking = {
      ...mockStoreState,
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
    };
    mockedUseAppStore.mockReturnValue(storeWithTracking);

    render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    // Bus marker should be rendered
    expect(mockedUseConsumerWebSocket).toHaveBeenCalledWith({
      onLocationUpdate: expect.any(Function),
      onTrackerDisconnected: expect.any(Function),
      onConnectionChange: expect.any(Function),
    });
  });

  it('should display user location marker when available', () => {
    const storeWithUserLocation = {
      ...mockStoreState,
      currentLocation: {
        latitude: 17.3900,
        longitude: 78.4900,
        accuracy: 5,
        timestamp: Date.now(),
      },
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
    };
    mockedUseAppStore.mockReturnValue(storeWithUserLocation);

    render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    // Both markers should be present
    expect(mockedUseConsumerWebSocket).toHaveBeenCalledWith(
      expect.objectContaining({
        onLocationUpdate: expect.any(Function),
      })
    );
  });

  it('should handle location updates via WebSocket', () => {
    const mockLocationUpdate = {
      busNumber: '12',
      latitude: 17.3860,
      longitude: 78.4870,
      accuracy: 8,
      timestamp: Date.now(),
      sessionId: 'test-session',
    };

    render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    // Get the onLocationUpdate callback
    const callbacks = mockedUseConsumerWebSocket.mock.calls[0][0];
    
    act(() => {
      callbacks.onLocationUpdate(mockLocationUpdate);
    });

    expect(mockStoreState.updateConsumerBusLocation).toHaveBeenCalledWith(
      mockLocationUpdate
    );
  });

  it('should handle tracker disconnection', () => {
    render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    // Get the onTrackerDisconnected callback
    const callbacks = mockedUseConsumerWebSocket.mock.calls[0][0];
    
    act(() => {
      callbacks.onTrackerDisconnected({
        busNumber: '12',
        reason: 'session_ended',
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Tracker Disconnected',
      'Bus 12 tracker has disconnected. Location updates will stop.',
      expect.any(Array)
    );
  });

  it('should handle refresh action in no tracker message', () => {
    const storeWithError = {
      ...mockStoreState,
      locationError: 'No active tracker found for bus 12',
    };
    mockedUseAppStore.mockReturnValue(storeWithError);

    const { getByText } = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    const refreshButton = getByText('Check Again');
    
    act(() => {
      fireEvent.press(refreshButton);
    });

    // Should attempt to restart tracking
    expect(mockStoreState.startConsumerTracking).toHaveBeenCalledWith('12');
  });

  it('should handle try different bus action', () => {
    const storeWithError = {
      ...mockStoreState,
      locationError: 'No active tracker found for bus 12',
    };
    mockedUseAppStore.mockReturnValue(storeWithError);

    const { getByText } = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    const tryDifferentBusButton = getByText('Try Different Bus');
    
    act(() => {
      fireEvent.press(tryDifferentBusButton);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('BusSelector', { mode: 'track' });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );

    unmount();

    expect(mockWebSocketHooks.disconnect).toHaveBeenCalled();
    expect(mockStoreState.stopConsumerTracking).toHaveBeenCalled();
  });

  it('should handle map press events', () => {
    const storeWithTracking = {
      ...mockStoreState,
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
    };
    mockedUseAppStore.mockReturnValue(storeWithTracking);

    const component = render(
      <TrackBusScreen 
        route={mockRoute as any} 
        navigation={mockNavigation as any} 
      />
    );
    
    // Should render without errors
    expect(component).toBeTruthy();
  });
});