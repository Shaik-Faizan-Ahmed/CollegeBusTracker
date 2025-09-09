// Success response format
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Error response format
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Request interfaces
export interface StartTrackingRequest {
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface UpdateLocationRequest {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface StopTrackingRequest {
  sessionId: string;
}

// Response data interfaces
export interface BusLocationResponse {
  id: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  lastUpdated: string;
  secondsSinceUpdate: number;
}

export interface ActiveBusesResponse {
  buses: BusLocationResponse[];
  total: number;
}

export interface TrackingSessionResponse {
  sessionId: string;
  busNumber: string;
  trackerId: string;
  isActive: boolean;
  startedAt: string;
  expiresAt: string;
}

// Error codes
export enum ErrorCodes {
  // Validation errors
  INVALID_BUS_NUMBER = 'INVALID_BUS_NUMBER',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  INVALID_SESSION_ID = 'INVALID_SESSION_ID',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  
  // Business logic errors
  BUS_ALREADY_TRACKED = 'BUS_ALREADY_TRACKED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  BUS_NOT_FOUND = 'BUS_NOT_FOUND',
  
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  DATABASE_HEALTH_CHECK_FAILED = 'DATABASE_HEALTH_CHECK_FAILED'
}