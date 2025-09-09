// CVR Bus Tracker - Shared Types
// All types shared between frontend and backend

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface BusSession {
  id: string;
  busNumber: string;
  trackerId: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lastUpdated: Date;
  expiresAt: Date;
}

export interface LocationUpdate {
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  sessionId: string;
}

export interface TrackingRequest {
  busNumber: string;
  consumerId: string;
  requestedAt: Date;
  socketId: string;
}

export interface TrackingSession {
  sessionId: string;
  busNumber: string;
  trackerId: string;
  startedAt: Date;
  isActive: boolean;
}

// Database constraints and validation
export interface BusSessionConstraints {
  busNumber: {
    minLength: 1;
    maxLength: 10;
    pattern: RegExp; // Alphanumeric
  };
  trackerId: {
    minLength: 1;
    maxLength: 50;
  };
  latitude: {
    min: -90;
    max: 90;
  };
  longitude: {
    min: -180;
    max: 180;
  };
  accuracy: {
    min: 0;
  };
}

export const BUS_SESSION_CONSTRAINTS: BusSessionConstraints = {
  busNumber: {
    minLength: 1,
    maxLength: 10,
    pattern: /^[A-Za-z0-9]+$/
  },
  trackerId: {
    minLength: 1,
    maxLength: 50
  },
  latitude: {
    min: -90,
    max: 90
  },
  longitude: {
    min: -180,
    max: 180
  },
  accuracy: {
    min: 0
  }
};

// API Response Types
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface LocationUpdateEvent extends WebSocketEvent {
  type: 'location_update';
  payload: LocationUpdate;
}

export interface BusSessionEvent extends WebSocketEvent {
  type: 'bus_session_update';
  payload: BusSession;
}

// Bus Validation Types
export interface BusValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

export interface BusNumberFormats {
  numeric: {
    min: number;
    max: number;
  };
  alphanumeric: {
    routes: string[];
    maxNumbers: { [key: string]: number };
  };
}

export const CVR_BUS_FORMATS: BusNumberFormats = {
  numeric: {
    min: 1,
    max: 50,
  },
  alphanumeric: {
    routes: ['A', 'B', 'C'],
    maxNumbers: {
      'A': 20,
      'B': 20,
      'C': 10,
    },
  },
};

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  TrackBus: { busNumber?: string };
  BecomeTracker: { busNumber?: string };
  BusSelector: { mode: 'track' | 'tracker' };
  Map: { busNumber: string; initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } };
};

export type ScreenNames = keyof RootStackParamList;

// Consumer Tracking Types
export interface BusLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface ConsumerTrackingState {
  busNumber: string;
  busLocation: BusLocation | null;
  lastUpdated: Date;
  isTrackerActive: boolean;
  wsConnected: boolean;
}

// WebSocket Communication Types for Story 2.4
export interface WebSocketConnection {
  socketId: string;
  type: 'tracker' | 'consumer';
  busNumber: string;
  sessionId?: string;
  connectedAt: Date;
  lastActivity: Date;
}

export interface BusRoom {
  busNumber: string;
  trackerId?: string;
  consumerCount: number;
  lastUpdate: Date;
  isActive: boolean;
}