import { Socket } from 'socket.io';
import { databaseService } from '../../services/databaseService';
import { ConnectionValidation } from '../../types/websocket';

export const validateWebSocketSession = async (
  socket: Socket,
  sessionData: any
): Promise<boolean> => {
  const { sessionId, type } = sessionData;
  
  if (type === 'tracker') {
    try {
      const session = await databaseService.findActiveSession(sessionId);
      return session && session.is_active;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }
  
  // Consumers don't require session validation
  return type === 'consumer';
};

export const validateConnection = (
  socket: Socket,
  data: any
): ConnectionValidation => {
  const { type, busNumber, sessionId, consumerId } = data;

  // Validate connection type
  if (!type || !['tracker', 'consumer'].includes(type)) {
    return {
      isValid: false,
      error: 'Invalid connection type. Must be "tracker" or "consumer"'
    };
  }

  // Validate bus number format
  if (!busNumber || typeof busNumber !== 'string' || busNumber.trim().length === 0) {
    return {
      isValid: false,
      error: 'Bus number is required'
    };
  }

  // Validate bus number pattern (1-50, A1-A20, B1-B20, C1-C10)
  const busPattern = /^([1-9]|[1-4][0-9]|50|A[1-9]|A1[0-9]|A20|B[1-9]|B1[0-9]|B20|C[1-9]|C10)$/;
  if (!busPattern.test(busNumber.trim())) {
    return {
      isValid: false,
      error: 'Invalid bus number format'
    };
  }

  // Additional validation for trackers
  if (type === 'tracker' && (!sessionId || typeof sessionId !== 'string')) {
    return {
      isValid: false,
      error: 'Session ID is required for tracker connections'
    };
  }

  // Additional validation for consumers
  if (type === 'consumer' && (!consumerId || typeof consumerId !== 'string')) {
    return {
      isValid: false,
      error: 'Consumer ID is required for consumer connections'
    };
  }

  const connection = {
    socketId: socket.id,
    type: type as 'tracker' | 'consumer',
    busNumber: busNumber.trim(),
    sessionId: type === 'tracker' ? sessionId : undefined,
    connectedAt: new Date(),
    lastActivity: new Date()
  };

  return {
    isValid: true,
    connection
  };
};