import DatabaseService from '../../../src/services/database';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeAll(() => {
    databaseService = DatabaseService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getClient', () => {
    it('should return supabase client', () => {
      const client = databaseService.getClient();
      
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });
  });

  describe('healthCheck', () => {
    it('should return health status object', async () => {
      const health = await databaseService.healthCheck();
      
      expect(health).toBeDefined();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });
  });
});