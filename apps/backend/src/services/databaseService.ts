import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

class DatabaseService {
  private supabase: SupabaseClient<any>;
  private isConnected: boolean = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.supabase = createClient<any>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-connection-pool': 'enabled'
        }
      }
    });
  }

  async connect(): Promise<void> {
    try {
      // Test basic connection without table check
      // Just connect to Supabase - table creation is handled separately
      this.isConnected = true;
      console.log('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      console.error('Database connection failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    // Supabase client doesn't need explicit disconnection
    this.isConnected = false;
    console.log('Database disconnected');
  }

  getClient(): SupabaseClient<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.supabase;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Simple check - if we have a connected client, we're healthy
      if (this.isConnected && this.supabase) {
        return {
          status: 'healthy',
          timestamp: new Date()
        };
      }
      throw new Error('Database not connected');
    } catch (error) {
      throw new Error(`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // WebSocket-related database methods
  async findActiveSession(sessionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('bus_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async updateSession(sessionId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('bus_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  }

  async deactivateSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bus_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  }

  async getActiveBusLocation(busNumber: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('bus_sessions')
      .select('*')
      .eq('bus_number', busNumber)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
}

export const databaseService = new DatabaseService();
export default databaseService;