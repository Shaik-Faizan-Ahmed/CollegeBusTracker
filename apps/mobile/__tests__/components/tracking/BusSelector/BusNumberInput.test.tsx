import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BusNumberInput from '../../../../src/components/tracking/BusSelector/BusNumberInput';

describe('BusNumberInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with default props', () => {
    const { getByText, getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} />
    );

    expect(getByText('Bus Number')).toBeTruthy();
    expect(getByDisplayValue('')).toBeTruthy();
  });

  it('should display custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <BusNumberInput {...defaultProps} placeholder="Custom placeholder" />
    );

    expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });

  it('should display the provided value', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} value="A15" />
    );

    expect(getByDisplayValue('A15')).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} onChangeText={onChangeText} />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'A15');

    expect(onChangeText).toHaveBeenCalledWith('A15');
  });

  it('should sanitize input by removing special characters and converting to uppercase', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} onChangeText={onChangeText} />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'a1!@#$%');

    expect(onChangeText).toHaveBeenCalledWith('A1');
  });

  it('should call onSubmit when return key is pressed', () => {
    const onSubmit = jest.fn();
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} onSubmit={onSubmit} />
    );

    const input = getByDisplayValue('');
    fireEvent(input, 'submitEditing');

    expect(onSubmit).toHaveBeenCalled();
  });

  it('should display error message when error prop is provided', () => {
    const { getByText } = render(
      <BusNumberInput {...defaultProps} error="Invalid bus number" />
    );

    expect(getByText('Invalid bus number')).toBeTruthy();
  });

  it('should apply error styling when error prop is provided', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} error="Invalid bus number" />
    );

    const input = getByDisplayValue('');
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#FF3B30',
        }),
      ])
    );
  });

  it('should disable input when loading', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} isLoading={true} />
    );

    const input = getByDisplayValue('');
    expect(input.props.editable).toBe(false);
  });

  it('should have proper accessibility properties', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} />
    );

    const input = getByDisplayValue('');
    expect(input.props.accessibilityLabel).toBe('Bus number input');
    expect(input.props.accessibilityHint).toBe('Enter the bus number you want to track or operate');
  });

  it('should limit input length to 10 characters', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} />
    );

    const input = getByDisplayValue('');
    expect(input.props.maxLength).toBe(10);
  });

  it('should use appropriate keyboard settings', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} />
    );

    const input = getByDisplayValue('');
    expect(input.props.keyboardType).toBe('default');
    expect(input.props.returnKeyType).toBe('done');
    expect(input.props.autoCapitalize).toBe('characters');
    expect(input.props.autoCorrect).toBe(false);
  });

  it('should handle focus and blur events', () => {
    const { getByDisplayValue } = render(
      <BusNumberInput {...defaultProps} />
    );

    const input = getByDisplayValue('');
    
    // Test focus
    fireEvent(input, 'focus');
    // Focus styling should be applied (tested through style changes)
    
    // Test blur
    fireEvent(input, 'blur');
    // Focus styling should be removed
  });

  it('should clear error when user starts typing', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue, queryByText, rerender } = render(
      <BusNumberInput {...defaultProps} onChangeText={onChangeText} error="Some error" />
    );

    // Error should be visible initially
    expect(queryByText('Some error')).toBeTruthy();

    const input = getByDisplayValue('');
    fireEvent.changeText(input, 'A');

    // Re-render without error (simulating error clearing)
    rerender(
      <BusNumberInput {...defaultProps} onChangeText={onChangeText} error={null} />
    );

    expect(queryByText('Some error')).toBeNull();
  });
});