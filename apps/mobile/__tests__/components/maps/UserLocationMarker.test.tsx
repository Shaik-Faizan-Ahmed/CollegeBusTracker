import React from 'react';
import { render } from '@testing-library/react-native';
import UserLocationMarker from '../../../src/components/maps/BusMap/UserLocationMarker';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    Marker: ({ children, ...props }: any) => (
      <View testID="marker" {...props}>{children}</View>
    ),
    Circle: (props: any) => <View testID="circle" {...props} />,
  };
});

describe('UserLocationMarker Component', () => {
  const defaultProps = {
    coordinate: {
      latitude: 17.3850,
      longitude: 78.4867,
    },
    accuracy: 10,
    showAccuracyCircle: true,
  };

  it('renders user location marker', () => {
    const { getByTestId } = render(
      <UserLocationMarker {...defaultProps} />
    );
    
    expect(getByTestId('marker')).toBeTruthy();
  });

  it('renders accuracy circle when showAccuracyCircle is true and accuracy provided', () => {
    const { getByTestId } = render(
      <UserLocationMarker {...defaultProps} />
    );
    
    expect(getByTestId('circle')).toBeTruthy();
  });

  it('does not render accuracy circle when showAccuracyCircle is false', () => {
    const { queryByTestId } = render(
      <UserLocationMarker {...defaultProps} showAccuracyCircle={false} />
    );
    
    expect(queryByTestId('circle')).toBeNull();
  });

  it('does not render accuracy circle when no accuracy provided', () => {
    const { queryByTestId } = render(
      <UserLocationMarker 
        {...defaultProps} 
        accuracy={undefined}
        showAccuracyCircle={true}
      />
    );
    
    expect(queryByTestId('circle')).toBeNull();
  });

  it('renders marker without accuracy circle by default', () => {
    const propsWithoutAccuracy = {
      coordinate: {
        latitude: 17.3850,
        longitude: 78.4867,
      },
    };
    
    const { getByTestId, queryByTestId } = render(
      <UserLocationMarker {...propsWithoutAccuracy} />
    );
    
    expect(getByTestId('marker')).toBeTruthy();
    expect(queryByTestId('circle')).toBeNull();
  });
});