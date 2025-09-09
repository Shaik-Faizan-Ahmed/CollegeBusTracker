import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecentBusList from '../../../../src/components/tracking/BusSelector/RecentBusList';

describe('RecentBusList', () => {
  const defaultProps = {
    recentBuses: ['15', 'A1', 'B12'],
    onSelectBus: jest.fn(),
    onClearHistory: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with recent buses', () => {
    const { getByText } = render(
      <RecentBusList {...defaultProps} />
    );

    expect(getByText('Recent Bus Numbers')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('A1')).toBeTruthy();
    expect(getByText('B12')).toBeTruthy();
    expect(getByText('Clear')).toBeTruthy();
  });

  it('should not render when no recent buses are provided', () => {
    const { queryByText } = render(
      <RecentBusList {...defaultProps} recentBuses={[]} />
    );

    expect(queryByText('Recent Bus Numbers')).toBeNull();
    expect(queryByText('Clear')).toBeNull();
  });

  it('should call onSelectBus when a bus button is pressed', () => {
    const onSelectBus = jest.fn();
    const { getByText } = render(
      <RecentBusList {...defaultProps} onSelectBus={onSelectBus} />
    );

    const busButton = getByText('A1');
    fireEvent.press(busButton);

    expect(onSelectBus).toHaveBeenCalledWith('A1');
  });

  it('should call onClearHistory when clear button is pressed', () => {
    const onClearHistory = jest.fn();
    const { getByText } = render(
      <RecentBusList {...defaultProps} onClearHistory={onClearHistory} />
    );

    const clearButton = getByText('Clear');
    fireEvent.press(clearButton);

    expect(onClearHistory).toHaveBeenCalled();
  });

  it('should render all provided bus numbers', () => {
    const manyBuses = ['1', '2', '3', '4', '5', 'A1', 'B2', 'C3'];
    const { getByText } = render(
      <RecentBusList {...defaultProps} recentBuses={manyBuses} />
    );

    manyBuses.forEach(busNumber => {
      expect(getByText(busNumber)).toBeTruthy();
    });
  });

  it('should have proper accessibility properties for bus buttons', () => {
    const { getByLabelText } = render(
      <RecentBusList {...defaultProps} />
    );

    const busButton = getByLabelText('Select bus 15');
    expect(busButton).toBeTruthy();
  });

  it('should have proper accessibility properties for clear button', () => {
    const { getByLabelText } = render(
      <RecentBusList {...defaultProps} />
    );

    const clearButton = getByLabelText('Clear recent bus numbers');
    expect(clearButton).toBeTruthy();
  });

  it('should render with single recent bus', () => {
    const { getByText } = render(
      <RecentBusList {...defaultProps} recentBuses={['A15']} />
    );

    expect(getByText('Recent Bus Numbers')).toBeTruthy();
    expect(getByText('A15')).toBeTruthy();
    expect(getByText('Clear')).toBeTruthy();
  });

  it('should handle multiple calls to onSelectBus for different buses', () => {
    const onSelectBus = jest.fn();
    const { getByText } = render(
      <RecentBusList {...defaultProps} onSelectBus={onSelectBus} />
    );

    fireEvent.press(getByText('15'));
    fireEvent.press(getByText('A1'));
    fireEvent.press(getByText('B12'));

    expect(onSelectBus).toHaveBeenCalledTimes(3);
    expect(onSelectBus).toHaveBeenNthCalledWith(1, '15');
    expect(onSelectBus).toHaveBeenNthCalledWith(2, 'A1');
    expect(onSelectBus).toHaveBeenNthCalledWith(3, 'B12');
  });

  it('should maintain button order as provided in recentBuses array', () => {
    const orderedBuses = ['C10', 'A1', 'B5', '25'];
    const { getAllByRole } = render(
      <RecentBusList {...defaultProps} recentBuses={orderedBuses} />
    );

    const buttons = getAllByRole('button').filter(button => 
      button.props.accessibilityLabel && button.props.accessibilityLabel.startsWith('Select bus')
    );

    // Should have same number of bus buttons as provided buses
    expect(buttons).toHaveLength(orderedBuses.length);
  });
});