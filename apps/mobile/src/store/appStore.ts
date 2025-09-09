import {create} from 'zustand';
import {ScreenNames, Location, TrackingSession, BusLocation, ConsumerTrackingState, LocationUpdate} from '@cvr-bus-tracker/shared-types';
import { MapRegion } from '../types/map';

export type LocationLoadingState = 'idle' | 'loading' | 'success' | 'error';
export type LocationPermissionStatus = 'granted' | 'denied' | 'unknown';
export type TrackerStatus = 'idle' | 'starting' | 'active' | 'stopping' | 'error';

export interface AppState {
  currentScreen: 'home' | 'track' | 'tracker' | 'map';
  userRole: 'consumer' | 'tracker' | null;
  
  // Bus selection state
  selectedBus: string | null;
  recentBusNumbers: string[];
  
  // Location state
  currentLocation: Location | null;
  isLocationTracking: boolean;
  locationLoadingState: LocationLoadingState;
  locationError: string | null;
  locationPermissionStatus: LocationPermissionStatus;
  
  // Tracker state
  trackingSession: TrackingSession | null;
  isActiveTracker: boolean;
  trackerStatus: TrackerStatus;
  trackerError: string | null;

  // Consumer tracking state
  consumerTracking: ConsumerTrackingState | null;
  activeBuses: BusLocation[];

  // Map state
  mapState: {
    region: MapRegion;
    showUserLocation: boolean;
    selectedBus: string | null;
    isMapVisible: boolean;
  };
  
  // Navigation methods
  navigateToScreen: (screen: ScreenNames) => void;
  setUserRole: (role: 'consumer' | 'tracker' | null) => void;
  
  // Bus selection methods
  setSelectedBus: (busNumber: string | null) => void;
  addRecentBusNumber: (busNumber: string) => void;
  clearRecentBusNumbers: () => void;
  
  // Location methods
  setCurrentLocation: (location: Location | null) => void;
  setLocationTracking: (isTracking: boolean) => void;
  setLocationLoadingState: (state: LocationLoadingState) => void;
  setLocationError: (error: string | null) => void;
  setLocationPermissionStatus: (status: LocationPermissionStatus) => void;
  
  // Tracker methods
  startTracking: (busNumber: string) => Promise<void>;
  stopTracking: () => Promise<void>;
  updateTrackingLocation: (location: Location) => void;
  setTrackingSession: (session: TrackingSession | null) => void;
  setTrackerStatus: (status: TrackerStatus) => void;
  setTrackerError: (error: string | null) => void;

  // Consumer tracking methods
  startConsumerTracking: (busNumber: string) => Promise<void>;
  stopConsumerTracking: () => void;
  updateConsumerBusLocation: (location: LocationUpdate) => void;
  fetchActiveBuses: () => Promise<void>;

  // Map-specific actions
  updateMapRegion: (region: MapRegion) => void;
  toggleUserLocation: () => void;
  centerOnBus: (busNumber: string) => void;
  setMapVisibility: (visible: boolean) => void;
}

