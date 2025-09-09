import { LocationUpdate, WebSocketConnection, BusRoom } from '@cvr-bus-tracker/shared-types';

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