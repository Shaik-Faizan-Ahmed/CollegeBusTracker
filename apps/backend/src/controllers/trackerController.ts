import { Response } from 'express';
import { ApiResponse, ApiError } from '@cvr-bus-tracker/shared-types';
import { ValidationRequest } from '../middleware/validation';
import { ErrorCodes, TrackingSessionResponse } from '../types/api';
import trackingService from '../services/trackingService';
import { v4 as uuidv4 } from 'uuid';

export class TrackerController {
  async startTracking(req: ValidationRequest, res: Response): Promise<void> {
    try {
      const { busNumber, latitude, longitude, accuracy } = req.validatedData!;
      const trackerId = uuidv4(); // Generate unique tracker ID

      const busSession = await trackingService.createBusSession(
        busNumber!,
        trackerId,
        latitude!,
        longitude!,
        accuracy || 10.0
      );

      const response: ApiResponse<TrackingSessionResponse> = {
        success: true,
        data: {
          sessionId: busSession.id,
          busNumber: busSession.busNumber,
          trackerId: busSession.trackerId,
          isActive: busSession.isActive,
          startedAt: busSession.lastUpdated.toISOString(),
          expiresAt: busSession.expiresAt.toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      // Handle specific business logic errors
      if (error instanceof Error && error.message.includes('already being tracked')) {
        const errorResponse: ApiError = {
          success: false,
          error: {
            code: ErrorCodes.BUS_ALREADY_TRACKED,
            message: error.message,
            details: { busNumber: req.validatedData?.busNumber }
          },
          timestamp: new Date().toISOString()
        };
        res.status(409).json(errorResponse);
        return;
      }

      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to start tracking session',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }

  async updateLocation(req: ValidationRequest, res: Response): Promise<void> {
    try {
      const { sessionId, latitude, longitude, accuracy } = req.validatedData!;

      const updated = await trackingService.updateBusLocation(
        sessionId!,
        latitude!,
        longitude!,
        accuracy || 10.0
      );

      if (!updated) {
        const errorResponse: ApiError = {
          success: false,
          error: {
            code: ErrorCodes.SESSION_NOT_FOUND,
            message: 'Active tracking session not found',
            details: { sessionId }
          },
          timestamp: new Date().toISOString()
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<{
        sessionId: string;
        updated: boolean;
        timestamp: string;
      }> = {
        success: true,
        data: {
          sessionId: sessionId!,
          updated: true,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to update location',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }

  async stopTracking(req: ValidationRequest, res: Response): Promise<void> {
    try {
      const { sessionId } = req.validatedData!;

      const stopped = await trackingService.stopBusSession(sessionId!);

      if (!stopped) {
        const errorResponse: ApiError = {
          success: false,
          error: {
            code: ErrorCodes.SESSION_NOT_FOUND,
            message: 'Active tracking session not found',
            details: { sessionId }
          },
          timestamp: new Date().toISOString()
        };
        res.status(404).json(errorResponse);
        return;
      }

      const response: ApiResponse<{
        sessionId: string;
        stopped: boolean;
        timestamp: string;
      }> = {
        success: true,
        data: {
          sessionId: sessionId!,
          stopped: true,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          message: 'Failed to stop tracking session',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(errorResponse);
    }
  }
}

export const trackerController = new TrackerController();