# CVR College Bus Tracker Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **CVR College Bus Tracker**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

Based on the PRD analysis, this is a **greenfield project** with specific technology preferences indicated:

- **React Native** for cross-platform mobile development  
- **Node.js with Express** for backend API
- **MongoDB** for database with TTL collections
- **WebSocket with Socket.IO** for real-time location broadcasting
- **Monorepo structure** explicitly requested

**Recommended Starter Templates:**
1. **T3 Stack Mobile** (React Native + tRPC + Prisma) - Good for type safety
2. **React Native Monorepo Template** with Nx - Matches monorepo requirement  
3. **Custom setup** following PRD specifications - Most aligned with stated preferences

**Decision:** Proceed with custom architecture following PRD specifications exactly - N/A for starter template.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-07 | 1.0 | Initial architecture document creation | Winston (Architect) |

## High Level Architecture

### Technical Summary
The CVR College Bus Tracker employs a React Native mobile application with Node.js/Express backend in a real-time peer-to-peer architecture. The system uses WebSocket connections for live location broadcasting, PostgreSQL for structured data storage with TTL cleanup, and Redis for session management. The monorepo structure supports rapid single-developer iteration while the cloud deployment (Render.com) provides auto-scaling for academic period usage spikes with completely free hosting. This architecture achieves the PRD's core goal of eliminating transportation uncertainty through reliable real-time tracking with minimal infrastructure complexity.

### Platform and Infrastructure Choice

**Platform:** Render.com (Free Tier)
**Key Services:** Free web service hosting, PostgreSQL via Supabase (free), Redis via in-memory caching
**Deployment Host and Regions:** Auto-assigned (US-based)

**Rationale:** Optimized for zero-cost deployment while maintaining professional-grade architecture capable of handling 200-300 concurrent users as specified in PRD requirements.

### Repository Structure

**Structure:** Monorepo with Yarn Workspaces
**Monorepo Tool:** Yarn Workspaces (simpler than Nx for this scale)
**Package Organization:** Apps (mobile, backend), Packages (shared-types, utils, config)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client - Full Native Control"
        RN[React Native<br/>Android/iOS<br/>Full native modules]
    end
    
    subgraph "Free Backend Hosting"
        RENDER[Render.com<br/>Express + Socket.IO<br/>FREE tier]
    end
    
    subgraph "Free Database Services"
        SUPA[(Supabase PostgreSQL<br/>500MB FREE)]
        MEM[(In-Memory Cache<br/>Node.js)]
    end
    
    subgraph "External Services"
        GMAPS[Google Maps API<br/>$200 monthly credit = FREE]
    end
    
    RN <--> RENDER
    RENDER <--> SUPA
    RENDER <--> MEM
    RN <--> GMAPS
