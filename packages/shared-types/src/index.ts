// CVR Bus Tracker - Shared Types
// All types shared between frontend and backend

export interface BusSession {
  id: string;
  busNumber: string;
  trackerUserId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationUpdate {
  id: string;
  busSessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  createdAt: Date;
}

export interface TrackingRequest {
  id: string;
  studentId: string;
  busNumber: string;
  requestedAt: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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