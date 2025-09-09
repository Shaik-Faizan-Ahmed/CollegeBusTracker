import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {LocationStatus} from '../../../src/components/common/LocationStatus';

describe('LocationStatus', () => {
  const mockLocation = {
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 10,
    timestamp: Date.now(),
  };

  it('should render location error state', () => {
    render(
      <LocationStatus
        location={null}
        accuracy={null}
        isTracking={false}
        error="GPS signal unavailable"
      />
    );

    expect(screen.getByText('Location Error')).toBeTruthy();
    expect(screen.getByText('GPS signal unavailable')).toBeTruthy();
  });

  it('should render no location state', () => {
    render(
      <LocationStatus
        location={null}
        accuracy={null}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('No Location')).toBeTruthy();
  });

  it('should render location found state', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={10}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('Location Found')).toBeTruthy();
    expect(screen.getByText('±10m')).toBeTruthy();
    expect(screen.getByText('(Good accuracy)')).toBeTruthy();
  });

  it('should render tracking active state', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={10}
        isTracking={true}
        error={null}
      />
    );

    expect(screen.getByText('Tracking Active')).toBeTruthy();
  });

  it('should show coordinates when enabled', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={10}
        isTracking={false}
        error={null}
        showCoordinates={true}
      />
    );

    expect(screen.getByText('Coordinates:')).toBeTruthy();
    expect(screen.getByText('17.385000, 78.486700')).toBeTruthy();
  });

  it('should hide coordinates by default', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={10}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.queryByText('Coordinates:')).toBeFalsy();
  });

  it('should show timestamp', () => {
    const testDate = new Date('2023-09-07T20:30:00.000Z');
    const locationWithTestTime = {
      ...mockLocation,
      timestamp: testDate.getTime(),
    };

    render(
      <LocationStatus
        location={locationWithTestTime}
        accuracy={10}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('Last updated:')).toBeTruthy();
  });

  it('should show excellent accuracy for very precise location', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={3}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('(Excellent accuracy)')).toBeTruthy();
  });

  it('should show fair accuracy for moderate precision', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={18}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('(Fair accuracy)')).toBeTruthy();
  });

  it('should show poor accuracy for imprecise location', () => {
    render(
      <LocationStatus
        location={mockLocation}
        accuracy={35}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('(Poor accuracy)')).toBeTruthy();
  });

  it('should handle unknown accuracy', () => {
    render(
      <LocationStatus
        location={{...mockLocation, accuracy: 0}}
        accuracy={null}
        isTracking={false}
        error={null}
      />
    );

    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.getByText('(Unknown accuracy)')).toBeTruthy();
  });
});