/**
 * Environment Configuration Management
 * Provides type-safe environment configuration for different deployment stages
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  NODE_ENV: Environment;
  API_BASE_URL: string;
  DATABASE_URL?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY: string;
  SENTRY_DSN?: string;
  CORS_ORIGINS: string[];
  PORT: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  CACHE_TTL: number;
  SESSION_TIMEOUT: number;
}

export const DEFAULT_CONFIG: EnvironmentConfig = {
  NODE_ENV: 'development',
  API_BASE_URL: 'http://localhost:3001',
  SUPABASE_URL: 'https://bmhruvfthinvkebgavk.supabase.co',
  SUPABASE_ANON_KEY: '',
  CORS_ORIGINS: ['http://localhost:8081'],
  PORT: 3001,
  LOG_LEVEL: 'info',
  CACHE_TTL: 300, // 5 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS: Record<Environment, Partial<EnvironmentConfig>> = {
  development: {
    NODE_ENV: 'development',
    API_BASE_URL: 'http://localhost:3001',
    PORT: 3001,
    LOG_LEVEL: 'debug',
    CORS_ORIGINS: ['http://localhost:8081'],
  },
  
  staging: {
    NODE_ENV: 'staging',
    API_BASE_URL: 'https://cvr-bus-tracker-staging.onrender.com',
    PORT: 3001,
    LOG_LEVEL: 'info',
    CORS_ORIGINS: ['https://staging-mobile-app.example.com'],
  },
  
  production: {
    NODE_ENV: 'production',
    API_BASE_URL: 'https://cvr-bus-tracker.onrender.com',
    PORT: 3001,
    LOG_LEVEL: 'warn',
    CORS_ORIGINS: ['https://cvr-bus-tracker.app'],
  },
  
  test: {
    NODE_ENV: 'test',
    API_BASE_URL: 'http://localhost:3001',
    PORT: 3002,
    LOG_LEVEL: 'error',
    CACHE_TTL: 0, // No caching in tests
    CORS_ORIGINS: ['http://localhost:8081'],
  },
};

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(env?: string): EnvironmentConfig {
  const currentEnv = (env || process.env.NODE_ENV || 'development') as Environment;
  
  // Merge default config with environment-specific overrides
  const envOverrides = ENVIRONMENT_CONFIGS[currentEnv] || {};
  const config: EnvironmentConfig = { ...DEFAULT_CONFIG, ...envOverrides };
  
  // Override with actual environment variables
  if (process.env.PORT) {
    config.PORT = parseInt(process.env.PORT, 10);
  }
  
  if (process.env.SUPABASE_URL) {
    config.SUPABASE_URL = process.env.SUPABASE_URL;
  }
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    config.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  
  if (process.env.SUPABASE_ANON_KEY) {
    config.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }
  
  if (process.env.SENTRY_DSN) {
    config.SENTRY_DSN = process.env.SENTRY_DSN;
  }
  
  if (process.env.CORS_ORIGINS) {
    config.CORS_ORIGINS = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }
  
  if (process.env.LOG_LEVEL) {
    config.LOG_LEVEL = process.env.LOG_LEVEL as any;
  }
  
  // Set API_BASE_URL for mobile app
  if (process.env.API_BASE_URL) {
    config.API_BASE_URL = process.env.API_BASE_URL;
  }
  
  // Validate required fields
  validateConfig(config);
  
  return config;
}

/**
 * Validate environment configuration
 */
function validateConfig(config: EnvironmentConfig): void {
  const requiredFields = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PORT'];
  const missing = requiredFields.filter(field => !config[field as keyof EnvironmentConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Production-specific validations
  if (config.NODE_ENV === 'production') {
    if (!config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }
    
    if (!config.SENTRY_DSN) {
      console.warn('⚠️ SENTRY_DSN not configured for production environment');
    }
  }
}

/**
 * Get environment-specific configuration
 */
export function getConfig(): EnvironmentConfig {
  return loadEnvironmentConfig();
}

/**
 * Check if running in specific environment
 */
export function isEnvironment(env: Environment): boolean {
  return process.env.NODE_ENV === env;
}

export function isDevelopment(): boolean {
  return isEnvironment('development');
}

export function isProduction(): boolean {
  return isEnvironment('production');
}

export function isTest(): boolean {
  return isEnvironment('test');
}