import { BusSession, ApiResponse, ApiError } from '@cvr-bus-tracker/shared-types';
import { api } from './api';

export interface GetBusResponse {
  id: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface NoTrackerError {
  error: {
    code: 'NO_ACTIVE_TRACKER';
    message: string;
    busNumber: string;
  };
}

export interface ActiveBusesResponse {
  activeBuses: Array<{
    busNumber: string;
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  }>;
}

class ConsumerService {
  async getBusLocation(busNumber: string): Promise<GetBusResponse> {
    try {
      const response = await api.get<GetBusResponse>(`/buses/${busNumber}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`No active tracker found for bus ${busNumber}`);
      }
      throw new Error('Failed to get bus location');
    }
  }

  async getActiveBuses(): Promise<ActiveBusesResponse> {
    try {
      const response = await api.get<ActiveBusesResponse>('/buses/active');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get active buses');
    }
  }
}

export const consumerService = new ConsumerService();