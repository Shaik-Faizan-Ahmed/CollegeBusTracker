# Frontend Architecture

## Component Organization
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

## State Management Architecture

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
