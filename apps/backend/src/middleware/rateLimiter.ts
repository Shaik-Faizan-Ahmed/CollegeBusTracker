import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiError } from '@cvr-bus-tracker/shared-types';

// Standard rate limiting for general API endpoints
export const standardRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: {
        limit: 100,
        windowMs: 60000,
        retryAfter: 'Wait 1 minute before retrying'
      }
    },
    timestamp: new Date().toISOString()
  } as ApiError,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: {
          limit: 100,
          windowMs: 60000,
          retryAfter: 'Wait 1 minute before retrying',
          ip: req.ip
        }
      },
      timestamp: new Date().toISOString()
    } as ApiError);
  }
});

// Stricter rate limiting for tracker operations (higher frequency expected)
export const trackerRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP for trackers
  message: {
    success: false,
    error: {
      code: 'TRACKER_RATE_LIMIT_EXCEEDED',
      message: 'Too many tracker requests. Please reduce frequency.',
      details: {
        limit: 200,
        windowMs: 60000,
        retryAfter: 'Wait 1 minute before retrying'
      }
    },
    timestamp: new Date().toISOString()
  } as ApiError,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TRACKER_RATE_LIMIT_EXCEEDED',
        message: 'Too many tracker requests. Please reduce frequency.',
        details: {
          limit: 200,
          windowMs: 60000,
          retryAfter: 'Wait 1 minute before retrying',
          ip: req.ip
        }
      },
      timestamp: new Date().toISOString()
    } as ApiError);
  }
});

// Lenient rate limiting for consumer/read operations
export const consumerRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP for consumers
  message: {
    success: false,
    error: {
      code: 'CONSUMER_RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: {
        limit: 300,
        windowMs: 60000,
        retryAfter: 'Wait 1 minute before retrying'
      }
    },
    timestamp: new Date().toISOString()
  } as ApiError,
  standardHeaders: true,
  legacyHeaders: false
});

// Health check rate limiting (prevent abuse)
export const healthCheckRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 health checks per minute per IP
  message: {
    success: false,
    error: {
      code: 'HEALTH_CHECK_RATE_LIMIT_EXCEEDED',
      message: 'Too many health check requests.',
      details: {
        limit: 30,
        windowMs: 60000,
        retryAfter: 'Wait 1 minute before retrying'
      }
    },
    timestamp: new Date().toISOString()
  } as ApiError,
  standardHeaders: true,
  legacyHeaders: false
});