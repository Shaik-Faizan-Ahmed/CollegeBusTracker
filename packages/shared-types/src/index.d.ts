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
export interface BusSessionConstraints {
    busNumber: {
        minLength: 1;
        maxLength: 10;
        pattern: RegExp;
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
export declare const BUS_SESSION_CONSTRAINTS: BusSessionConstraints;
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
export type RootStackParamList = {
    Home: undefined;
    TrackBus: undefined;
    BecomeTracker: undefined;
};
export type ScreenNames = keyof RootStackParamList;
//# sourceMappingURL=index.d.ts.map