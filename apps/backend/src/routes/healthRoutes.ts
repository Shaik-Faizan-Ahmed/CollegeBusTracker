import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import { healthCheckRateLimit } from '../middleware/rateLimiter';

const router = Router();

// GET /api/health - General health check
router.get('/', healthCheckRateLimit, healthController.getHealth.bind(healthController));

// GET /api/health/database - Database specific health check
router.get('/database', healthCheckRateLimit, healthController.getDatabaseHealth.bind(healthController));

// GET /api/health/monitoring - Monitoring service health check
router.get('/monitoring', healthCheckRateLimit, healthController.getMonitoringHealth.bind(healthController));

export default router;