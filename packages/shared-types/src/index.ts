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
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  lastUpdated: Date;
  isActive: boolean;
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

// Session Management Types for Story 3.2
export interface SessionState {
  id: string | null;
  busNumber: string | null;
  isActive: boolean;
  isPaused: boolean;
  status: 'idle' | 'starting' | 'active' | 'paused' | 'ending' | 'timeout';
  startTime: Date | null;
  lastActivity: Date | null;
  transmissionCount: number;
  lastTransmissionTime: Date | null;
  persistedData: SessionPersistedData | null;
}

export interface BatteryOptimizationState {
  isOptimized: boolean;
  currentUsage: number; // percentage per hour
  warningThreshold: number; // percentage threshold
  recommendationsShown: boolean;
  lowBatteryMode: boolean;
  lastBatteryCheck: Date | null;
}

export interface SessionPersistedData {
  sessionId: string;
  busNumber: string;
  startTime: Date;
  isActive: boolean;
  isPaused: boolean;
  lastLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  } | null;
  transmissionCount: number;
}

export interface SessionHeartbeat {
  sessionId: string;
  timestamp: Date;
  batteryLevel?: number;
  networkStatus: string;
}

// Performance Optimization Types for Story 3.3
export interface PerformanceState {
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel: number;
  networkSpeed: number;
  renderFPS: number;
  appLaunchTime: number;
  isPerformanceModeEnabled: boolean;
}

export interface MemoryState {
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  memoryWarningLevel: 'low' | 'medium' | 'high' | 'critical';
  lastMemoryCleanup: Date | null;
  cacheSize: number;
}

export interface DataUsageState {
  bytesTransmitted: number;
  bytesReceived: number;
  isDataSaverEnabled: boolean;
  networkType: 'wifi' | 'cellular' | 'unknown';
  compressionEnabled: boolean;
  lastDataReset: Date;
}

export interface CompressedLocationUpdate {
  b: string;  // busNumber (shortened key)
  lat: number;
  lng: number;
  acc: number; // accuracy
  ts: number;  // timestamp
  sid: string; // sessionId
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  category: 'memory' | 'battery' | 'network' | 'rendering' | 'startup';
}

export interface LocationUpdateConfig {
  highAccuracyInterval: number;    // 10 seconds
  balancedInterval: number;        // 30 seconds  
  backgroundInterval: number;      // 60 seconds
  distanceFilter: number;          // meters
  enableHighAccuracy: boolean;
  timeout: number;                 // 15 seconds
}

// Session Storage Keys
export const SESSION_STORAGE_KEYS = {
  ACTIVE_SESSION: 'active_tracking_session',
  SESSION_HISTORY: 'session_history_log',
  BATTERY_SETTINGS: 'battery_optimization_settings',
  TIMEOUT_PREFERENCES: 'session_timeout_preferences'
} as const;