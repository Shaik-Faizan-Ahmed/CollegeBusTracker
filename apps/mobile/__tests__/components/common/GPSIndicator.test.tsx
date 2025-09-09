import React from 'react';
import {render, screen} from '@testing-library/react-native';
import {GPSIndicator} from '../../../src/components/common/GPSIndicator';

describe('GPSIndicator', () => {
  it('should render excellent GPS signal', () => {
    render(<GPSIndicator signalStrength="excellent" accuracy={5} />);

    expect(screen.getByText('Excellent GPS')).toBeTruthy();
    expect(screen.getByText('±5m')).toBeTruthy();
  });

  it('should render good GPS signal', () => {
    render(<GPSIndicator signalStrength="good" accuracy={12} />);

    expect(screen.getByText('Good GPS')).toBeTruthy();
    expect(screen.getByText('±12m')).toBeTruthy();
  });

  it('should render weak GPS signal', () => {
    render(<GPSIndicator signalStrength="weak" accuracy={25} />);

    expect(screen.getByText('Weak GPS')).toBeTruthy();
    expect(screen.getByText('±25m')).toBeTruthy();
  });

  it('should render no GPS signal', () => {
    render(<GPSIndicator signalStrength="none" accuracy={null} />);

    expect(screen.getByText('No GPS Signal')).toBeTruthy();
    expect(screen.queryByText('±')).toBeFalsy();
  });

  it('should hide label when showLabel is false', () => {
    render(
      <GPSIndicator signalStrength="excellent" accuracy={5} showLabel={false} />
    );

    expect(screen.queryByText('Excellent GPS')).toBeFalsy();
    expect(screen.queryByText('±5m')).toBeFalsy();
  });

  it('should show label by default', () => {
    render(<GPSIndicator signalStrength="excellent" accuracy={5} />);

    expect(screen.getByText('Excellent GPS')).toBeTruthy();
  });

  it('should handle null accuracy', () => {
    render(<GPSIndicator signalStrength="good" accuracy={null} />);

    expect(screen.getByText('Good GPS')).toBeTruthy();
    expect(screen.queryByText('±')).toBeFalsy();
  });

  it('should round accuracy to nearest integer', () => {
    render(<GPSIndicator signalStrength="good" accuracy={12.7} />);

    expect(screen.getByText('±13m')).toBeTruthy();
  });

  // Test signal strength visual representation (bars)
  it('should render 4 bars for excellent signal', () => {
    const {root} = render(<GPSIndicator signalStrength="excellent" accuracy={5} />);
    
    // Find all bar elements (they should have specific styling)
    const bars = root.findAllByType('View').filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style.some((style: any) => style && style.width === 6)
    );
    
    expect(bars).toHaveLength(4);
  });

  it('should render bars for other signal strengths', () => {
    const {root} = render(<GPSIndicator signalStrength="weak" accuracy={25} />);
    
    const bars = root.findAllByType('View').filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style.some((style: any) => style && style.width === 6)
    );
    
    expect(bars).toHaveLength(4); // Always 4 bars, but different colors
  });
});