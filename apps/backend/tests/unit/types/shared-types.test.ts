import { describe, it, expect } from '@jest/globals';
import { 
  BusSession, 
  LocationUpdate, 
  TrackingRequest, 
  BUS_SESSION_CONSTRAINTS,
  ApiResponse,
  ApiError 
} from '@cvr-bus-tracker/shared-types';

describe('Shared Types', () => {
  describe('BusSession', () => {
    it('should have all required properties', () => {
      const busSession: BusSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        busNumber: '12',
        trackerId: 'tracker-123',
        latitude: 17.3850,
        longitude: 78.4867,
        isActive: true,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      expect(typeof busSession.id).toBe('string');
      expect(typeof busSession.busNumber).toBe('string');
      expect(typeof busSession.trackerId).toBe('string');
      expect(typeof busSession.latitude).toBe('number');
      expect(typeof busSession.longitude).toBe('number');
      expect(typeof busSession.isActive).toBe('boolean');
      expect(busSession.lastUpdated).toBeInstanceOf(Date);
      expect(busSession.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('LocationUpdate', () => {
    it('should have all required properties', () => {
      const locationUpdate: LocationUpdate = {
        busNumber: '12',
        latitude: 17.3850,
        longitude: 78.4867,
        accuracy: 10.5,
        timestamp: Date.now(),
        sessionId: '123e4567-e89b-12d3-a456-426614174000'
      };

      expect(typeof locationUpdate.busNumber).toBe('string');
      expect(typeof locationUpdate.latitude).toBe('number');
      expect(typeof locationUpdate.longitude).toBe('number');
      expect(typeof locationUpdate.accuracy).toBe('number');
      expect(typeof locationUpdate.timestamp).toBe('number');
      expect(typeof locationUpdate.sessionId).toBe('string');
    });
  });

  describe('TrackingRequest', () => {
    it('should have all required properties', () => {
      const trackingRequest: TrackingRequest = {
        busNumber: '12',
        consumerId: 'consumer-123',
        requestedAt: new Date(),
        socketId: 'socket-456'
      };

      expect(typeof trackingRequest.busNumber).toBe('string');
      expect(typeof trackingRequest.consumerId).toBe('string');
      expect(trackingRequest.requestedAt).toBeInstanceOf(Date);
      expect(typeof trackingRequest.socketId).toBe('string');
    });
  });

  describe('BUS_SESSION_CONSTRAINTS', () => {
    it('should have valid constraint values', () => {
      expect(BUS_SESSION_CONSTRAINTS.busNumber.minLength).toBe(1);
      expect(BUS_SESSION_CONSTRAINTS.busNumber.maxLength).toBe(10);
      expect(BUS_SESSION_CONSTRAINTS.busNumber.pattern).toBeInstanceOf(RegExp);
      
      expect(BUS_SESSION_CONSTRAINTS.trackerId.minLength).toBe(1);
      expect(BUS_SESSION_CONSTRAINTS.trackerId.maxLength).toBe(50);
      
      expect(BUS_SESSION_CONSTRAINTS.latitude.min).toBe(-90);
      expect(BUS_SESSION_CONSTRAINTS.latitude.max).toBe(90);
      
      expect(BUS_SESSION_CONSTRAINTS.longitude.min).toBe(-180);
      expect(BUS_SESSION_CONSTRAINTS.longitude.max).toBe(180);
      
      expect(BUS_SESSION_CONSTRAINTS.accuracy.min).toBe(0);
    });

    it('should validate bus number pattern correctly', () => {
      const pattern = BUS_SESSION_CONSTRAINTS.busNumber.pattern;
      
      expect(pattern.test('12')).toBe(true);
      expect(pattern.test('A1')).toBe(true);
      expect(pattern.test('Bus123')).toBe(true);
      expect(pattern.test('12-A')).toBe(false); // Contains hyphen
      expect(pattern.test('12 A')).toBe(false); // Contains space
      expect(pattern.test('')).toBe(false); // Empty string
    });
  });

  describe('ApiResponse', () => {
    it('should have correct success response structure', () => {
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Test successful' },
        timestamp: new Date().toISOString()
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });
  });

  describe('ApiError', () => {
    it('should have correct error response structure', () => {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid bus number provided',
          details: { field: 'busNumber', value: 'invalid-bus' }
        },
        timestamp: new Date().toISOString()
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe('INVALID_INPUT');
      expect(errorResponse.error.message).toBe('Invalid bus number provided');
      expect(errorResponse.error.details).toBeDefined();
      expect(typeof errorResponse.timestamp).toBe('string');
    });
  });
});