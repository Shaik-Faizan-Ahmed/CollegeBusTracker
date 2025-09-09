import NodeCache from 'node-cache';
import { BusSession } from '@cvr-bus-tracker/shared-types';

interface CacheOptions {
  ttlSeconds?: number;
  checkPeriodSeconds?: number;
}

class CacheService {
  private cache: NodeCache;
  
  // Cache TTL values in seconds
  private static readonly BUS_LOCATION_TTL = 30; // 30 seconds for bus locations
  private static readonly ACTIVE_BUSES_TTL = 15; // 15 seconds for active buses list
  private static readonly SESSION_TTL = 300; // 5 minutes for session data

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttlSeconds || 60, // Default TTL: 1 minute
      checkperiod: options.checkPeriodSeconds || 120, // Check for expired keys every 2 minutes
      useClones: false // For performance, don't clone objects
    });

    // Listen for cache events
    this.cache.on('expired', (key, value) => {
      console.log(`Cache key expired: ${key}`);
    });

    this.cache.on('set', (key, value) => {
      console.log(`Cache key set: ${key}`);
    });
  }

  // Generic cache methods
  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    return this.cache.set(key, value, ttlSeconds || 0);
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  keys(): string[] {
    return this.cache.keys();
  }

  getStats() {
    return this.cache.getStats();
  }

  // Domain-specific cache methods
  setBusLocation(busNumber: string, busSession: BusSession): boolean {
    const key = `bus_location:${busNumber}`;
    return this.set(key, busSession, CacheService.BUS_LOCATION_TTL);
  }

  getBusLocation(busNumber: string): BusSession | undefined {
    const key = `bus_location:${busNumber}`;
    return this.get<BusSession>(key);
  }

  deleteBusLocation(busNumber: string): number {
    const key = `bus_location:${busNumber}`;
    return this.del(key);
  }

  setActiveBuses(buses: BusSession[]): boolean {
    const key = 'active_buses';
    return this.set(key, buses, CacheService.ACTIVE_BUSES_TTL);
  }

  getActiveBuses(): BusSession[] | undefined {
    const key = 'active_buses';
    return this.get<BusSession[]>(key);
  }

  deleteActiveBuses(): number {
    const key = 'active_buses';
    return this.del(key);
  }

  setSession(sessionId: string, session: BusSession): boolean {
    const key = `session:${sessionId}`;
    return this.set(key, session, CacheService.SESSION_TTL);
  }

  getSession(sessionId: string): BusSession | undefined {
    const key = `session:${sessionId}`;
    return this.get<BusSession>(key);
  }

  deleteSession(sessionId: string): number {
    const key = `session:${sessionId}`;
    return this.del(key);
  }

  // Cache invalidation methods
  invalidateBusData(busNumber?: string): void {
    if (busNumber) {
      this.deleteBusLocation(busNumber);
    }
    this.deleteActiveBuses(); // Always invalidate active buses when any bus data changes
  }

  invalidateSessionData(sessionId: string): void {
    this.deleteSession(sessionId);
  }

  // Health check method
  healthCheck(): { status: string; stats: NodeCache.Stats } {
    const stats = this.getStats();
    return {
      status: 'healthy',
      stats
    };
  }
}

export const cacheService = new CacheService({
  ttlSeconds: 60, // Default 1 minute
  checkPeriodSeconds: 120 // Check every 2 minutes
});

export default cacheService;