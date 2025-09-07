# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: CVR College Bus Tracker API
  version: 1.0.0
  description: REST API for real-time bus tracking with peer-to-peer sessions
servers:
  - url: https://cvr-bus-tracker.onrender.com/api
    description: Production server (Render.com)
  - url: http://localhost:3000/api
    description: Development server

paths:
  /health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: Server is healthy

  /buses/{busNumber}:
    get:
      summary: Get current location of a specific bus
      parameters:
        - name: busNumber
          in: path
          required: true
          schema:
            type: string
          example: "12"
      responses:
        '200':
          description: Bus location found
        '404':
          description: No active tracker for this bus

  /buses/active:
    get:
      summary: Get all currently active buses
      responses:
        '200':
          description: List of active buses

  /tracker/start:
    post:
      summary: Start tracking a bus (become a tracker)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - busNumber
                - latitude
                - longitude
              properties:
                busNumber:
                  type: string
                  example: "12"
                latitude:
                  type: number
                  example: 17.3850
                longitude:
                  type: number
                  example: 78.4867
      responses:
        '201':
          description: Tracking session started successfully
        '409':
          description: Bus already has an active tracker

  /tracker/update:
    post:
      summary: Update tracker location
      responses:
        '200':
          description: Location updated successfully
        '404':
          description: Invalid session ID

  /tracker/stop:
    post:
      summary: Stop tracking session
      responses:
        '200':
          description: Tracking session stopped
```

## WebSocket API Specification

### Events - Tracker to Server
```typescript
// Send location update (trackers only)
socket.emit('location-update', {
  busNumber: '12',
  latitude: 17.3850,
  longitude: 78.4867,
  accuracy: 10.5,
  timestamp: Date.now()
});
```

### Events - Server to Clients  
```typescript
// Location update broadcast (to all consumers of this bus)
socket.on('location-updated', (data) => {
  // data: { busNumber, latitude, longitude, accuracy, timestamp }
});

// Tracker disconnected
socket.on('tracker-disconnected', (data) => {
  // data: { busNumber, reason: 'session_ended' | 'connection_lost' }
});
```
