import { Request, Response } from 'express';
import databaseService from '../services/databaseService';
import MonitoringService from '../services/monitoringService';
import { ApiResponse, ApiError } from '../types/api';

export class HealthController {
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await databaseService.healthCheck();
      
      const response: ApiResponse<{
        status: string;
        database: {
          status: string;
          timestamp: Date;
        };
        server: {
          status: string;
          uptime: number;
          timestamp: Date;
        };
      }> = {
        success: true,
        data: {
          status: 'healthy',
          database: {
            status: dbHealth.status,
            timestamp: dbHealth.timestamp
          },
          server: {
            status: 'running',
            uptime: process.uptime(),
            timestamp: new Date()
          }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(503).json(errorResponse);
    }
  }

  async getDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const dbHealth = await databaseService.healthCheck();
      
      const response: ApiResponse<{
        status: string;
        timestamp: Date;
        connection: boolean;
      }> = {
        success: true,
        data: {
          status: dbHealth.status,
          timestamp: dbHealth.timestamp,
          connection: databaseService.isConnectionActive()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'DATABASE_HEALTH_CHECK_FAILED',
          message: 'Database health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(503).json(errorResponse);
    }
  }

  async getMonitoringHealth(req: Request, res: Response): Promise<void> {
    try {
      const monitoringService = MonitoringService.getInstance();
      const health = monitoringService.getHealthStatus();
      
      const response: ApiResponse<{
        status: string;
        initialized: boolean;
        dsn: boolean;
        timestamp: Date;
      }> = {
        success: true,
        data: {
          status: health.status,
          initialized: health.initialized,
          dsn: health.dsn,
          timestamp: new Date()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'MONITORING_HEALTH_CHECK_FAILED',
          message: 'Monitoring health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(503).json(errorResponse);
    }
  }
}

export const healthController = new HealthController();