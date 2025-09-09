import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { healthController } from '../../../src/controllers/healthController';

// Mock database service
jest.mock('../../../src/services/databaseService', () => ({
  __esModule: true,
  default: {
    healthCheck: jest.fn(),
    isConnectionActive: jest.fn()
  }
}));

import databaseService from '../../../src/services/databaseService';

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return healthy status when database is healthy', async () => {
      const mockHealthCheck = databaseService.healthCheck as jest.MockedFunction<typeof databaseService.healthCheck>;
      mockHealthCheck.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date('2025-01-01T00:00:00Z')
      });

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          database: {
            status: 'healthy',
            timestamp: new Date('2025-01-01T00:00:00Z')
          },
          server: {
            status: 'running',
            uptime: expect.any(Number),
            timestamp: expect.any(Date)
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should return error status when database health check fails', async () => {
      const mockHealthCheck = databaseService.healthCheck as jest.MockedFunction<typeof databaseService.healthCheck>;
      mockHealthCheck.mockRejectedValue(new Error('Database connection failed'));

      await healthController.getHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: 'Database connection failed'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return database health status', async () => {
      const mockHealthCheck = databaseService.healthCheck as jest.MockedFunction<typeof databaseService.healthCheck>;
      const mockIsConnectionActive = databaseService.isConnectionActive as jest.MockedFunction<typeof databaseService.isConnectionActive>;
      
      mockHealthCheck.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date('2025-01-01T00:00:00Z')
      });
      mockIsConnectionActive.mockReturnValue(true);

      await healthController.getDatabaseHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date('2025-01-01T00:00:00Z'),
          connection: true
        },
        timestamp: expect.any(String)
      });
    });

    it('should return error when database health check fails', async () => {
      const mockHealthCheck = databaseService.healthCheck as jest.MockedFunction<typeof databaseService.healthCheck>;
      mockHealthCheck.mockRejectedValue(new Error('Connection timeout'));

      await healthController.getDatabaseHealth(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_HEALTH_CHECK_FAILED',
          message: 'Database health check failed',
          details: 'Connection timeout'
        },
        timestamp: expect.any(String)
      });
    });
  });
});