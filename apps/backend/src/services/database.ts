import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConfig, validateDatabaseConfig } from '@cvr-bus-tracker/config';

class DatabaseService {
  private supabase: SupabaseClient;
  private static instance: DatabaseService;

  private constructor() {
    const config: DatabaseConfig = this.loadDatabaseConfig();

    if (!validateDatabaseConfig(config)) {
      throw new Error('Supabase configuration is missing. Please check environment variables.');
    }

    this.supabase = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      // Create a simple test by checking if we can query the auth users (empty result is fine)
      const { error } = await this.supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      
      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }

  /**
   * Load database configuration from environment through config objects
   */
  private loadDatabaseConfig(): DatabaseConfig {
    return {
      url: process.env.SUPABASE_URL || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    };
  }

  /**
   * Health check for database
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string; error?: string }> {
    try {
      const isConnected = await this.testConnection();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        ...(isConnected ? {} : { error: 'Database connection failed' })
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }
}

export default DatabaseService;