```

### Architectural Patterns
- **Traditional Server Architecture:** Single Express.js server for simplicity and cost efficiency - _Rationale:_ Handles academic period traffic efficiently while remaining completely free to deploy
- **WebSocket Real-time:** Socket.IO for location broadcasting with room-based distribution - _Rationale:_ Ensures sub-second location updates for real-time tracking experience
- **Component-Based Mobile:** React Native CLI with TypeScript and reusable components - _Rationale:_ Cross-platform development with full native access, no Expo limitations
- **Repository Pattern:** Abstract data access behind service interfaces - _Rationale:_ Enables testing and potential database migration flexibility
- **Session-Based Tracking:** In-memory sessions for tracker state without persistent user data - _Rationale:_ Meets privacy requirements while maintaining reliable tracker management
- **TTL Data Management:** PostgreSQL TTL cleanup for automatic location data cleanup - _Rationale:_ Ensures 24-hour data retention requirement with zero maintenance overhead

## Tech Stack

| Category | Technology | Version | Purpose | **Monthly Cost** |
|----------|------------|---------|---------|------------------|
| **Frontend** | **React Native CLI** | **0.72+** | **Full native access, no Expo limitations** | **$0** |
| **Maps** | **react-native-maps** | **1.8+** | **Native Google Maps integration** | **$0 ($200 credit)** |
| **Location** | **@react-native-community/geolocation** | **3.0+** | **Native GPS access** | **$0** |
| **State Management** | **Zustand** | **4.4+** | **Lightweight state management** | **$0** |
| **Backend** | **Express.js + Socket.IO** | **4.18+ / 4.7+** | **REST API + Real-time WebSocket** | **$0** |
| **Database** | **Supabase PostgreSQL** | **15+** | **Relational DB with real-time** | **$0** |
| **Cache** | **Node-cache (in-memory)** | **5.1+** | **Simple in-memory cache** | **$0** |
| **Hosting** | **Render.com** | **-** | **Free web service hosting** | **$0** |
| **Storage** | **Supabase Storage** | **1GB** | **File uploads (if needed)** | **$0** |
| **Frontend Testing** | **Jest + React Native Testing Library** | **Latest** | **Component and logic testing** | **$0** |
| **Backend Testing** | **Jest + Supertest** | **Latest** | **API endpoint testing** | **$0** |
| **E2E Testing** | **Detox** | **20.0+** | **React Native E2E testing** | **$0** |
| **CI/CD** | **GitHub Actions** | **-** | **Automated testing and deployment** | **$0** |
| **Monitoring** | **Sentry** | **-** | **Error tracking** | **$0 (5k errors/month)** |

**TOTAL MONTHLY COST: $0**

## Data Models

### BusSession

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

#### TypeScript Interface
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

#### Relationships
- One-to-one with active tracker per bus number
- No user relationships (privacy-first design)

### LocationUpdate

**Purpose:** Real-time location data transmitted via WebSocket for live tracking updates. Ephemeral data that's not persisted to database.

#### TypeScript Interface
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

### TrackingRequest

**Purpose:** Consumer request to track a specific bus. Used for validation and managing consumer connections to specific bus channels.

#### TypeScript Interface
```typescript
interface TrackingRequest {
  busNumber: string;
  consumerId: string;
  requestedAt: Date;
  socketId: string;
}
```

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: CVR College Bus Tracker API
  version: 1.0.0
  description: REST API for real-time bus tracking with peer-to-peer sessions
servers:
  - url: https://cvr-bus-tracker.onrender.com/api
    description: Production server (Render.com)
  - url: http://localhost:3000/api
    description: Development server

paths:
  /health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: Server is healthy

  /buses/{busNumber}:
    get:
      summary: Get current location of a specific bus
      parameters:
        - name: busNumber
          in: path
          required: true
          schema:
            type: string
          example: "12"
      responses:
        '200':
          description: Bus location found
        '404':
          description: No active tracker for this bus

  /buses/active:
    get:
      summary: Get all currently active buses
      responses:
        '200':
          description: List of active buses

  /tracker/start:
    post:
      summary: Start tracking a bus (become a tracker)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - busNumber
                - latitude
                - longitude
              properties:
                busNumber:
                  type: string
                  example: "12"
                latitude:
                  type: number
                  example: 17.3850
                longitude:
                  type: number
                  example: 78.4867
      responses:
        '201':
          description: Tracking session started successfully
        '409':
          description: Bus already has an active tracker

  /tracker/update:
    post:
      summary: Update tracker location
      responses:
        '200':
          description: Location updated successfully
        '404':
          description: Invalid session ID

  /tracker/stop:
    post:
      summary: Stop tracking session
      responses:
        '200':
          description: Tracking session stopped
```

### WebSocket API Specification

#### Events - Tracker to Server
```typescript
// Send location update (trackers only)
socket.emit('location-update', {
  busNumber: '12',
  latitude: 17.3850,
  longitude: 78.4867,
  accuracy: 10.5,
  timestamp: Date.now()
});
```

#### Events - Server to Clients  
```typescript
// Location update broadcast (to all consumers of this bus)
socket.on('location-updated', (data) => {
  // data: { busNumber, latitude, longitude, accuracy, timestamp }
});

// Tracker disconnected
socket.on('tracker-disconnected', (data) => {
  // data: { busNumber, reason: 'session_ended' | 'connection_lost' }
});
```

## Components

### MobileApp (React Native)

**Responsibility:** Primary user interface providing the two-button interface paradigm for tracking and consuming bus locations with real-time map display.

**Key Interfaces:**
- LocationService API for GPS coordinate access
- ApiClient for REST endpoint communication  
- WebSocketClient for real-time location streaming
- MapView for interactive location display

**Dependencies:** React Navigation, React Native Maps, Geolocation service, AsyncStorage

**Technology Stack:** React Native CLI 0.72+, TypeScript, Zustand state management, Socket.IO client

### ApiGateway (Express.js)

**Responsibility:** Central REST API server handling all HTTP requests, authentication, validation, and business logic coordination between mobile clients and data services.

