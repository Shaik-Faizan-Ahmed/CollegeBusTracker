import { BusLocation, Location } from '@cvr-bus-tracker/shared-types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface BusMapState {
  region: MapRegion;
  selectedBus: string | null;
  showUserLocation: boolean;
  userLocation: Location | null;
  busLocations: Record<string, BusLocation>;
  isConnected: boolean;
  lastUpdate: Date;
}

export interface BusLocationMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  busNumber: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface UserLocationMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  accuracy?: number;
  showAccuracyCircle?: boolean;
}

export interface MapScreenProps {
  route: {
    params: {
      busNumber: string;
      initialRegion?: MapRegion;
    };
  };
  navigation: any;
}

// CVR College campus region configuration
export const CAMPUS_REGION: MapRegion = {
  latitude: 17.3850,
  longitude: 78.4867,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};