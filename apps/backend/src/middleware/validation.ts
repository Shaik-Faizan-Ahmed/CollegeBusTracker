import { Request, Response, NextFunction } from 'express';
import { BUS_SESSION_CONSTRAINTS, ApiError } from '@cvr-bus-tracker/shared-types';
import { ErrorCodes } from '../types/api';

export interface ValidationRequest extends Request {
  validatedData?: {
    busNumber?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    sessionId?: string;
  };
}

export const validateBusNumber = (req: ValidationRequest, res: Response, next: NextFunction): void => {
  const { busNumber } = req.body;
  
  if (!busNumber) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.MISSING_REQUIRED_FIELDS,
        message: 'Bus number is required',
        details: { field: 'busNumber' }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (typeof busNumber !== 'string') {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_BUS_NUMBER,
        message: 'Bus number must be a string',
        details: { field: 'busNumber', value: busNumber }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  const constraints = BUS_SESSION_CONSTRAINTS.busNumber;
  
  if (busNumber.length < constraints.minLength || busNumber.length > constraints.maxLength) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_BUS_NUMBER,
        message: `Bus number must be between ${constraints.minLength} and ${constraints.maxLength} characters`,
        details: { field: 'busNumber', value: busNumber, length: busNumber.length }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (!constraints.pattern.test(busNumber)) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_BUS_NUMBER,
        message: 'Bus number must contain only alphanumeric characters',
        details: { field: 'busNumber', value: busNumber }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  req.validatedData = { ...req.validatedData, busNumber };
  next();
};

export const validateCoordinates = (req: ValidationRequest, res: Response, next: NextFunction): void => {
  const { latitude, longitude, accuracy } = req.body;

  // Validate latitude
  if (latitude === undefined || latitude === null) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.MISSING_REQUIRED_FIELDS,
        message: 'Latitude is required',
        details: { field: 'latitude' }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (typeof latitude !== 'number' || isNaN(latitude)) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_COORDINATES,
        message: 'Latitude must be a valid number',
        details: { field: 'latitude', value: latitude }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  const latConstraints = BUS_SESSION_CONSTRAINTS.latitude;
  if (latitude < latConstraints.min || latitude > latConstraints.max) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_COORDINATES,
        message: `Latitude must be between ${latConstraints.min} and ${latConstraints.max}`,
        details: { field: 'latitude', value: latitude }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Validate longitude
  if (longitude === undefined || longitude === null) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.MISSING_REQUIRED_FIELDS,
        message: 'Longitude is required',
        details: { field: 'longitude' }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (typeof longitude !== 'number' || isNaN(longitude)) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_COORDINATES,
        message: 'Longitude must be a valid number',
        details: { field: 'longitude', value: longitude }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  const lngConstraints = BUS_SESSION_CONSTRAINTS.longitude;
  if (longitude < lngConstraints.min || longitude > lngConstraints.max) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_COORDINATES,
        message: `Longitude must be between ${lngConstraints.min} and ${lngConstraints.max}`,
        details: { field: 'longitude', value: longitude }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Validate accuracy (optional)
  let validatedAccuracy = accuracy;
  if (accuracy !== undefined && accuracy !== null) {
    if (typeof accuracy !== 'number' || isNaN(accuracy)) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INVALID_COORDINATES,
          message: 'Accuracy must be a valid number',
          details: { field: 'accuracy', value: accuracy }
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const accuracyConstraints = BUS_SESSION_CONSTRAINTS.accuracy;
    if (accuracy < accuracyConstraints.min) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: ErrorCodes.INVALID_COORDINATES,
          message: `Accuracy must be greater than ${accuracyConstraints.min}`,
          details: { field: 'accuracy', value: accuracy }
        },
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }
  } else {
    validatedAccuracy = 10.0; // Default accuracy
  }

  req.validatedData = { 
    ...req.validatedData, 
    latitude, 
    longitude, 
    accuracy: validatedAccuracy 
  };
  next();
};

export const validateLocationData = (req: ValidationRequest, res: Response, next: NextFunction): void => {
  validateBusNumber(req, res, (err) => {
    if (err) return next(err);
    validateCoordinates(req, res, next);
  });
};

export const validateSessionId = (req: ValidationRequest, res: Response, next: NextFunction): void => {
  const { sessionId } = req.body;

  if (!sessionId) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.MISSING_REQUIRED_FIELDS,
        message: 'Session ID is required',
        details: { field: 'sessionId' }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  if (typeof sessionId !== 'string') {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_SESSION_ID,
        message: 'Session ID must be a string',
        details: { field: 'sessionId', value: sessionId }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Basic UUID format validation (simplified)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(sessionId)) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_SESSION_ID,
        message: 'Session ID must be a valid UUID format',
        details: { field: 'sessionId', value: sessionId }
      },
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }

  req.validatedData = { ...req.validatedData, sessionId };
  next();
};