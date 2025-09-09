import { ServerConfig, DEFAULT_SERVER_CONFIG } from '@cvr-bus-tracker/config';

/**
 * Server configuration service that encapsulates environment variable access
 * This follows the coding standards by providing config objects instead of direct process.env access
 */
class ServerConfigService {
  private static instance: ServerConfigService;
  private config: ServerConfig;

  private constructor() {
    this.config = this.loadServerConfig();
  }

  public static getInstance(): ServerConfigService {
    if (!ServerConfigService.instance) {
      ServerConfigService.instance = new ServerConfigService();
    }
    return ServerConfigService.instance;
  }

  private loadServerConfig(): ServerConfig {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || DEFAULT_SERVER_CONFIG.corsOrigins || ['http://localhost:8081'],
    };
  }

  public getConfig(): ServerConfig {
    return this.config;
  }

  public getPort(): number {
    return this.config.port;
  }

  public getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  public getCorsOrigins(): string[] {
    return this.config.corsOrigins;
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

export default ServerConfigService;