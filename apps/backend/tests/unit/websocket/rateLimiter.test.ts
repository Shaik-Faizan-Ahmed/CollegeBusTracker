import { WebSocketRateLimiter } from '../../../src/websocket/middleware/rateLimiter';

describe('WebSocketRateLimiter', () => {
  let rateLimiter: WebSocketRateLimiter;

  beforeEach(() => {
    rateLimiter = new WebSocketRateLimiter({
      windowMs: 1000, // 1 second window for testing
      maxRequests: 3,
      blockDurationMs: 2000 // 2 seconds block
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', () => {
      const result1 = rateLimiter.isAllowed('socket-123');
      const result2 = rateLimiter.isAllowed('socket-123');
      const result3 = rateLimiter.isAllowed('socket-123');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Use up the limit
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');

      // This should be blocked
      const result = rateLimiter.isAllowed('socket-123');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Rate limit exceeded');
    });

    it('should allow requests after block expires', (done) => {
      // Use up the limit
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');

      // This should trigger the block
      const blockedResult = rateLimiter.isAllowed('socket-123');
      expect(blockedResult.allowed).toBe(false);

      // Wait for block to expire (2 seconds)
      setTimeout(() => {
        const allowedResult = rateLimiter.isAllowed('socket-123');
        expect(allowedResult.allowed).toBe(true);
        done();
      }, 2100); // Wait for block duration + buffer
    }, 5000); // Increase test timeout

    it('should track different clients separately', () => {
      // Use up limit for socket-123
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');

      // socket-456 should still be allowed
      const result = rateLimiter.isAllowed('socket-456');
      expect(result.allowed).toBe(true);
    });

    it('should clean up clients', () => {
      rateLimiter.isAllowed('socket-123');
      
      expect(rateLimiter.getStats().totalClients).toBe(1);
      
      rateLimiter.removeClient('socket-123');
      
      // Note: cleanup happens asynchronously, but removeClient is immediate
      const stats = rateLimiter.getStats();
      expect(stats.totalClients).toBe(0);
    });

    it('should provide stats', () => {
      // Add some requests
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-456');

      // Block one client
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123');
      rateLimiter.isAllowed('socket-123'); // This should block

      const stats = rateLimiter.getStats();
      expect(stats.totalClients).toBe(2);
      expect(stats.blockedClients).toBe(1);
    });
  });
});