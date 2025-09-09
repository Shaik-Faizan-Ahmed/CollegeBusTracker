// CVR Bus Tracker - Shared Configuration

export interface AppConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  googleMapsApiKey: string;
  debug: boolean;
}

export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
}

// Default configurations
export const DEFAULT_CONFIG: Partial<AppConfig> = {
  debug: false,
};

export const DEFAULT_SERVER_CONFIG: Partial<ServerConfig> = {
  port: 3000,
  nodeEnv: 'development',
  corsOrigins: ['http://localhost:8081'],
};

// Configuration validation
export const validateConfig = (config: any): boolean => {
  const requiredFields = ['apiBaseUrl', 'websocketUrl'];
  return requiredFields.every(field => field in config && config[field]);
};

export const validateDatabaseConfig = (config: any): boolean => {
  const requiredFields = ['url', 'serviceRoleKey'];
  return requiredFields.every(field => field in config && config[field]);
};

// Export environment management
export * from './environment';