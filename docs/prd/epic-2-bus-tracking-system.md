# Epic 2: Bus Tracking System

**Epic Goal:** Implement the core peer-to-peer bus tracking functionality where students can become trackers for specific buses and consumers can view real-time bus locations on an interactive map, delivering the fundamental value proposition that solves the daily transportation uncertainty problem.

## Story 2.1: Bus Number Input and Validation
**As a** student,
**I want** to enter a bus number when tracking or becoming a tracker,
**so that** I can specify which bus I'm interested in or currently riding.

**Acceptance Criteria:**
1. Bus number input screen with numeric keypad optimization for mobile
2. Input validation ensures bus numbers match expected format/range
3. Clear error messaging for invalid bus numbers
4. Input field supports common bus number formats used at CVR College
5. Form submission triggers appropriate flow (tracking vs becoming tracker)
6. Recent bus numbers are remembered for quick selection

## Story 2.2: Become Tracker Functionality
**As a** student riding a bus,
**I want** to become the active tracker for my bus,
**so that** other students can see the bus location in real-time.

**Acceptance Criteria:**
1. System checks if bus already has an active tracker before allowing new tracker
2. Clear messaging when bus already has active tracker with option to try different bus
3. Location sharing begins immediately after successful tracker activation
4. Tracker status clearly displayed with "Currently Tracking Bus X" indicator
5. "Stop Tracking" button prominently accessible to end tracking session
6. Location updates sent to backend every 10-15 seconds while tracking active
7. App prevents device sleep/lock while actively tracking

## Story 2.3: Track Bus Consumer Experience
**As a** student waiting for a bus,
**I want** to view the real-time location of a specific bus on a map,
**so that** I can time my arrival at the bus stop appropriately.

**Acceptance Criteria:**
1. Map displays with bus location marked clearly with bus number identifier
2. Map centers on bus location with appropriate zoom level for context
3. Location updates refresh automatically every 10-15 seconds
4. Clear messaging when no active tracker exists for requested bus
5. Map supports basic zoom and pan functionality for user exploration
6. Bus location marker distinguishes from user's current location marker

## Story 2.4: Real-time Location Broadcasting System
**As a** system,
**I want** to efficiently broadcast location updates from trackers to consumers,
**so that** bus locations are displayed accurately and promptly.

**Acceptance Criteria:**
1. WebSocket connection established between mobile app and backend for real-time updates
2. Location data transmitted securely with proper data validation
3. System handles tracker disconnection gracefully, marking bus as unavailable
4. Multiple consumers can view same bus location simultaneously
5. Location broadcasting stops immediately when tracker ends session
6. System maintains single active tracker per bus with conflict resolution

## Story 2.5: Map Integration and Location Display
**As a** user,
**I want** to see bus locations displayed on an interactive map with proper geographic context,
**so that** I can understand bus position relative to campus locations and bus stops.

**Acceptance Criteria:**
1. Interactive map integrated using React Native Maps with proper styling
2. Bus locations marked with clear visual indicators and bus number labels
3. Map displays campus context with relevant landmarks and roads
4. User's current location optionally displayed for reference
5. Map performance optimized for mobile devices with smooth pan/zoom
6. Location markers update smoothly without jarring map resets
