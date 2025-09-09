import { BusSession, LocationUpdate } from '@cvr-bus-tracker/shared-types';
import { Database } from '../types/database';
import databaseService from './databaseService';
import cacheService from './cacheService';
import { v4 as uuidv4 } from 'uuid';

export class TrackingService {
  async createBusSession(busNumber: string, trackerId: string, latitude: number, longitude: number, accuracy: number = 10.0): Promise<BusSession> {
    const client = databaseService.getClient();
    
    // Check if there's already an active session for this bus
    const { data: existingSessions } = await client
      .from('bus_sessions')
      .select('*')
      .eq('bus_number', busNumber)
      .eq('is_active', true);

    if (existingSessions && existingSessions.length > 0) {
      throw new Error(`Bus ${busNumber} is already being tracked`);
    }

    const sessionData: Database['public']['Tables']['bus_sessions']['Insert'] = {
      id: uuidv4(),
      bus_number: busNumber,
      tracker_id: trackerId,
      latitude,
      longitude,
      accuracy,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const { data, error } = await client
      .from('bus_sessions')
      .insert([sessionData] as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bus session: ${error.message}`);
    }

    const busSession: BusSession = {
      id: (data as any).id,
      busNumber: (data as any).bus_number,
      trackerId: (data as any).tracker_id,
      latitude: (data as any).latitude,
      longitude: (data as any).longitude,
      isActive: (data as any).is_active,
      lastUpdated: new Date((data as any).updated_at),
      expiresAt: new Date((data as any).expires_at)
    };

    // Cache the session and bus location
    cacheService.setSession(busSession.id, busSession);
    cacheService.setBusLocation(busSession.busNumber, busSession);
    cacheService.invalidateBusData(); // Invalidate active buses cache

    return busSession;
  }

  async updateBusLocation(sessionId: string, latitude: number, longitude: number, accuracy: number = 10.0): Promise<boolean> {
    const client = databaseService.getClient();

    const updateData: Database['public']['Tables']['bus_sessions']['Update'] = {
      latitude,
      longitude,
      accuracy,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('bus_sessions')
      .update(updateData as any)
      .eq('id', sessionId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update bus location: ${error.message}`);
    }

    // Invalidate cache for this session's bus
    if (data) {
      cacheService.invalidateBusData((data as any).bus_number);
      cacheService.invalidateSessionData(sessionId);
    }

    return !!data;
  }

  async stopBusSession(sessionId: string): Promise<boolean> {
    const client = databaseService.getClient();

    const updateData: Database['public']['Tables']['bus_sessions']['Update'] = {
      is_active: false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('bus_sessions')
      .update(updateData as any)
      .eq('id', sessionId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to stop bus session: ${error.message}`);
    }

    // Invalidate cache for this session's bus
    if (data) {
      cacheService.invalidateBusData((data as any).bus_number);
      cacheService.invalidateSessionData(sessionId);
    }

    return !!data;
  }

  async getBusLocation(busNumber: string): Promise<BusSession | null> {
    // Check cache first
    const cached = cacheService.getBusLocation(busNumber);
    if (cached) {
      return cached;
    }

    const client = databaseService.getClient();

    const { data, error } = await client
      .from('bus_sessions')
      .select('*')
      .eq('bus_number', busNumber)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to get bus location: ${error.message}`);
    }

    const busSession: BusSession = {
      id: (data as any).id,
      busNumber: (data as any).bus_number,
      trackerId: (data as any).tracker_id,
      latitude: (data as any).latitude,
      longitude: (data as any).longitude,
      isActive: (data as any).is_active,
      lastUpdated: new Date((data as any).updated_at),
      expiresAt: new Date((data as any).expires_at)
    };

    // Cache the result
    cacheService.setBusLocation(busNumber, busSession);

    return busSession;
  }

  async getActiveBuses(): Promise<BusSession[]> {
    // Check cache first
    const cached = cacheService.getActiveBuses();
    if (cached) {
      return cached;
    }

    const client = databaseService.getClient();

    const { data, error } = await client
      .from('bus_sessions')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get active buses: ${error.message}`);
    }

    const activeBuses = (data || []).map((session: any) => ({
      id: session.id,
      busNumber: session.bus_number,
      trackerId: session.tracker_id,
      latitude: session.latitude,
      longitude: session.longitude,
      isActive: session.is_active,
      lastUpdated: new Date(session.updated_at),
      expiresAt: new Date(session.expires_at)
    }));

    // Cache the result
    cacheService.setActiveBuses(activeBuses);

    return activeBuses;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const client = databaseService.getClient();

    const updateData: Database['public']['Tables']['bus_sessions']['Update'] = {
      is_active: false
    };

    const { data, error } = await client
      .from('bus_sessions')
      .update(updateData as any)
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select();

    if (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
    }

    return data?.length || 0;
  }
}

export const trackingService = new TrackingService();
export default trackingService;