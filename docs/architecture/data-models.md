# Data Models

## BusSession

**Purpose:** Represents an active tracking session where a student is sharing their location for a specific bus. This is the core entity that enables the single-tracker-per-bus logic.

**Key Attributes:**
- id: string - Unique session identifier  
- busNumber: string - Bus identifier (e.g., "12", "A1")
- trackerId: string - Anonymous tracker identifier (no personal data)
- latitude: number - Current GPS latitude
- longitude: number - Current GPS longitude  
- isActive: boolean - Whether session is currently active
- lastUpdated: Date - Timestamp of last location update
- expiresAt: Date - Auto-cleanup timestamp (24 hours)

### TypeScript Interface
```typescript
interface BusSession {
  id: string;
  busNumber: string;
  trackerId: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lastUpdated: Date;
  expiresAt: Date;
}
```

### Relationships
- One-to-one with active tracker per bus number
- No user relationships (privacy-first design)

## LocationUpdate

**Purpose:** Real-time location data transmitted via WebSocket for live tracking updates. Ephemeral data that's not persisted to database.

### TypeScript Interface
```typescript
interface LocationUpdate {
  busNumber: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  sessionId: string;
}
```

## TrackingRequest

**Purpose:** Consumer request to track a specific bus. Used for validation and managing consumer connections to specific bus channels.

### TypeScript Interface
```typescript
interface TrackingRequest {
  busNumber: string;
  consumerId: string;
  requestedAt: Date;
  socketId: string;
}
```
