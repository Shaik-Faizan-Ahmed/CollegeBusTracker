import React from 'react';
import { render } from '@testing-library/react-native';
import ValidationError from '../../../../src/components/tracking/BusSelector/ValidationError';

describe('ValidationError', () => {
  it('should render error message when error is provided and visible', () => {
    const { getByText } = render(
      <ValidationError error="Invalid bus number" visible={true} />
    );

    expect(getByText('Invalid bus number')).toBeTruthy();
  });

  it('should not render when error is null', () => {
    const { queryByText } = render(
      <ValidationError error={null} visible={true} />
    );

    expect(queryByText('Invalid bus number')).toBeNull();
  });

  it('should not render when error is empty string', () => {
    const { queryByText } = render(
      <ValidationError error="" visible={true} />
    );

    // Should not render anything for empty error
    expect(queryByText('')).toBeNull();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <ValidationError error="Invalid bus number" visible={false} />
    );

    expect(queryByText('Invalid bus number')).toBeNull();
  });

  it('should render when visible prop is not provided (defaults to true)', () => {
    const { getByText } = render(
      <ValidationError error="Invalid bus number" />
    );

    expect(getByText('Invalid bus number')).toBeTruthy();
  });

  it('should have proper accessibility properties', () => {
    const { getByRole } = render(
      <ValidationError error="Invalid bus number" />
    );

    const errorText = getByRole('alert');
    expect(errorText).toBeTruthy();
    expect(errorText.props.accessibilityLiveRegion).toBe('assertive');
  });

  it('should handle different error messages', () => {
    const { getByText, rerender } = render(
      <ValidationError error="Bus number is required" />
    );

    expect(getByText('Bus number is required')).toBeTruthy();

    rerender(<ValidationError error="Bus number must be between 1 and 50" />);
    expect(getByText('Bus number must be between 1 and 50')).toBeTruthy();
  });

  it('should handle long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed correctly in the validation error component';
    const { getByText } = render(
      <ValidationError error={longError} />
    );

    expect(getByText(longError)).toBeTruthy();
  });

  it('should not render when error is undefined', () => {
    const { queryByRole } = render(
      <ValidationError error={undefined} />
    );

    // Should not render alert role when no error
    expect(queryByRole('alert')).toBeNull();
  });

  it('should render and hide based on visible prop changes', () => {
    const { getByText, queryByText, rerender } = render(
      <ValidationError error="Test error" visible={true} />
    );

    // Initially visible
    expect(getByText('Test error')).toBeTruthy();

    // Hide the error
    rerender(<ValidationError error="Test error" visible={false} />);
    expect(queryByText('Test error')).toBeNull();

    // Show again
    rerender(<ValidationError error="Test error" visible={true} />);
    expect(getByText('Test error')).toBeTruthy();
  });
});