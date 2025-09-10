/**
 * Mobile App Environment Configuration
 * Provides environment-specific settings for the React Native app
 */

import {
  getConfig,
  Environment,
  isDevelopment,
  isProduction,
} from '@cvr-bus-tracker/config';

export interface MobileConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  environment: Environment;
  debug: boolean;
  logLevel: string;
  version: string;
  buildNumber: string;
}

/**
 * Get mobile app configuration based on environment
 */
export function getMobileConfig(): MobileConfig {
  const sharedConfig = getConfig();

  return {
    apiBaseUrl: sharedConfig.API_BASE_URL,
    websocketUrl: sharedConfig.API_BASE_URL.replace(/^http/, 'ws'),
    environment: sharedConfig.NODE_ENV,
    debug: isDevelopment(),
    logLevel: sharedConfig.LOG_LEVEL,
    version: '1.0.0',
    buildNumber: '1',
  };
}

/**
 * Development-specific configuration
 */
export const DEVELOPMENT_CONFIG: Partial<MobileConfig> = {
  apiBaseUrl: 'http://localhost:3001',
  websocketUrl: 'ws://localhost:3001',
  debug: true,
  logLevel: 'debug',
};

/**
 * Production-specific configuration
 */
export const PRODUCTION_CONFIG: Partial<MobileConfig> = {
  apiBaseUrl: 'https://collegebustracker.onrender.com',
  websocketUrl: 'wss://collegebustracker.onrender.com',
  debug: false,
  logLevel: 'error',
};

/**
 * Get environment-aware API endpoints
 */
export function getApiEndpoints() {
  const config = getMobileConfig();
  const baseUrl = config.apiBaseUrl;

  return {
    health: `${baseUrl}/api/health`,
    buses: {
      active: `${baseUrl}/api/buses/active`,
      byNumber: (busNumber: string) => `${baseUrl}/api/buses/${busNumber}`,
    },
    tracker: {
      start: `${baseUrl}/api/tracker/start`,
      update: `${baseUrl}/api/tracker/update`,
      stop: `${baseUrl}/api/tracker/stop`,
    },
    websocket: config.websocketUrl,
  };
}

/**
 * Log configuration info (for debugging)
 */
export function logEnvironmentInfo() {
  if (isDevelopment()) {
    const config = getMobileConfig();
    console.log('🔧 Mobile App Configuration:', {
      environment: config.environment,
      apiBaseUrl: config.apiBaseUrl,
      debug: config.debug,
      version: config.version,
    });
  }
}
