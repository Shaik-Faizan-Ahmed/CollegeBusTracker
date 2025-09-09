import express from 'express';
import { ApiResponse, ApiError } from '@cvr-bus-tracker/shared-types';
import databaseService from '../services/databaseService';
import ServerConfigService from '../config/serverConfig';

const router = express.Router();

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database: string;
}

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const serverConfig = ServerConfigService.getInstance();
    
    let dbStatus = 'disconnected';
    try {
      if (databaseService.isConnectionActive()) {
        await databaseService.healthCheck();
        dbStatus = 'connected';
      }
    } catch (dbError) {
      dbStatus = 'error';
    }

    const response: ApiResponse<HealthData> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: serverConfig.getNodeEnv(),
        version: '1.0.0',
        database: dbStatus,
      },
      timestamp: new Date().toISOString()
    };

    // If database is unhealthy, return 503 status but still provide info
    const statusCode = dbStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    const serverConfig = ServerConfigService.getInstance();
    const response: ApiError = {
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
});

export default router;