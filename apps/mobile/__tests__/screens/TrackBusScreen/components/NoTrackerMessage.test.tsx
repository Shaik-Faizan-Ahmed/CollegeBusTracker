import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoTrackerMessage } from '../../../../src/screens/TrackBusScreen/components/NoTrackerMessage';

describe('NoTrackerMessage', () => {
  const defaultProps = {
    busNumber: '12',
  };

  it('should render correctly with bus number', () => {
    const { getByText } = render(
      <NoTrackerMessage {...defaultProps} />
    );

    expect(getByText('No Active Tracker')).toBeTruthy();
    expect(getByText("Bus 12 doesn't have an active tracker right now.")).toBeTruthy();
    expect(getByText('The bus might not be running yet, or no one is currently tracking it.')).toBeTruthy();
  });

  it('should display correct bus number in message', () => {
    const { getByText } = render(
      <NoTrackerMessage busNumber="A5" />
    );

    expect(getByText("Bus A5 doesn't have an active tracker right now.")).toBeTruthy();
  });

  it('should render refresh button when onRefresh provided', () => {
    const mockOnRefresh = jest.fn();
    
    const { getByText } = render(
      <NoTrackerMessage 
        {...defaultProps} 
        onRefresh={mockOnRefresh} 
      />
    );

    expect(getByText('Check Again')).toBeTruthy();
  });

  it('should render try different bus button when onTryDifferentBus provided', () => {
    const mockOnTryDifferentBus = jest.fn();
    
    const { getByText } = render(
      <NoTrackerMessage 
        {...defaultProps} 
        onTryDifferentBus={mockOnTryDifferentBus} 
      />
    );

    expect(getByText('Try Different Bus')).toBeTruthy();
  });

  it('should render both buttons when both callbacks provided', () => {
    const mockOnRefresh = jest.fn();
    const mockOnTryDifferentBus = jest.fn();
    
    const { getByText } = render(
      <NoTrackerMessage 
        {...defaultProps} 
        onRefresh={mockOnRefresh}
        onTryDifferentBus={mockOnTryDifferentBus} 
      />
    );

    expect(getByText('Check Again')).toBeTruthy();
    expect(getByText('Try Different Bus')).toBeTruthy();
  });

  it('should call onRefresh when refresh button pressed', () => {
    const mockOnRefresh = jest.fn();
    
    const { getByText } = render(
      <NoTrackerMessage 
        {...defaultProps} 
        onRefresh={mockOnRefresh} 
      />
    );

    const refreshButton = getByText('Check Again');
    fireEvent.press(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('should call onTryDifferentBus when try different bus button pressed', () => {
    const mockOnTryDifferentBus = jest.fn();
    
    const { getByText } = render(
      <NoTrackerMessage 
        {...defaultProps} 
        onTryDifferentBus={mockOnTryDifferentBus} 
      />
    );

    const tryDifferentBusButton = getByText('Try Different Bus');
    fireEvent.press(tryDifferentBusButton);

    expect(mockOnTryDifferentBus).toHaveBeenCalledTimes(1);
  });

  it('should not render buttons when callbacks not provided', () => {
    const { queryByText } = render(
      <NoTrackerMessage {...defaultProps} />
    );

    expect(queryByText('Check Again')).toBeNull();
    expect(queryByText('Try Different Bus')).toBeNull();
  });

  it('should display bus emoji icon', () => {
    const { getByText } = render(
      <NoTrackerMessage {...defaultProps} />
    );

    expect(getByText('🚌')).toBeTruthy();
  });

  it('should handle numeric bus numbers', () => {
    const { getByText } = render(
      <NoTrackerMessage busNumber="42" />
    );

    expect(getByText("Bus 42 doesn't have an active tracker right now.")).toBeTruthy();
  });

  it('should handle alphanumeric bus numbers', () => {
    const { getByText } = render(
      <NoTrackerMessage busNumber="C15" />
    );

    expect(getByText("Bus C15 doesn't have an active tracker right now.")).toBeTruthy();
  });

  it('should have proper styling container', () => {
    const { getByText } = render(
      <NoTrackerMessage {...defaultProps} />
    );

    const container = getByText('No Active Tracker').parent?.parent;
    expect(container).toBeTruthy();
  });
});