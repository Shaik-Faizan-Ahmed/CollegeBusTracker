import React from 'react';
import { render } from '@testing-library/react-native';
import BusLocationMarker from '../../../src/components/maps/BusMap/BusLocationMarker';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    Marker: ({ children, ...props }: any) => (
      <View testID="marker" {...props}>{children}</View>
    ),
  };
});

describe('BusLocationMarker Component', () => {
  const defaultProps = {
    coordinate: {
      latitude: 17.3850,
      longitude: 78.4867,
    },
    busNumber: '12',
    isActive: true,
    lastUpdated: new Date(),
  };

  it('renders marker with bus number', () => {
    const { getByTestId, getByText } = render(
      <BusLocationMarker {...defaultProps} />
    );
    
    expect(getByTestId('marker')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('displays stale indicator when location is old', () => {
    const oldDate = new Date(Date.now() - 120000); // 2 minutes ago
    const { getByText } = render(
      <BusLocationMarker {...defaultProps} lastUpdated={oldDate} />
    );
    
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('does not display stale indicator for recent locations', () => {
    const recentDate = new Date(Date.now() - 30000); // 30 seconds ago
    const { queryByText } = render(
      <BusLocationMarker {...defaultProps} lastUpdated={recentDate} />
    );
    
    expect(queryByText('⚠️')).toBeNull();
  });

  it('applies correct styling for active marker', () => {
    const { getByTestId } = render(
      <BusLocationMarker {...defaultProps} isActive={true} />
    );
    
    const marker = getByTestId('marker');
    expect(marker).toBeTruthy();
  });

  it('applies correct styling for inactive marker', () => {
    const { getByTestId } = render(
      <BusLocationMarker {...defaultProps} isActive={false} />
    );
    
    const marker = getByTestId('marker');
    expect(marker).toBeTruthy();
  });

  it('displays different bus numbers correctly', () => {
    const { getByText, rerender } = render(
      <BusLocationMarker {...defaultProps} busNumber="A1" />
    );
    
    expect(getByText('A1')).toBeTruthy();
    
    rerender(<BusLocationMarker {...defaultProps} busNumber="B5" />);
    expect(getByText('B5')).toBeTruthy();
  });
});