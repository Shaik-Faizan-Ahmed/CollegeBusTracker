// Local types to avoid workspace dependency issues in production
export interface LocationUpdate {
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface WebSocketConnection {
  id: string;
  userId: string;
  type: 'tracker' | 'consumer';
  busNumber?: string;
  sessionId?: string;
}

export interface BusRoom {
  busNumber: string;
  trackerId?: string;
  consumers: Set<string>;
  lastUpdate?: LocationUpdate;
}

// WebSocket Event Payload Types
export interface LocationUpdatePayload extends LocationUpdate {
  sessionId: string;
}

export interface JoinBusRoomPayload {
  busNumber: string;
  consumerId: string;
}

export interface LeaveBusRoomPayload {
  busNumber: string;
  consumerId: string;
}

export interface TrackerDisconnectedPayload {
  busNumber: string;
  reason: 'session_ended' | 'connection_lost';
  timestamp: number;
}

export interface LocationBroadcastPayload {
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// WebSocket Connection Validation
export interface ConnectionValidation {
  isValid: boolean;
  error?: string;
  connection?: WebSocketConnection;
}

// Room Management Types
export interface RoomState extends BusRoom {
  consumers: Set<string>;
  tracker?: {
    socketId: string;
    sessionId: string;
  };
}

export interface RoomOperationResult {
  success: boolean;
  error?: string;
  room?: RoomState;
}