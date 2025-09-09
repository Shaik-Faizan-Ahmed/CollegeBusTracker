import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { LocationUpdate } from '@cvr-bus-tracker/shared-types';
import { websocketService } from '../services/websocketService';

interface ConsumerWebSocketHooks {
  connect: (busNumber: string) => void;
  disconnect: () => void;
  isConnected: boolean;
}

interface ConsumerWebSocketCallbacks {
  onLocationUpdate?: (data: LocationUpdate) => void;
  onTrackerDisconnected?: (data: { busNumber: string; reason: string }) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useConsumerWebSocket = (
  callbacks: ConsumerWebSocketCallbacks
): ConsumerWebSocketHooks => {
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const currentBusNumber = useRef<string | null>(null);

  const handleLocationUpdate = useCallback((data: LocationUpdate) => {
    callbacks.onLocationUpdate?.(data);
  }, [callbacks.onLocationUpdate]);

  const handleTrackerDisconnected = useCallback((data: { busNumber: string; reason: string }) => {
    callbacks.onTrackerDisconnected?.(data);
  }, [callbacks.onTrackerDisconnected]);

  const handleConnect = useCallback(() => {
    isConnectedRef.current = true;
    callbacks.onConnectionChange?.(true);
  }, [callbacks.onConnectionChange]);

  const handleDisconnect = useCallback(() => {
    isConnectedRef.current = false;
    callbacks.onConnectionChange?.(false);
  }, [callbacks.onConnectionChange]);

  const connect = useCallback((busNumber: string) => {
    if (socketRef.current && currentBusNumber.current === busNumber) {
      return; // Already connected to this bus
    }

    disconnect(); // Disconnect from previous bus if any

    const socket = websocketService.connect();
    socketRef.current = socket;
    currentBusNumber.current = busNumber;

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('location-updated', handleLocationUpdate);
    socket.on('tracker-disconnected', handleTrackerDisconnected);

    // Join bus-specific room for location updates
    socket.emit('join-bus-room', { busNumber });
  }, [handleConnect, handleDisconnect, handleLocationUpdate, handleTrackerDisconnected]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    currentBusNumber.current = null;
    isConnectedRef.current = false;
    callbacks.onConnectionChange?.(false);
  }, [callbacks.onConnectionChange]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected: isConnectedRef.current,
  };
};