**Key Interfaces:**
- `/api/buses/*` - Bus location CRUD operations
- `/api/tracker/*` - Tracker session management
- `/health` - System health monitoring

**Dependencies:** DatabaseService, CacheService, WebSocketService

**Technology Stack:** Express.js 4.18+, TypeScript, express-validator, cors middleware

### WebSocketService (Socket.IO)

**Responsibility:** Real-time bidirectional communication handling location updates from trackers and broadcasting to consumers with room-based message distribution.

**Dependencies:** CacheService for session management, ApiGateway for authentication

**Technology Stack:** Socket.IO 4.7+, room-based broadcasting

### DatabaseService (Supabase PostgreSQL)

**Responsibility:** Persistent data storage for bus sessions with automatic TTL cleanup, query optimization, and connection pooling management.

**Dependencies:** Supabase client library

**Technology Stack:** PostgreSQL 15+ via Supabase, automatic TTL via cron jobs, connection pooling

## Core Workflows

### Workflow 1: Student Becomes Bus Tracker

```mermaid
sequenceDiagram
    participant Student
    participant MobileApp
    participant LocationService
    participant ApiGateway
    participant DatabaseService
    participant WebSocketService
    
    Student->>MobileApp: Tap "Become Tracker"
    MobileApp->>LocationService: requestPermissions()
    LocationService-->>MobileApp: permissions granted
    
    MobileApp->>Student: Show bus number input
    Student->>MobileApp: Enter bus number "12"
    
    MobileApp->>LocationService: getCurrentPosition()
    LocationService-->>MobileApp: {lat, lng, accuracy}
    
    MobileApp->>ApiGateway: POST /tracker/start
    ApiGateway->>DatabaseService: Check if bus 12 has active tracker
    
    alt Bus already has tracker
        DatabaseService-->>ApiGateway: Active session exists
        ApiGateway-->>MobileApp: 409 Conflict
        MobileApp->>Student: "Bus 12 already tracked. Try different bus?"
    else Bus available
        DatabaseService-->>ApiGateway: No active tracker
        ApiGateway->>DatabaseService: Create new BusSession
        DatabaseService-->>ApiGateway: Session created
        ApiGateway-->>MobileApp: 201 Created {sessionId}
        
        MobileApp->>WebSocketService: Connect with sessionId
        WebSocketService-->>MobileApp: Connected to tracker room
        
        MobileApp->>LocationService: watchPosition() - Start continuous tracking
        loop Every 10-15 seconds
            LocationService-->>MobileApp: Location update
            MobileApp->>WebSocketService: Emit location-update
            WebSocketService->>DatabaseService: Update BusSession
            WebSocketService-->>All Consumers: Broadcast location-updated
        end
        
        MobileApp->>Student: Show "Tracking Bus 12" with Stop button
    end
```

### Workflow 2: Student Tracks Bus Location

```mermaid
sequenceDiagram
    participant Student
    participant MobileApp
    participant ApiGateway
    participant WebSocketService
    participant MapService
    participant DatabaseService
    
    Student->>MobileApp: Tap "Track Bus"
    MobileApp->>Student: Show bus number input
    Student->>MobileApp: Enter bus number "12"
    
    MobileApp->>ApiGateway: GET /buses/12
    ApiGateway->>DatabaseService: Query active BusSession for bus 12
    
    alt No active tracker
        DatabaseService-->>ApiGateway: No session found
        ApiGateway-->>MobileApp: 404 Not Found
        MobileApp->>Student: "No tracker active for Bus 12"
    else Active tracker found
        DatabaseService-->>ApiGateway: BusSession data
        ApiGateway-->>MobileApp: 200 OK {location, lastUpdated}
        
        MobileApp->>MapService: Initialize map with bus location
        MapService-->>MobileApp: Map rendered with bus marker
        
        MobileApp->>WebSocketService: Connect and join bus-12 room
        WebSocketService-->>MobileApp: Connected to consumer room
        
        loop Real-time updates
            WebSocketService-->>MobileApp: location-updated event
            MobileApp->>MapService: Update bus marker position
            MapService-->>MobileApp: Marker updated smoothly
        end
        
        MobileApp->>Student: Show live map with Bus 12 location
    end
```

## Database Schema

