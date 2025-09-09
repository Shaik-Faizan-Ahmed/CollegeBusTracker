import { Socket } from 'socket.io';
import { databaseService } from '../../services/databaseService';

export const validateLocationUpdate = (data: any): { isValid: boolean; error?: string } => {
  const { busNumber, latitude, longitude, accuracy, timestamp, sessionId } = data;

  // Required fields validation
  if (!busNumber || !sessionId) {
    return { isValid: false, error: 'Bus number and session ID are required' };
  }

  // Location coordinate validation
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Invalid latitude. Must be between -90 and 90' };
  }

  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Invalid longitude. Must be between -180 and 180' };
  }

  // GPS accuracy validation (minimum 100m accuracy threshold)
  if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
    return { isValid: false, error: 'Invalid accuracy. Must be between 0 and 100 meters' };
  }

  // Timestamp validation
  if (typeof timestamp !== 'number' || timestamp <= 0) {
    return { isValid: false, error: 'Invalid timestamp' };
  }

  // Check if timestamp is not too old (5 minutes threshold)
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  if (timestamp < fiveMinutesAgo) {
    return { isValid: false, error: 'Location update timestamp is too old' };
  }

  return { isValid: true };
};

export const validateBusRoomData = (data: any): { isValid: boolean; error?: string } => {
  const { busNumber, consumerId } = data;

  if (!busNumber || typeof busNumber !== 'string') {
    return { isValid: false, error: 'Bus number is required' };
  }

  if (!consumerId || typeof consumerId !== 'string') {
    return { isValid: false, error: 'Consumer ID is required' };
  }

  // Bus number format validation
  const busPattern = /^([1-9]|[1-4][0-9]|50|A[1-9]|A1[0-9]|A20|B[1-9]|B1[0-9]|B20|C[1-9]|C10)$/;
  if (!busPattern.test(busNumber.trim())) {
    return { isValid: false, error: 'Invalid bus number format' };
  }

  return { isValid: true };
};

export const checkSessionActive = async (sessionId: string): Promise<boolean> => {
  try {
    const session = await databaseService.findActiveSession(sessionId);
    return session && session.is_active;
  } catch (error) {
    console.error('Session check error:', error);
    return false;
  }
};