export const useAppStore = create<AppState>(set => ({
  currentScreen: 'home',
  userRole: null,
  
  // Bus selection initial state
  selectedBus: null,
  recentBusNumbers: [],
  
  // Location initial state
  currentLocation: null,
  isLocationTracking: false,
  locationLoadingState: 'idle',
  locationError: null,
  locationPermissionStatus: 'unknown',
  
  // Tracker initial state
  trackingSession: null,
  isActiveTracker: false,
  trackerStatus: 'idle',
  trackerError: null,

  // Consumer tracking initial state
  consumerTracking: null,
  activeBuses: [],

  // Map initial state
  mapState: {
    region: {
      latitude: 17.3850,
      longitude: 78.4867,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    showUserLocation: false,
    selectedBus: null,
    isMapVisible: false,
  },

  navigateToScreen: (screen: ScreenNames) =>
    set(_state => ({
      currentScreen: screen.toLowerCase() as AppState['currentScreen'],
    })),

  setUserRole: (role: 'consumer' | 'tracker' | null) => set({userRole: role}),
  
  // Bus selection methods
  setSelectedBus: (busNumber: string | null) => set({selectedBus: busNumber}),
  addRecentBusNumber: (busNumber: string) => 
    set(state => ({
      recentBusNumbers: [
        busNumber, 
        ...state.recentBusNumbers.filter(num => num !== busNumber)
      ].slice(0, 5)
    })),
  clearRecentBusNumbers: () => set({recentBusNumbers: []}),
  
  // Location methods
  setCurrentLocation: (location: Location | null) => set({currentLocation: location}),
  setLocationTracking: (isTracking: boolean) => set({isLocationTracking: isTracking}),
  setLocationLoadingState: (state: LocationLoadingState) => set({locationLoadingState: state}),
  setLocationError: (error: string | null) => set({locationError: error}),
  setLocationPermissionStatus: (status: LocationPermissionStatus) => set({locationPermissionStatus: status}),
  
  // Tracker methods
  startTracking: async (busNumber: string) => {
    // Use dynamic imports only when not in test environment
    const isTest = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
    
    let trackerService: any;
    let LocationService: any;
    let locationTrackingService: any;
    let websocketService: any;
    
    if (isTest) {
      // In tests, these will be mocked at the module level
      trackerService = require('../services/trackerService').trackerService;
      LocationService = require('../services/location').LocationService;
      locationTrackingService = require('../services/locationTracking').locationTrackingService;
      websocketService = require('../services/websocketService').websocketService;
    } else {
      const services = await Promise.all([
        import('../services/trackerService'),
        import('../services/location'),
        import('../services/locationTracking'),
        import('../services/websocketService'),
      ]);
      
      trackerService = services[0].trackerService;
      LocationService = services[1].LocationService;
      locationTrackingService = services[2].locationTrackingService;
      websocketService = services[3].websocketService;
    }

    try {
      set({ trackerStatus: 'starting', trackerError: null });
      
      // Get current location
      const locationService = new LocationService();
      const position = await locationService.getCurrentPosition();
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 999,
        timestamp: position.timestamp || Date.now(),
      };

      // Start tracking session
      const response = await trackerService.startTracking(busNumber, location);
      
      // Connect WebSocket
      await websocketService.connect(response.sessionId);
      
      // Create tracking session
      const session: TrackingSession = {
        sessionId: response.sessionId,
        busNumber: response.busNumber,
        trackerId: response.trackerId,
        startedAt: new Date(),
        isActive: true,
      };

      // Start location tracking
      await locationTrackingService.startTracking();
      
      set({
        trackingSession: session,
        isActiveTracker: true,
        trackerStatus: 'active',
        userRole: 'tracker',
        selectedBus: busNumber,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      set({ 
        trackerStatus: 'error', 
        trackerError: errorMessage,
        isActiveTracker: false,
        trackingSession: null,
      });
      throw error;
    }
  },

  stopTracking: async () => {
    // Use dynamic imports only when not in test environment
    const isTest = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
    
    let trackerService: any;
    let locationTrackingService: any;
    let websocketService: any;
    
    if (isTest) {
      trackerService = require('../services/trackerService').trackerService;
      locationTrackingService = require('../services/locationTracking').locationTrackingService;
      websocketService = require('../services/websocketService').websocketService;
    } else {
      const services = await Promise.all([
        import('../services/trackerService'),
        import('../services/locationTracking'),
        import('../services/websocketService'),
      ]);
      
      trackerService = services[0].trackerService;
      locationTrackingService = services[1].locationTrackingService;
      websocketService = services[2].websocketService;
    }

    try {
      set({ trackerStatus: 'stopping', trackerError: null });
      
      // Stop location tracking
      locationTrackingService.stopTracking();
      
      // Disconnect WebSocket
      websocketService.disconnect();
      
      // Stop tracker service
      await trackerService.stopTracking();
      
      set({
        trackingSession: null,
        isActiveTracker: false,
        trackerStatus: 'idle',
        userRole: null,
        isLocationTracking: false,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop tracking';
      set({ 
        trackerStatus: 'error', 
        trackerError: errorMessage 
      });
      throw error;
    }
  },

  updateTrackingLocation: (location: Location) => set({ currentLocation: location }),
  
  setTrackingSession: (session: TrackingSession | null) => set({ 
    trackingSession: session,
    isActiveTracker: session?.isActive ?? false,
  }),
  
  setTrackerStatus: (status: TrackerStatus) => set({ trackerStatus: status }),
  
  setTrackerError: (error: string | null) => set({ trackerError: error }),

  // Consumer tracking methods
  startConsumerTracking: async (busNumber: string) => {
    const isTest = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
    
    let consumerService: any;
    
    if (isTest) {
      consumerService = require('../services/consumerService').consumerService;
    } else {
      const { consumerService: service } = await import('../services/consumerService');
      consumerService = service;
    }

    try {
      set({ locationLoadingState: 'loading', locationError: null });
      
      // Get current bus location
      const busData = await consumerService.getBusLocation(busNumber);
      
      const busLocation: BusLocation = {
        latitude: busData.latitude,
        longitude: busData.longitude,
        accuracy: 10, // Default accuracy for bus location
        timestamp: new Date(busData.lastUpdated),
      };

      const consumerState: ConsumerTrackingState = {
        busNumber,
        busLocation,
        lastUpdated: new Date(busData.lastUpdated),
        isTrackerActive: busData.isActive,
        wsConnected: false,
      };

      set({
        consumerTracking: consumerState,
        userRole: 'consumer',
        selectedBus: busNumber,
        locationLoadingState: 'success',
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start consumer tracking';
      set({ 
        locationLoadingState: 'error', 
        locationError: errorMessage,
        consumerTracking: null,
      });
      throw error;
    }
  },

  stopConsumerTracking: () => {
    set({
      consumerTracking: null,
      userRole: null,
      locationLoadingState: 'idle',
      locationError: null,
    });
  },

  updateConsumerBusLocation: (location: LocationUpdate) => {
    set(state => {
      if (!state.consumerTracking || state.consumerTracking.busNumber !== location.busNumber) {
        return state;
      }

      const busLocation: BusLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp),
      };

      return {
        consumerTracking: {
          ...state.consumerTracking,
          busLocation,
          lastUpdated: new Date(),
          wsConnected: true,
        }
      };
    });
  },

  fetchActiveBuses: async () => {
    const isTest = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined';
    
    let consumerService: any;
    
    if (isTest) {
      consumerService = require('../services/consumerService').consumerService;
    } else {
      const { consumerService: service } = await import('../services/consumerService');
      consumerService = service;
    }

    try {
      const response = await consumerService.getActiveBuses();
      const activeBuses: BusLocation[] = response.activeBuses.map(bus => ({
        latitude: bus.latitude,
        longitude: bus.longitude,
        accuracy: 10, // Default accuracy
        timestamp: new Date(bus.lastUpdated),
      }));
      
      set({ activeBuses });
    } catch (error) {
      console.error('Failed to fetch active buses:', error);
    }
  },

  // Map-specific actions
  updateMapRegion: (region: MapRegion) => 
    set(state => ({
      mapState: { ...state.mapState, region }
    })),

  toggleUserLocation: () => 
    set(state => ({
      mapState: { 
        ...state.mapState, 
        showUserLocation: !state.mapState.showUserLocation 
      }
    })),

  centerOnBus: (busNumber: string) =>
    set(state => ({
      mapState: { 
        ...state.mapState, 
        selectedBus: busNumber 
      }
    })),

  setMapVisibility: (visible: boolean) =>
    set(state => ({
      mapState: { 
        ...state.mapState, 
        isMapVisible: visible 
      }
    })),
}));
