import express from 'express';
import { ApiResponse } from '@cvr-bus-tracker/shared-types';
import DatabaseService from '../services/database';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const database = DatabaseService.getInstance();
    const dbHealth = await database.healthCheck();

    const response: ApiResponse = {
      success: true,
      message: 'CVR Bus Tracker API is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        database: dbHealth,
      },
    };

    // If database is unhealthy, return 503 status but still provide info
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      },
    };

    res.status(500).json(response);
  }
});

export default router;