# Components

## MobileApp (React Native)

**Responsibility:** Primary user interface providing the two-button interface paradigm for tracking and consuming bus locations with real-time map display.

**Key Interfaces:**
- LocationService API for GPS coordinate access
- ApiClient for REST endpoint communication  
- WebSocketClient for real-time location streaming
- MapView for interactive location display

**Dependencies:** React Navigation, React Native Maps, Geolocation service, AsyncStorage

**Technology Stack:** React Native CLI 0.72+, TypeScript, Zustand state management, Socket.IO client

## ApiGateway (Express.js)

**Responsibility:** Central REST API server handling all HTTP requests, authentication, validation, and business logic coordination between mobile clients and data services.

**Key Interfaces:**
- `/api/buses/*` - Bus location CRUD operations
- `/api/tracker/*` - Tracker session management
- `/health` - System health monitoring

**Dependencies:** DatabaseService, CacheService, WebSocketService

**Technology Stack:** Express.js 4.18+, TypeScript, express-validator, cors middleware

## WebSocketService (Socket.IO)

**Responsibility:** Real-time bidirectional communication handling location updates from trackers and broadcasting to consumers with room-based message distribution.

**Dependencies:** CacheService for session management, ApiGateway for authentication

**Technology Stack:** Socket.IO 4.7+, room-based broadcasting

## DatabaseService (Supabase PostgreSQL)

**Responsibility:** Persistent data storage for bus sessions with automatic TTL cleanup, query optimization, and connection pooling management.

**Dependencies:** Supabase client library

**Technology Stack:** PostgreSQL 15+ via Supabase, automatic TTL via cron jobs, connection pooling
