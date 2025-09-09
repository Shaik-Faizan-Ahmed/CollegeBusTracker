import { Router } from 'express';
import { trackerController } from '../controllers/trackerController';
import { validateLocationData, validateSessionId, validateCoordinates } from '../middleware/validation';
import { trackerRateLimit } from '../middleware/rateLimiter';

const router = Router();

// POST /api/tracker/start - Start tracking session
router.post('/start', 
  trackerRateLimit,
  validateLocationData,
  trackerController.startTracking.bind(trackerController)
);

// POST /api/tracker/update - Update tracker location
router.post('/update', 
  trackerRateLimit,
  validateSessionId,
  validateCoordinates,
  trackerController.updateLocation.bind(trackerController)
);

// POST /api/tracker/stop - Stop tracking session
router.post('/stop', 
  trackerRateLimit,
  validateSessionId,
  trackerController.stopTracking.bind(trackerController)
);

export default router;