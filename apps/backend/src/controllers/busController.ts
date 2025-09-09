import { Request, Response } from 'express';
import { ApiResponse, ApiError, BusSession } from '@cvr-bus-tracker/shared-types';
import { ErrorCodes, BusLocationResponse, ActiveBusesResponse } from '../types/api';
import trackingService from '../services/trackingService';

export class BusController {
  async getActiveBuses(req: Request, res: Response): Promise<void> {
    try {
      const activeBuses = await trackingService.getActiveBuses();
      
      const busesData: BusLocationResponse[] = activeBuses.map(bus => ({
        id: bus.id,
        busNumber: bus.busNumber,
        latitude: bus.latitude,
        longitude: bus.longitude,
        accuracy: 10.0, // Default accuracy for now
        lastUpdated: bus.lastUpdated.toISOString(),
        secondsSinceUpdate: Math.floor((Date.now() - bus.lastUpdated.getTime()) / 1000)
      }));

      const response: ApiResponse<ActiveBusesResponse> = {
        success: true,
        data: {
          buses: busesData,
          total: busesData.length
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve active buses',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }

  async getBusLocation(req: Request, res: Response): Promise<void> {
    try {
      const { busNumber } = req.params;

      if (!busNumber) {
        const errorResponse: ApiError = {
          success: false,
          error: {
            code: ErrorCodes.INVALID_BUS_NUMBER,
            message: 'Bus number is required',
            details: { parameter: 'busNumber' }
          },
          timestamp: new Date().toISOString()
        };

        res.status(400).json(errorResponse);
        return;
      }

      const bus = await trackingService.getBusLocation(busNumber);

      if (!bus) {
        const errorResponse: ApiError = {
          success: false,
          error: {
            code: ErrorCodes.BUS_NOT_FOUND,
            message: 'No active tracker found for this bus',
            details: { busNumber }
          },
          timestamp: new Date().toISOString()
        };

        res.status(404).json(errorResponse);
        return;
      }

      const busData: BusLocationResponse = {
        id: bus.id,
        busNumber: bus.busNumber,
        latitude: bus.latitude,
        longitude: bus.longitude,
        accuracy: 10.0, // Default accuracy for now
        lastUpdated: bus.lastUpdated.toISOString(),
        secondsSinceUpdate: Math.floor((Date.now() - bus.lastUpdated.getTime()) / 1000)
      };

      const response: ApiResponse<BusLocationResponse> = {
        success: true,
        data: busData,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve bus location',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }
}

export const busController = new BusController();