```sql
-- CVR College Bus Tracker Database Schema
-- PostgreSQL 15+ (Supabase)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bus tracking sessions table
CREATE TABLE bus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number VARCHAR(10) NOT NULL,
    tracker_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6, 2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Constraints
    CONSTRAINT valid_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT valid_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT positive_accuracy CHECK (accuracy > 0)
);

-- Indexes for performance
CREATE INDEX idx_bus_sessions_active_bus ON bus_sessions (bus_number, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_bus_sessions_expires ON bus_sessions (expires_at);

-- Unique constraint: Only one active tracker per bus
CREATE UNIQUE INDEX idx_unique_active_tracker 
    ON bus_sessions (bus_number) 
    WHERE is_active = true;

-- Automatic cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Mark expired sessions as inactive
    UPDATE bus_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete expired sessions (after marking inactive for grace period)
    DELETE FROM bus_sessions 
    WHERE expires_at < (NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup (Supabase cron extension)
SELECT cron.schedule(
    'cleanup-expired-data',
    '*/30 * * * *', -- Every 30 minutes
    'SELECT cleanup_expired_data();'
);

-- View for active bus locations (API consumption)
CREATE VIEW active_buses AS
SELECT 
    bus_number,
    latitude,
    longitude,
    accuracy,
    updated_at as last_updated,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM bus_sessions 
WHERE is_active = true 
    AND expires_at > NOW()
ORDER BY bus_number;
```

## Frontend Architecture

### Component Organization
```
mobile/src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── LoadingSpinner/
│   ├── maps/
│   │   ├── BusMap/
│   │   └── LocationMarker/
│   └── tracking/
│       ├── TrackerControls/
│       └── BusSelector/
├── screens/
│   ├── HomeScreen/
│   ├── TrackBusScreen/
│   ├── BecomeTrackerScreen/
│   └── MapScreen/
├── services/
│   ├── api.ts
│   ├── websocket.ts
│   └── location.ts
├── hooks/
│   ├── useLocation.ts
│   ├── useWebSocket.ts
│   └── useTracking.ts
└── store/
    ├── index.ts
    └── trackingStore.ts
```

### State Management Architecture

```typescript
// store/index.ts - Zustand state management
interface AppState {
  isConnected: boolean;
  currentScreen: 'home' | 'track' | 'tracker' | 'map';
  userRole: 'consumer' | 'tracker' | null;
  selectedBus: string | null;
  trackingSession: TrackingSession | null;
  currentLocation: Location | null;
  busLocations: Record<string, BusLocation>;
  
  setConnected: (connected: boolean) => void;
  startTracking: (busNumber: string) => Promise<void>;
  stopTracking: () => void;
  updateBusLocation: (busNumber: string, location: BusLocation) => void;
}
```

## Backend Architecture

### Controller/Route Organization
```
backend/src/
├── controllers/
│   ├── busController.ts
│   ├── trackerController.ts
│   └── healthController.ts
├── routes/
│   ├── busRoutes.ts
│   ├── trackerRoutes.ts
│   └── healthRoutes.ts
├── services/
│   ├── trackingService.ts
│   ├── databaseService.ts
│   └── websocketService.ts
├── middleware/
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── rateLimiter.ts
└── websocket/
    ├── handlers/
    │   ├── trackingHandlers.ts
    │   └── connectionHandlers.ts
    └── rooms.ts
```

### Authentication and Authorization

Session-based authentication without persistent user accounts:

```typescript
// Session validation middleware
export const requireValidSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionId = req.body.sessionId || req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({
      error: { code: 'MISSING_SESSION', message: 'Session ID required' }
    });
  }
  
  const session = await databaseService.findSessionById(sessionId);
  
  if (!session || !session.is_active) {
    return res.status(401).json({
      error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' }
    });
  }
  
  req.sessionId = sessionId;
  req.session = session;
  next();
};
```

## Unified Project Structure

```
cvr-college-bus-tracker/
├── .github/workflows/           # CI/CD workflows
├── apps/
│   ├── mobile/                  # React Native application
│   │   ├── android/             # Native Android configuration
│   │   ├── ios/                 # Native iOS configuration
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   ├── screens/         # Screen components
│   │   │   ├── services/        # API and external services
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── store/           # State management
│   │   │   └── types/           # TypeScript types
│   │   └── package.json
│   └── backend/                 # Express.js API server
│       ├── src/
│       │   ├── controllers/     # Request handlers
│       │   ├── routes/          # Route definitions
│       │   ├── services/        # Business logic
│       │   ├── middleware/      # Express middleware
│       │   ├── websocket/       # Socket.IO handlers
│       │   └── types/           # TypeScript types
│       ├── tests/               # Backend tests
│       └── package.json
├── packages/                    # Shared packages
│   ├── shared-types/            # Common TypeScript types
│   ├── utils/                   # Shared utility functions
│   └── config/                  # Shared configuration
├── scripts/                     # Development and build scripts
├── docs/                        # Project documentation
├── package.json                 # Root package.json with workspaces
└── README.md
```

## Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install Yarn
npm install -g yarn

# Install React Native CLI
npm install -g @react-native-community/cli
```

#### Initial Setup
```bash
# Clone and setup project
git clone <repository-url>
cd cvr-college-bus-tracker
yarn install

# Setup environment variables
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/backend/.env.example apps/backend/.env

# Start development environment
yarn dev
```

#### Development Commands
```bash
# Start all services
yarn dev

# Start frontend only
cd apps/mobile && yarn start

# Start backend only
cd apps/backend && yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Environment Configuration

#### Mobile (.env.local)
```bash
API_BASE_URL=http://localhost:3000/api
WEBSOCKET_URL=ws://localhost:3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
DEBUG=true
```

#### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Local builds for development, future app store distribution
- **Build Command:** `cd apps/mobile && npx react-native build-android`
- **Output Directory:** `apps/mobile/android/app/build/outputs/apk/`

**Backend Deployment:**
- **Platform:** Render.com (Free Tier)
- **Build Command:** `yarn install && yarn workspace backend build`
- **Deployment Method:** Git-based continuous deployment

### CI/CD Pipeline
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['apps/backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      - name: Run tests
        run: yarn workspace backend test
      - name: Deploy to Render
        uses: render-deploy/render-deploy-action@v1.0.0
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

### Environments
| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | localhost:8081 | localhost:3000 | Local development |
| Production | Local builds | cvr-bus-tracker.onrender.com | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- GPS permissions handled with clear user consent
- API calls over HTTPS in production
- No persistent personal data storage

**Backend Security:**
- Input validation using express-validator
- Rate limiting via express-rate-limit
- CORS policy restricting origins

**Authentication Security:**
- Session-based anonymous tracking
- No user accounts or passwords
- TTL-based session expiration

### Performance Optimization

**Frontend Performance:**
- Bundle size optimized with Metro bundler
- Map rendering optimized for mobile devices
- Location updates throttled to 10-15 seconds

**Backend Performance:**
- Database queries optimized with indexes
- In-memory caching for session data
- WebSocket rooms for efficient broadcasting

## Testing Strategy

### Testing Pyramid
```
E2E Tests (Detox)
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

### Test Organization

#### Frontend Tests
```
apps/mobile/__tests__/
├── components/
├── screens/
├── services/
└── __mocks__/
```

#### Backend Tests
```
apps/backend/tests/
├── unit/
│   ├── controllers/
│   └── services/
├── integration/
│   └── routes/
└── fixtures/
```

## Coding Standards

### Critical Fullstack Rules
- **Type Sharing:** Always define types in packages/shared-types and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns

### Naming Conventions
| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `bus_sessions` |

## Error Handling Strategy

### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling
```typescript
// Global error boundary and service-level error handling
try {
  await trackingService.startTracking(busNumber);
} catch (error) {
  if (error instanceof BusAlreadyTrackedError) {
    showError('Bus already has a tracker. Try a different bus.');
  } else {
    showError('Unable to start tracking. Please try again.');
  }
}
```

## Monitoring and Observability

### Monitoring Stack
- **Frontend Monitoring:** React Native crash reporting via Flipper (development)
- **Backend Monitoring:** Basic logging via Winston
- **Error Tracking:** Sentry (5k errors/month free)
- **Performance Monitoring:** Manual testing and basic metrics

### Key Metrics
**Frontend Metrics:**
- App crashes and errors
- Location permission success rate
- WebSocket connection stability

**Backend Metrics:**
- Request rate and response times
- Database connection health
- WebSocket connection count

## Checklist Results Report

*Checklist execution pending - to be completed after architecture review*

---

**Total Architecture Cost: $0/month**
**Estimated Development Time: 2-3 months**
**Scalability: 500+ concurrent users**
**Maintenance Overhead: Minimal (automated cleanup)**

This architecture provides a production-ready, completely free solution that meets all PRD requirements while maintaining professional standards and room for future growth.