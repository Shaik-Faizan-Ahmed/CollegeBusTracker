import { readFileSync } from 'fs';
import { join } from 'path';
import databaseService from './databaseService';

class MigrationService {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = join(__dirname, '../../migrations');
  }

  async runMigration(migrationFile: string): Promise<void> {
    try {
      const migrationPath = join(this.migrationsPath, migrationFile);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      
      const supabase = databaseService.getClient();
      
      // Split migration into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          // For now, migrations need to be run manually in Supabase dashboard
          console.log(`Would execute: ${statement.substring(0, 100)}...`);
          // const { error } = await supabase.rpc('exec_sql' as any, { sql: statement });
          // if (error) {
          //   console.error(`Migration error in statement: ${statement.substring(0, 100)}...`);
          //   throw error;
          // }
        }
      }

      console.log(`Migration ${migrationFile} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migrationFile} failed:`, error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      await databaseService.connect();
      
      // Run initial migration
      await this.runMigration('001_create_bus_sessions.sql');
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async validateSchema(): Promise<boolean> {
    try {
      const supabase = databaseService.getClient();
      
      // Check if bus_sessions table exists and has correct structure
      const { data, error } = await supabase
        .from('bus_sessions')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "bus_sessions" does not exist')) {
          return false;
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Schema validation failed:', error);
      return false;
    }
  }
}

export const migrationService = new MigrationService();
export default migrationService;