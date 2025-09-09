// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ error: null, data: [] })
    })
  }),
  rpc: jest.fn().mockResolvedValue({ error: null })
};

const mockCreateClient = jest.fn().mockReturnValue(mockSupabaseClient);

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key'
  };
  jest.clearAllMocks();
  
  // Reset mock behavior
  mockSupabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({ error: null, data: [] })
    })
  });
});

afterEach(() => {
  process.env = originalEnv;
});

describe('DatabaseService', () => {

  describe('initialization', () => {
    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      jest.resetModules();
      
      expect(() => {
        require('../../../src/services/databaseService');
      }).toThrow('Missing Supabase configuration');
    });

    it('should throw error when SUPABASE_ANON_KEY is missing', () => {
      delete process.env.SUPABASE_ANON_KEY;
      jest.resetModules();
      
      expect(() => {
        require('../../../src/services/databaseService');
      }).toThrow('Missing Supabase configuration');
    });

    it('should create client with correct configuration', () => {
      jest.resetModules();
      require('../../../src/services/databaseService');
      
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: { persistSession: false },
          db: { schema: 'public' },
          global: expect.objectContaining({
            headers: expect.objectContaining({
              'x-connection-pool': 'enabled'
            })
          })
        })
      );
    });
  });

  describe('connect', () => {
    it('should successfully connect to database', async () => {
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      await expect(databaseService.connect()).resolves.toBeUndefined();
      expect(databaseService.isConnectionActive()).toBe(true);
    });

    it('should handle table not exists error gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            error: { message: 'relation "bus_sessions" does not exist' }
          })
        })
      });
      
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      await expect(databaseService.connect()).resolves.toBeUndefined();
      expect(databaseService.isConnectionActive()).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            error: { message: 'Connection failed' }
          })
        })
      });
      
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      await expect(databaseService.connect()).rejects.toThrow('Database connection failed');
      expect(databaseService.isConnectionActive()).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      const result = await databaseService.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle health check failure', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ 
            error: { message: 'Health check failed' }
          })
        })
      });
      
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      await expect(databaseService.healthCheck()).rejects.toThrow('Database health check failed');
    });
  });

  describe('getClient', () => {
    it('should return client when connected', async () => {
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      await databaseService.connect();
      
      const client = databaseService.getClient();
      expect(client).toBe(mockSupabaseClient);
    });

    it('should throw error when not connected', () => {
      jest.resetModules();
      const databaseService = require('../../../src/services/databaseService').default;
      
      expect(() => databaseService.getClient()).toThrow('Database not connected');
    });
  });
});