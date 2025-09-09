import { Router } from 'express';
import { busController } from '../controllers/busController';
import { consumerRateLimit } from '../middleware/rateLimiter';

const router = Router();

// GET /api/buses/active - Get all active buses
router.get('/active', consumerRateLimit, busController.getActiveBuses.bind(busController));

// GET /api/buses/:busNumber - Get specific bus location
router.get('/:busNumber', consumerRateLimit, busController.getBusLocation.bind(busController));

export default router;