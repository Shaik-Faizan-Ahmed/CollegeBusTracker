import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { 
  validateBusNumber, 
  validateCoordinates, 
  validateLocationData, 
  validateSessionId,
  ValidationRequest 
} from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<ValidationRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      validatedData: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateBusNumber', () => {
    it('should validate correct bus number', () => {
      mockRequest.body = { busNumber: '12' };
      
      validateBusNumber(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.validatedData?.busNumber).toBe('12');
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject missing bus number', () => {
      mockRequest.body = {};
      
      validateBusNumber(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Bus number is required'
          })
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject non-string bus number', () => {
      mockRequest.body = { busNumber: 123 };
      
      validateBusNumber(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_BUS_NUMBER',
            message: 'Bus number must be a string'
          })
        })
      );
    });

    it('should reject bus number that is too long', () => {
      mockRequest.body = { busNumber: '12345678901' }; // 11 characters
      
      validateBusNumber(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_BUS_NUMBER',
            message: 'Bus number must be between 1 and 10 characters'
          })
        })
      );
    });

    it('should reject bus number with invalid characters', () => {
      mockRequest.body = { busNumber: '12-A' };
      
      validateBusNumber(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_BUS_NUMBER',
            message: 'Bus number must contain only alphanumeric characters'
          })
        })
      );
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      mockRequest.body = { 
        latitude: 17.3850, 
        longitude: 78.4867, 
        accuracy: 10.5 
      };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.validatedData?.latitude).toBe(17.3850);
      expect(mockRequest.validatedData?.longitude).toBe(78.4867);
      expect(mockRequest.validatedData?.accuracy).toBe(10.5);
    });

    it('should use default accuracy when not provided', () => {
      mockRequest.body = { 
        latitude: 17.3850, 
        longitude: 78.4867
      };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.validatedData?.accuracy).toBe(10.0);
    });

    it('should reject missing latitude', () => {
      mockRequest.body = { longitude: 78.4867 };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Latitude is required'
          })
        })
      );
    });

    it('should reject invalid latitude range', () => {
      mockRequest.body = { latitude: 91, longitude: 78.4867 };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_COORDINATES',
            message: 'Latitude must be between -90 and 90'
          })
        })
      );
    });

    it('should reject invalid longitude range', () => {
      mockRequest.body = { latitude: 17.3850, longitude: 181 };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_COORDINATES',
            message: 'Longitude must be between -180 and 180'
          })
        })
      );
    });

    it('should reject negative accuracy', () => {
      mockRequest.body = { 
        latitude: 17.3850, 
        longitude: 78.4867, 
        accuracy: -5 
      };
      
      validateCoordinates(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_COORDINATES',
            message: 'Accuracy must be greater than 0'
          })
        })
      );
    });
  });

  describe('validateSessionId', () => {
    it('should validate correct session ID', () => {
      mockRequest.body = { sessionId: '123e4567-e89b-12d3-a456-426614174000' };
      
      validateSessionId(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.validatedData?.sessionId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject missing session ID', () => {
      mockRequest.body = {};
      
      validateSessionId(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Session ID is required'
          })
        })
      );
    });

    it('should reject invalid UUID format', () => {
      mockRequest.body = { sessionId: 'invalid-uuid' };
      
      validateSessionId(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_SESSION_ID',
            message: 'Session ID must be a valid UUID format'
          })
        })
      );
    });
  });

  describe('validateLocationData', () => {
    it('should validate complete location data', () => {
      mockRequest.body = { 
        busNumber: '12',
        latitude: 17.3850, 
        longitude: 78.4867, 
        accuracy: 10.5 
      };
      
      validateLocationData(mockRequest as ValidationRequest, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.validatedData).toEqual({
        busNumber: '12',
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10.5
      });
    });
  });
});