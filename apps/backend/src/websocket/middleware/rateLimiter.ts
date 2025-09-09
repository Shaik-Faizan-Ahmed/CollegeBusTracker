import { Socket } from 'socket.io';

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  blockDurationMs: number; // How long to block after limit exceeded
}

interface ClientState {
  requests: number[];
  blockedUntil?: number;
}

export class WebSocketRateLimiter {
  private clients: Map<string, ClientState> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public isAllowed(socketId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    let clientState = this.clients.get(socketId);

    if (!clientState) {
      clientState = { requests: [] };
      this.clients.set(socketId, clientState);
    }

    // Check if client is currently blocked
    if (clientState.blockedUntil && now < clientState.blockedUntil) {
      return {
        allowed: false,
        reason: `Rate limited. Try again in ${Math.ceil((clientState.blockedUntil - now) / 1000)}s`
      };
    }

    // Clear expired block
    if (clientState.blockedUntil && now >= clientState.blockedUntil) {
      delete clientState.blockedUntil;
      clientState.requests = []; // Reset request counter after block expires
    }

    // Remove old requests outside the time window
    const windowStart = now - this.config.windowMs;
    clientState.requests = clientState.requests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (clientState.requests.length >= this.config.maxRequests) {
      clientState.blockedUntil = now + this.config.blockDurationMs;
      return {
        allowed: false,
        reason: `Rate limit exceeded. Blocked for ${this.config.blockDurationMs / 1000}s`
      };
    }

    // Add current request
    clientState.requests.push(now);
    return { allowed: true };
  }

  public removeClient(socketId: string): void {
    this.clients.delete(socketId);
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    this.clients.forEach((clientState, socketId) => {
      // Remove expired blocks
      if (clientState.blockedUntil && now >= clientState.blockedUntil) {
        delete clientState.blockedUntil;
      }

      // Remove old requests
      clientState.requests = clientState.requests.filter(time => time > windowStart);

      // Remove clients with no recent activity
      if (clientState.requests.length === 0 && !clientState.blockedUntil) {
        this.clients.delete(socketId);
      }
    });
  }

  public getStats() {
    return {
      totalClients: this.clients.size,
      blockedClients: Array.from(this.clients.values()).filter(s => s.blockedUntil).length
    };
  }
}

// Middleware function for rate limiting WebSocket events
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const rateLimiter = new WebSocketRateLimiter(config);

  return (socket: Socket, next: (err?: Error) => void) => {
    // Store rate limiter instance on socket for use in handlers
    (socket as any).rateLimiter = rateLimiter;

    // Clean up when socket disconnects
    socket.on('disconnect', () => {
      rateLimiter.removeClient(socket.id);
    });

    next();
  };
};

// Rate limit check for high-frequency events like location updates
export const checkRateLimit = (socket: Socket, eventType: string = 'general'): { allowed: boolean; reason?: string } => {
  const rateLimiter = (socket as any).rateLimiter as WebSocketRateLimiter;
  
  if (!rateLimiter) {
    // If no rate limiter configured, allow all requests
    return { allowed: true };
  }

  const result = rateLimiter.isAllowed(`${socket.id}-${eventType}`);
  
  if (!result.allowed) {
    console.warn(`Rate limit exceeded for socket ${socket.id} on event ${eventType}: ${result.reason}`);
  }

  return result;
};