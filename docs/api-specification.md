# CVR Bus Tracker API Documentation

## Overview

The CVR Bus Tracker API provides endpoints for managing bus tracking sessions and retrieving bus location data. This RESTful API supports the core functionality needed for both trackers (bus drivers) and consumers (students/passengers).

## Base URL

```
http://localhost:3001/api
```

## Authentication

This version of the API does not require authentication. Session-based tracking is managed through session IDs.

## Data Formats

All API responses follow a consistent format:

### Success Response Format
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error context
    }
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

## Health Check Endpoints

### GET /health
Returns the system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-07T15:30:00Z",
    "database": "connected"
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

### GET /health/database
Returns detailed database health information.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-07T15:30:00Z"
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `DATABASE_HEALTH_CHECK_FAILED` (500): Database connection or query failed

## Bus Location Endpoints

### GET /buses/active
Retrieves all currently active bus tracking sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "buses": [
      {
        "id": "uuid-string",
        "busNumber": "CVR101",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "accuracy": 10.0,
        "lastUpdated": "2025-09-07T15:30:00Z",
        "secondsSinceUpdate": 45
      }
    ],
    "total": 1
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `INTERNAL_SERVER_ERROR` (500): Database or server error

### GET /buses/{busNumber}
Retrieves location data for a specific bus by bus number.

**Parameters:**
- `busNumber` (path): The bus number to look up (e.g., "CVR101")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "busNumber": "CVR101", 
    "latitude": 17.3850,
    "longitude": 78.4867,
    "accuracy": 10.0,
    "lastUpdated": "2025-09-07T15:30:00Z",
    "secondsSinceUpdate": 45
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `INVALID_BUS_NUMBER` (400): Bus number parameter missing
- `BUS_NOT_FOUND` (404): No active tracker found for this bus
- `INTERNAL_SERVER_ERROR` (500): Database or server error

## Tracker Session Endpoints

### POST /tracker/start
Starts a new tracking session for a bus.

**Request Body:**
```json
{
  "busNumber": "CVR101",
  "latitude": 17.3850,
  "longitude": 78.4867,
  "accuracy": 10.0
}
```

**Validation Rules:**
- `busNumber`: 1-10 alphanumeric characters
- `latitude`: Number between -90 and 90
- `longitude`: Number between -180 and 180  
- `accuracy`: Positive number (optional, defaults to 10.0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-string",
    "busNumber": "CVR101",
    "trackerId": "uuid-string", 
    "isActive": true,
    "startedAt": "2025-09-07T15:30:00Z",
    "expiresAt": "2025-09-08T15:30:00Z"
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `MISSING_REQUIRED_FIELDS` (400): Required field missing
- `INVALID_BUS_NUMBER` (400): Invalid bus number format
- `INVALID_COORDINATES` (400): Invalid latitude/longitude values
- `BUS_ALREADY_TRACKED` (409): Bus is already being tracked by another session
- `INTERNAL_SERVER_ERROR` (500): Database or server error

### POST /tracker/update
Updates the location for an active tracking session.

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "latitude": 17.3850,
  "longitude": 78.4867,
  "accuracy": 10.0
}
```

**Validation Rules:**
- `sessionId`: Valid UUID format
- `latitude`: Number between -90 and 90
- `longitude`: Number between -180 and 180
- `accuracy`: Positive number (optional, defaults to 10.0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-string",
    "updated": true,
    "timestamp": "2025-09-07T15:30:00Z"
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `MISSING_REQUIRED_FIELDS` (400): Required field missing
- `INVALID_SESSION_ID` (400): Invalid session ID format
- `INVALID_COORDINATES` (400): Invalid latitude/longitude values
- `SESSION_NOT_FOUND` (404): Active tracking session not found
- `INTERNAL_SERVER_ERROR` (500): Database or server error

### POST /tracker/stop
Stops an active tracking session.

**Request Body:**
```json
{
  "sessionId": "uuid-string"
}
```

**Validation Rules:**
- `sessionId`: Valid UUID format

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-string",
    "stopped": true,
    "timestamp": "2025-09-07T15:30:00Z"
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

**Error Codes:**
- `MISSING_REQUIRED_FIELDS` (400): Required field missing  
- `INVALID_SESSION_ID` (400): Invalid session ID format
- `SESSION_NOT_FOUND` (404): Active tracking session not found
- `INTERNAL_SERVER_ERROR` (500): Database or server error

## Error Codes Reference

| Code | Description |
|------|-------------|
| `INVALID_BUS_NUMBER` | Bus number format is invalid |
| `INVALID_COORDINATES` | Latitude/longitude values are invalid |
| `INVALID_SESSION_ID` | Session ID format is invalid |
| `MISSING_REQUIRED_FIELDS` | Required request field is missing |
| `BUS_ALREADY_TRACKED` | Bus is already being tracked |
| `SESSION_NOT_FOUND` | Tracking session does not exist |
| `BUS_NOT_FOUND` | Bus location not found |
| `DATABASE_CONNECTION_FAILED` | Database connection error |
| `DATABASE_QUERY_FAILED` | Database query error |
| `CONSTRAINT_VIOLATION` | Database constraint violation |
| `INTERNAL_SERVER_ERROR` | General server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| `HEALTH_CHECK_FAILED` | Health check endpoint failure |
| `DATABASE_HEALTH_CHECK_FAILED` | Database health check failure |

## Database Schema

### bus_sessions Table
```sql
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

-- Unique constraint: Only one active tracker per bus
CREATE UNIQUE INDEX idx_unique_active_tracker 
    ON bus_sessions (bus_number) 
    WHERE is_active = true;
```

## Rate Limits

The API implements rate limiting to prevent abuse and ensure fair usage:

| Endpoint Category | Limit | Window | Error Code |
|-------------------|-------|---------|------------|
| Health Check (`/health/*`) | 30 requests | 1 minute | `HEALTH_CHECK_RATE_LIMIT_EXCEEDED` |
| Consumer Endpoints (`/buses/*`) | 300 requests | 1 minute | `CONSUMER_RATE_LIMIT_EXCEEDED` |
| Tracker Endpoints (`/tracker/*`) | 200 requests | 1 minute | `TRACKER_RATE_LIMIT_EXCEEDED` |

Rate limit responses include the following headers:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the window resets

Rate limit exceeded responses (HTTP 429):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "windowMs": 60000,
      "retryAfter": "Wait 1 minute before retrying",
      "ip": "192.168.1.1"
    }
  },
  "timestamp": "2025-09-07T15:30:00Z"
}
```

## Session Management

- Sessions automatically expire after 24 hours
- Only one active tracking session is allowed per bus number
- Inactive sessions are automatically cleaned up by background processes

## Integration Notes

- All timestamps are in ISO 8601 format with timezone information
- Geographic coordinates use decimal degrees format
- Session IDs use UUID v4 format
- Bus numbers are alphanumeric strings, 1-10 characters
- Location accuracy is measured in meters