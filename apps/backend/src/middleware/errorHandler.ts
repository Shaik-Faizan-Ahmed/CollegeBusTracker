import express from 'express';
import { ApiResponse } from '@cvr-bus-tracker/shared-types';

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

  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  };

  res.status(500).json(response);
};

export const notFoundHandler = (
  req: express.Request,
  res: express.Response
) => {
  const response: ApiResponse = {
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  };

  res.status(404).json(response);
};