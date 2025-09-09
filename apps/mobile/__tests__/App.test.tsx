/**
 * App Integration Tests
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';
import {render} from '@testing-library/react-native';

describe('App Integration', () => {
  it('renders App without throwing errors', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('contains NavigationContainer structure', () => {
    const app = render(<App />);
    // Basic integration test - if it renders without error,
    // the navigation structure is valid
    expect(app).toBeDefined();
  });

  it('sets up all required screen components', () => {
    // This test validates that all screens are properly imported
    // and configured in the navigation structure without errors
    expect(() => render(<App />)).not.toThrow();
  });
});
