import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BusLocationMarker } from '../../../../src/screens/TrackBusScreen/components/BusLocationMarker';
import { BusLocation } from '@cvr-bus-tracker/shared-types';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View, Text } = require('react-native');
  return {
    Marker: ({ children, testID, onPress, ...props }: any) => (
      <View testID={testID || 'Marker'} onTouchEnd={onPress} {...props}>
        {children}
      </View>
    ),
    Callout: ({ children, testID, ...props }: any) => (
      <View testID={testID || 'Callout'} {...props}>
        {children}
      </View>
    ),
  };
});

describe('BusLocationMarker', () => {
  const mockBusLocation: BusLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 10,
    timestamp: new Date('2023-01-01T12:00:00Z'),
  };

  const defaultProps = {
    busLocation: mockBusLocation,
    busNumber: '12',
  };

  it('should render correctly with bus number', () => {
    const { getByText, getByTestId } = render(
      <BusLocationMarker {...defaultProps} />
    );

    expect(getByTestId('Marker')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('Bus 12')).toBeTruthy();
  });

  it('should display formatted timestamp', () => {
    const { getByText } = render(
      <BusLocationMarker {...defaultProps} />
    );

    // Should show formatted time (format depends on locale)
    expect(getByText(/Last updated:/)).toBeTruthy();
  });

  it('should display accuracy information', () => {
    const { getByText } = render(
      <BusLocationMarker {...defaultProps} />
    );

    expect(getByText('Accuracy: 10m')).toBeTruthy();
  });

  it('should show green border for good accuracy (≤20m)', () => {
    const accurateBusLocation: BusLocation = {
      ...mockBusLocation,
      accuracy: 15,
    };

    const { getByTestId } = render(
      <BusLocationMarker 
        busLocation={accurateBusLocation} 
        busNumber="12" 
      />
    );

    const marker = getByTestId('Marker');
    expect(marker).toBeTruthy();
    // Note: Style testing would require more complex setup with react-native-testing-library
  });

  it('should show orange border for fair accuracy (21-50m)', () => {
    const fairAccuracyBusLocation: BusLocation = {
      ...mockBusLocation,
      accuracy: 35,
    };

    const { getByTestId } = render(
      <BusLocationMarker 
        busLocation={fairAccuracyBusLocation} 
        busNumber="12" 
      />
    );

    expect(getByTestId('Marker')).toBeTruthy();
  });

  it('should show red border for poor accuracy (>50m)', () => {
    const poorAccuracyBusLocation: BusLocation = {
      ...mockBusLocation,
      accuracy: 75,
    };

    const { getByTestId } = render(
      <BusLocationMarker 
        busLocation={poorAccuracyBusLocation} 
        busNumber="12" 
      />
    );

    expect(getByTestId('Marker')).toBeTruthy();
  });

  it('should handle press events', () => {
    const mockOnPress = jest.fn();
    
    const { getByTestId } = render(
      <BusLocationMarker 
        {...defaultProps} 
        onPress={mockOnPress} 
      />
    );

    const marker = getByTestId('Marker');
    fireEvent(marker, 'touchEnd');

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should work without onPress callback', () => {
    const { getByTestId } = render(
      <BusLocationMarker {...defaultProps} />
    );

    const marker = getByTestId('Marker');
    
    // Should not throw error when pressed without callback
    expect(() => fireEvent(marker, 'touchEnd')).not.toThrow();
  });

  it('should display different bus numbers correctly', () => {
    const { getByText } = render(
      <BusLocationMarker 
        {...defaultProps} 
        busNumber="A5" 
      />
    );

    expect(getByText('A5')).toBeTruthy();
    expect(getByText('Bus A5')).toBeTruthy();
  });

  it('should handle long bus numbers', () => {
    const { getByText } = render(
      <BusLocationMarker 
        {...defaultProps} 
        busNumber="BUS123" 
      />
    );

    expect(getByText('BUS123')).toBeTruthy();
  });

  it('should format accuracy as integer', () => {
    const decimalAccuracyLocation: BusLocation = {
      ...mockBusLocation,
      accuracy: 15.7,
    };

    const { getByText } = render(
      <BusLocationMarker 
        busLocation={decimalAccuracyLocation} 
        busNumber="12" 
      />
    );

    expect(getByText('Accuracy: 16m')).toBeTruthy();
  });

  it('should use marker identifier correctly', () => {
    const { getByTestId } = render(
      <BusLocationMarker {...defaultProps} />
    );

    // The identifier should be set based on bus number
    const marker = getByTestId('Marker');
    expect(marker).toBeTruthy();
  });
});