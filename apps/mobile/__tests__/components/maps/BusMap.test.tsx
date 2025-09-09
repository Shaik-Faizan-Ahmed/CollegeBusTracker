import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BusMap } from '../../../src/components/maps/BusMap';
import { BusLocation, Location } from '@cvr-bus-tracker/shared-types';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      // Mock the ref methods
      React.useImperativeHandle(ref, () => ({
        animateToRegion: jest.fn(),
      }));
      return <View testID="mapview" {...props} />;
    }),
    Marker: ({ children, ...props }: any) => (
      <View testID="marker" {...props}>{children}</View>
    ),
    Circle: (props: any) => <View testID="circle" {...props} />,
  };
});

// Mock MapService
jest.mock('../../../src/services/mapService', () => ({
  MapService: {
    calculateRegionForBus: jest.fn(() => ({
      latitude: 17.3850,
      longitude: 78.4867,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })),
    debounce: jest.fn((fn) => fn),
  },
}));

describe('BusMap Component', () => {
  const mockBusLocation: BusLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 10,
    timestamp: new Date(),
  };

  const mockUserLocation: Location = {
    latitude: 17.3860,
    longitude: 78.4877,
    accuracy: 5,
    timestamp: Date.now(),
  };

  const defaultProps = {
    busNumber: '12',
    busLocation: mockBusLocation,
    showUserLocation: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders MapView component', () => {
    const { getByTestId } = render(<BusMap {...defaultProps} />);
    expect(getByTestId('mapview')).toBeTruthy();
  });

  it('renders bus location marker when bus location is provided', () => {
    const { getAllByTestId } = render(<BusMap {...defaultProps} />);
    const markers = getAllByTestId('marker');
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render bus marker when no bus location is provided', () => {
    const { queryAllByTestId } = render(
      <BusMap {...defaultProps} busLocation={undefined} />
    );
    const markers = queryAllByTestId('marker');
    // Should only have user location marker if enabled
    expect(markers.length).toBe(0);
  });

  it('renders user location marker when showUserLocation is true and location provided', () => {
    const { getAllByTestId } = render(
      <BusMap 
        {...defaultProps} 
        showUserLocation={true} 
        userLocation={mockUserLocation} 
      />
    );
    const markers = getAllByTestId('marker');
    expect(markers.length).toBe(2); // Bus marker + User marker
  });

  it('does not render user location marker when showUserLocation is false', () => {
    const { getAllByTestId } = render(
      <BusMap 
        {...defaultProps} 
        showUserLocation={false} 
        userLocation={mockUserLocation} 
      />
    );
    const markers = getAllByTestId('marker');
    expect(markers.length).toBe(1); // Only bus marker
  });

  it('calls onMapReady callback when map is ready', () => {
    const onMapReady = jest.fn();
    const { getByTestId } = render(
      <BusMap {...defaultProps} onMapReady={onMapReady} />
    );
    
    const mapView = getByTestId('mapview');
    fireEvent(mapView, 'onMapReady');
    expect(onMapReady).toHaveBeenCalledTimes(1);
  });

  it('calls onRegionChange callback when region changes', () => {
    const onRegionChange = jest.fn();
    const { getByTestId } = render(
      <BusMap {...defaultProps} onRegionChange={onRegionChange} />
    );
    
    const mapView = getByTestId('mapview');
    const newRegion = {
      latitude: 17.3900,
      longitude: 78.4900,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    fireEvent(mapView, 'onRegionChangeComplete', newRegion);
    expect(onRegionChange).toHaveBeenCalledWith(newRegion);
  });

  it('handles map errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const { getByTestId } = render(<BusMap {...defaultProps} />);
    
    const mapView = getByTestId('mapview');
    fireEvent(mapView, 'onError', { message: 'Map error' });
    
    expect(consoleSpy).toHaveBeenCalledWith('Map error:', { message: 'Map error' });
    consoleSpy.mockRestore();
  });

  it('applies performance configuration correctly', () => {
    const { getByTestId } = render(<BusMap {...defaultProps} />);
    const mapView = getByTestId('mapview');
    
    expect(mapView.props).toMatchObject({
      showsUserLocation: false,
      showsMyLocationButton: false,
      showsCompass: true,
      showsScale: true,
      rotateEnabled: false,
      pitchEnabled: false,
      mapType: 'standard',
    });
  });
});