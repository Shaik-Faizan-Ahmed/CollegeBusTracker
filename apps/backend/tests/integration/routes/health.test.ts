import request from 'supertest';
import express from 'express';
import healthRoute from '../../../src/routes/health';

describe('Health Route', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoute);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      
      const { data } = response.body;
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('database');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/api/health');

      const timestamp = response.body.data.timestamp;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should return environment information', async () => {
      const response = await request(app)
        .get('/api/health');

      const { environment } = response.body.data;
      expect(['development', 'test', 'production']).toContain(environment);
    });
  });
});