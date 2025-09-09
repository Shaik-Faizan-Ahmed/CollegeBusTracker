import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { WebSocketServer } from '../../../src/websocket';
import { databaseService } from '../../../src/services/databaseService';
import eventFixtures from '../../fixtures/websocket-events.json';
import sessionFixtures from '../../fixtures/session-data.json';

// Mock database service
jest.mock('../../../src/services/databaseService');
const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('WebSocket Tracking Integration Tests', () => {
  let httpServer: any;
  let webSocketServer: WebSocketServer;
  let trackerClient: ClientSocket;
  let consumerClient: ClientSocket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    webSocketServer = new WebSocketServer(httpServer);

    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      done();
    });
  });

  afterAll(() => {
    webSocketServer.getIO().close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach((done) => {
    if (trackerClient && trackerClient.connected) {
      trackerClient.disconnect();
    }
    if (consumerClient && consumerClient.connected) {
      consumerClient.disconnect();
    }
    setTimeout(done, 100); // Give time for cleanup
  });

  describe('Full Tracking Flow', () => {
    it('should handle complete tracker-to-consumer flow', (done) => {
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);

      let trackerAuthenticated = false;
      let consumerJoined = false;
      let locationReceived = false;

      // Create tracker client
      trackerClient = new Client(`http://localhost:${port}`);
      
      trackerClient.on('connect', () => {
        // Authenticate as tracker
        trackerClient.emit('authenticate', {
          type: 'tracker',
          busNumber: trackingData.busNumber,
          sessionId: trackingData.sessionId
        });
      });

      trackerClient.on('tracker-authenticated', () => {
        trackerAuthenticated = true;
        
        // Create consumer client after tracker is authenticated
        consumerClient = new Client(`http://localhost:${port}`);
        
        consumerClient.on('connect', () => {
          // Authenticate as consumer
          consumerClient.emit('authenticate', {
            type: 'consumer',
            busNumber: trackingData.busNumber,
            consumerId: 'test-consumer'
          });
        });

        consumerClient.on('consumer-authenticated', () => {
          // Join bus room
          consumerClient.emit('join-bus-room', {
            busNumber: trackingData.busNumber,
            consumerId: 'test-consumer'
          });
        });

        consumerClient.on('bus-room-joined', () => {
          consumerJoined = true;
          
          // Send location update from tracker
          trackerClient.emit('location-update', trackingData);
        });

        consumerClient.on('location-updated', (data) => {
          locationReceived = true;
          
          expect(data.busNumber).toBe(trackingData.busNumber);
          expect(data.latitude).toBe(trackingData.latitude);
          expect(data.longitude).toBe(trackingData.longitude);
          expect(data.accuracy).toBe(trackingData.accuracy);
          
          // Verify all steps completed
          expect(trackerAuthenticated).toBe(true);
          expect(consumerJoined).toBe(true);
          expect(locationReceived).toBe(true);
          
          done();
        });
      });

      trackerClient.on('location-update-ack', (data) => {
        expect(data.busNumber).toBe(trackingData.busNumber);
        expect(data.timestamp).toBe(trackingData.timestamp);
      });
    }, 10000);

    it('should handle tracker disconnection and notify consumers', (done) => {
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.deactivateSession.mockResolvedValue();
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(null);

      let consumerNotified = false;

      // Create consumer client first
      consumerClient = new Client(`http://localhost:${port}`);
      
      consumerClient.on('connect', () => {
        consumerClient.emit('authenticate', {
          type: 'consumer',
          busNumber: trackingData.busNumber,
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('consumer-authenticated', () => {
        consumerClient.emit('join-bus-room', {
          busNumber: trackingData.busNumber,
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('bus-room-joined', () => {
        // Now create tracker
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber: trackingData.busNumber,
            sessionId: trackingData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          // End tracking session to trigger disconnection
          trackerClient.emit('end-tracking-session', {
            sessionId: trackingData.sessionId,
            busNumber: trackingData.busNumber
          });
        });
      });

      consumerClient.on('tracker-disconnected', (data) => {
        consumerNotified = true;
        
        expect(data.busNumber).toBe(trackingData.busNumber);
        expect(data.reason).toBe('session_ended');
        expect(data.timestamp).toBeDefined();
        
        expect(consumerNotified).toBe(true);
        done();
      });
    }, 10000);

    it('should reject multiple trackers for same bus', (done) => {
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);

      let firstTrackerAuthenticated = false;
      let secondTrackerRejected = false;

      // First tracker
      trackerClient = new Client(`http://localhost:${port}`);
      
      trackerClient.on('connect', () => {
        trackerClient.emit('authenticate', {
          type: 'tracker',
          busNumber: trackingData.busNumber,
          sessionId: trackingData.sessionId
        });
      });

      trackerClient.on('tracker-authenticated', () => {
        firstTrackerAuthenticated = true;
        
        // Try to add second tracker for same bus
        const secondTracker = new Client(`http://localhost:${port}`);
        
        secondTracker.on('connect', () => {
          secondTracker.emit('authenticate', {
            type: 'tracker',
            busNumber: trackingData.busNumber,
            sessionId: 'different-session-id'
          });
        });

        secondTracker.on('tracker-conflict', (data) => {
          secondTrackerRejected = true;
          
          expect(data.error).toContain('already has an active tracker');
          expect(data.busNumber).toBe(trackingData.busNumber);
          
          expect(firstTrackerAuthenticated).toBe(true);
          expect(secondTrackerRejected).toBe(true);
          
          secondTracker.disconnect();
          done();
        });
      });
    }, 10000);
  });

  describe('Error Scenarios', () => {
    it('should handle authentication failure', (done) => {
      trackerClient = new Client(`http://localhost:${port}`);
      
      trackerClient.on('connect', () => {
        // Try to authenticate with invalid data
        trackerClient.emit('authenticate', {
          type: 'tracker',
          busNumber: 'invalid-bus',
          sessionId: 'session-123'
        });
      });

      trackerClient.on('authentication-error', (data) => {
        expect(data.error).toContain('Invalid bus number');
        done();
      });

      trackerClient.on('disconnect', () => {
        // Expected after authentication failure
      });
    }, 5000);

    it('should handle session expiry during location update', (done) => {
      const trackingData = eventFixtures.locationUpdate.valid;
      
      // First return active session, then return null to simulate expiry
      mockDatabaseService.findActiveSession
        .mockResolvedValueOnce(sessionFixtures.activeSessions[0])
        .mockResolvedValueOnce(null);

      trackerClient = new Client(`http://localhost:${port}`);
      
      trackerClient.on('connect', () => {
        trackerClient.emit('authenticate', {
          type: 'tracker',
          busNumber: trackingData.busNumber,
          sessionId: trackingData.sessionId
        });
      });

      trackerClient.on('tracker-authenticated', () => {
        // Send location update - should fail due to expired session
        trackerClient.emit('location-update', trackingData);
      });

      trackerClient.on('session-expired', (data) => {
        expect(data.error).toContain('expired');
        expect(data.sessionId).toBe(trackingData.sessionId);
        expect(data.busNumber).toBe(trackingData.busNumber);
        done();
      });

      trackerClient.on('disconnect', () => {
        // Expected after session expiry
      });
    }, 5000);
  });

  describe('Consumer Operations', () => {
    it('should handle consumer joining room with no active tracker', (done) => {
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(null);

      consumerClient = new Client(`http://localhost:${port}`);
      
      consumerClient.on('connect', () => {
        consumerClient.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('consumer-authenticated', () => {
        consumerClient.emit('join-bus-room', {
          busNumber: '12',
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('no-active-tracker', (data) => {
        expect(data.busNumber).toBe('12');
        expect(data.message).toContain('No active tracker');
        done();
      });
    }, 5000);

    it('should provide current location when consumer joins room with active tracker', (done) => {
      const mockLocation = sessionFixtures.activeSessions[0];
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

      consumerClient = new Client(`http://localhost:${port}`);
      
      consumerClient.on('connect', () => {
        consumerClient.emit('authenticate', {
          type: 'consumer',
          busNumber: mockLocation.bus_number,
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('consumer-authenticated', () => {
        consumerClient.emit('join-bus-room', {
          busNumber: mockLocation.bus_number,
          consumerId: 'test-consumer'
        });
      });

      consumerClient.on('current-location', (data) => {
        expect(data.busNumber).toBe(mockLocation.bus_number);
        expect(data.latitude).toBe(mockLocation.latitude);
        expect(data.longitude).toBe(mockLocation.longitude);
        expect(data.accuracy).toBe(mockLocation.accuracy);
        done();
      });
    }, 5000);
  });
});