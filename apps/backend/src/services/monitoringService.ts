/**
 * Monitoring Service for CVR Bus Tracker Backend
 * Integrates Sentry for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { Application } from 'express';
import ServerConfigService from '../config/serverConfig';

class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;
  private serverConfig = ServerConfigService.getInstance();

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize Sentry monitoring
   */
  public initialize(app: Application): void {
    if (this.initialized) {
      return;
    }

    const sentryDsn = process.env.SENTRY_DSN;
    const environment = this.serverConfig.getNodeEnv();
    
    // Only initialize if Sentry DSN is provided
    if (!sentryDsn) {
      if (this.serverConfig.isProduction()) {
        console.warn('⚠️ Sentry DSN not configured for production environment');
      } else {
        console.log('🔍 Sentry monitoring disabled (no DSN provided)');
      }
      return;
    }

    console.log('🔍 Initializing Sentry monitoring...');

    Sentry.init({
      dsn: sentryDsn,
      environment,
      // Performance monitoring
      tracesSampleRate: this.getTracesSampleRate(),
    });

    // Add request tracking
    app.use((req, res, next) => {
      Sentry.setTag('component', 'backend');
      Sentry.setTag('version', '1.0.0');
      next();
    });

    this.initialized = true;
    console.log('✅ Sentry monitoring initialized successfully');
  }

  /**
   * Add error handler middleware (should be added after all routes)
   */
  public addErrorHandler(app: Application): void {
    if (!this.initialized) {
      return;
    }

    // Add error tracking middleware
    app.use((err: any, req: any, res: any, next: any) => {
      if (this.initialized) {
        Sentry.captureException(err);
      }
      next(err);
    });
  }

  /**
   * Capture an exception manually
   */
  public captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      console.error('Monitoring not initialized:', error);
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Capture a message manually
   */
  public captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.initialized) {
      console.log('Message (monitoring disabled):', message);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context) {
        Object.keys(context).forEach(key => {
          scope.setContext(key, context[key]);
        });
      }
      Sentry.captureMessage(message);
    });
  }

  /**
   * Add user context to current scope
   */
  public setUser(userId: string, additional?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setUser({
      id: userId,
      ...additional,
    });
  }

  /**
   * Add tags to current scope
   */
  public setTag(key: string, value: string): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setTag(key, value);
  }

  /**
   * Add extra context
   */
  public setExtra(key: string, value: any): void {
    if (!this.initialized) {
      return;
    }

    Sentry.setExtra(key, value);
  }

  /**
   * Start a new span for performance monitoring
   */
  public startSpan(name: string, description?: string) {
    if (!this.initialized) {
      return undefined;
    }

    return Sentry.startSpan({ name }, () => {
      // Simple span tracking without complex data
      console.log(`📊 Performance span: ${name}`);
    });
  }

  /**
   * Get health status of monitoring service
   */
  public getHealthStatus(): { status: string; initialized: boolean; dsn: boolean } {
    return {
      status: this.initialized ? 'active' : 'disabled',
      initialized: this.initialized,
      dsn: !!process.env.SENTRY_DSN,
    };
  }

  /**
   * Close Sentry client (for graceful shutdown)
   */
  public async close(timeout = 2000): Promise<void> {
    if (this.initialized) {
      console.log('🔍 Closing Sentry monitoring...');
      await Sentry.close(timeout);
    }
  }

  /**
   * Get traces sample rate based on environment
   */
  private getTracesSampleRate(): number {
    if (this.serverConfig.isProduction()) {
      return 0.1; // 10% sampling in production
    } else if (this.serverConfig.getNodeEnv() === 'staging') {
      return 0.5; // 50% sampling in staging
    } else {
      return 1.0; // 100% sampling in development
    }
  }

  /**
   * Filter errors before sending to Sentry
   */
  private beforeSendError(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Don't send certain types of errors
    if (hint.originalException) {
      const error = hint.originalException as Error;
      
      // Filter out common non-critical errors
      if (error.message?.includes('ECONNRESET') ||
          error.message?.includes('EPIPE') ||
          error.message?.includes('Client network socket disconnected')) {
        return null;
      }
    }

    // Don't send test environment errors
    if (this.serverConfig.isTest()) {
      return null;
    }

    return event;
  }
}

export default MonitoringService;