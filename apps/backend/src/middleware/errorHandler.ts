import express from 'express';
import { ApiError } from '@cvr-bus-tracker/shared-types';
import { ErrorCodes } from '../types/api';

export const errorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: ApiError = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: isDevelopment ? {
        error: err.message,
        stack: err.stack
      } : undefined
    },
    timestamp: new Date().toISOString()
  };

  res.status(500).json(response);
};

export const notFoundHandler = (
  req: express.Request,
  res: express.Response
) => {
  const response: ApiError = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: {
        method: req.method,
        path: req.path,
        url: req.url
      }
    },
    timestamp: new Date().toISOString()
  };

  res.status(404).json(response);
};