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

describe('WebSocket Consumer Integration Tests', () => {
  let httpServer: any;
  let webSocketServer: WebSocketServer;
  let consumer1Client: ClientSocket;
  let consumer2Client: ClientSocket;
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
    if (consumer1Client && consumer1Client.connected) {
      consumer1Client.disconnect();
    }
    if (consumer2Client && consumer2Client.connected) {
      consumer2Client.disconnect();
    }
    setTimeout(done, 100);
  });

  describe('Multiple Consumer Operations', () => {
    it('should allow multiple consumers to join same bus room', (done) => {
      const busNumber = '12';
      const mockLocation = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

      let consumer1Joined = false;
      let consumer2Joined = false;

      // Consumer 1
      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('join-bus-room', {
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('bus-room-joined', (data: any) => {
        consumer1Joined = true;
        expect(data.busNumber).toBe(busNumber);
        expect(data.consumerCount).toBe(1);
        
        // Now add second consumer
        consumer2Client = new Client(`http://localhost:${port}`);
        
        consumer2Client.on('connect', () => {
          consumer2Client.emit('authenticate', {
            type: 'consumer',
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('consumer-authenticated', () => {
          consumer2Client.emit('join-bus-room', {
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('bus-room-joined', (data: any) => {
          consumer2Joined = true;
          expect(data.busNumber).toBe(busNumber);
          expect(data.consumerCount).toBe(2);
          
          expect(consumer1Joined).toBe(true);
          expect(consumer2Joined).toBe(true);
          done();
        });
      });
    }, 10000);

    it('should handle consumer leaving room and update count', (done) => {
      const busNumber = '12';
      const mockLocation = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

      let bothJoined = false;
      let consumer1Left = false;

      // Consumer 1
      consumer1Client = new Client(`http://localhost:${port}`);
      consumer2Client = new Client(`http://localhost:${port}`);

      // Join both consumers first
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('join-bus-room', {
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('bus-room-joined', () => {
        consumer2Client.on('connect', () => {
          consumer2Client.emit('authenticate', {
            type: 'consumer',
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('consumer-authenticated', () => {
          consumer2Client.emit('join-bus-room', {
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('bus-room-joined', (data: any) => {
          bothJoined = true;
          expect(data.consumerCount).toBe(2);
          
          // Now have consumer 1 leave
          consumer1Client.emit('leave-bus-room', {
            busNumber,
            consumerId: 'consumer-1'
          });
        });

        consumer2Client.connect();
      });

      consumer1Client.on('bus-room-left', (data: any) => {
        consumer1Left = true;
        expect(data.busNumber).toBe(busNumber);
        expect(data.consumerCount).toBe(1);
        
        expect(bothJoined).toBe(true);
        expect(consumer1Left).toBe(true);
        done();
      });
    }, 10000);

    it('should broadcast location updates to all consumers in room', (done) => {
      const busNumber = '12';
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      let consumer1ReceivedUpdate = false;
      let consumer2ReceivedUpdate = false;
      let trackerClient: ClientSocket;

      // Setup consumers first
      consumer1Client = new Client(`http://localhost:${port}`);
      consumer2Client = new Client(`http://localhost:${port}`);

      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('join-bus-room', {
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('bus-room-joined', () => {
        consumer2Client.on('connect', () => {
          consumer2Client.emit('authenticate', {
            type: 'consumer',
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('consumer-authenticated', () => {
          consumer2Client.emit('join-bus-room', {
            busNumber,
            consumerId: 'consumer-2'
          });
        });

        consumer2Client.on('bus-room-joined', () => {
          // Now setup tracker to send location update
          trackerClient = new Client(`http://localhost:${port}`);
          
          trackerClient.on('connect', () => {
            trackerClient.emit('authenticate', {
              type: 'tracker',
              busNumber,
              sessionId: trackingData.sessionId
            });
          });

          trackerClient.on('tracker-authenticated', () => {
            // Send location update
            trackerClient.emit('location-update', trackingData);
          });
        });

        consumer2Client.connect();
      });

      // Both consumers should receive the location update
      consumer1Client.on('location-updated', (data: any) => {
        consumer1ReceivedUpdate = true;
        expect(data.busNumber).toBe(busNumber);
        expect(data.latitude).toBe(trackingData.latitude);
        
        checkCompletion();
      });

      consumer2Client.on('location-updated', (data: any) => {
        consumer2ReceivedUpdate = true;
        expect(data.busNumber).toBe(busNumber);
        expect(data.latitude).toBe(trackingData.latitude);
        
        checkCompletion();
      });

      function checkCompletion() {
        if (consumer1ReceivedUpdate && consumer2ReceivedUpdate) {
          if (trackerClient) trackerClient.disconnect();
          done();
        }
      }
    }, 15000);
  });

  describe('Consumer Error Handling', () => {
    it('should handle invalid bus number in join room request', (done) => {
      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        // Try to join room with invalid bus number
        consumer1Client.emit('join-bus-room', {
          busNumber: 'invalid-999',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('join-bus-room-error', (data: any) => {
        expect(data.error).toContain('Invalid bus number format');
        expect(data.busNumber).toBe('invalid-999');
        expect(data.consumerId).toBe('consumer-1');
        done();
      });
    }, 5000);

    it('should handle missing consumer ID in room operations', (done) => {
      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        // Try to join room without consumer ID
        consumer1Client.emit('join-bus-room', {
          busNumber: '12'
          // Missing consumerId
        });
      });

      consumer1Client.on('join-bus-room-error', (data: any) => {
        expect(data.error).toContain('Consumer ID is required');
        done();
      });
    }, 5000);

    it('should handle database errors during room operations', (done) => {
      mockDatabaseService.getActiveBusLocation.mockRejectedValue(new Error('Database error'));

      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('join-bus-room', {
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('location-fetch-warning', (data: any) => {
        expect(data.message).toContain('could not fetch current location');
        done();
      });
    }, 5000);
  });

  describe('Consumer Heartbeat', () => {
    it('should handle consumer heartbeat correctly', (done) => {
      const busNumber = '12';
      const mockLocation = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('join-bus-room', {
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('bus-room-joined', () => {
        // Send heartbeat
        consumer1Client.emit('consumer-heartbeat', {
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-heartbeat-ack', (data: any) => {
        expect(data.busNumber).toBe(busNumber);
        expect(data.consumerId).toBe('consumer-1');
        expect(data.timestamp).toBeDefined();
        expect(data.roomActive).toBe(false); // No active tracker
        expect(data.consumerCount).toBe(1);
        done();
      });
    }, 5000);

    it('should handle heartbeat from consumer not in room', (done) => {
      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        // Send heartbeat without joining room first
        consumer1Client.emit('consumer-heartbeat', {
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-not-in-room', (data: any) => {
        expect(data.busNumber).toBe('12');
        expect(data.consumerId).toBe('consumer-1');
        expect(data.message).toContain('not found in room');
        done();
      });
    }, 5000);
  });

  describe('Current Location Requests', () => {
    it('should provide current location on request', (done) => {
      const busNumber = '12';
      const mockLocation = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        // Request current location
        consumer1Client.emit('get-current-location', {
          busNumber
        });
      });

      consumer1Client.on('current-location', (data: any) => {
        expect(data.busNumber).toBe(busNumber);
        expect(data.latitude).toBe(mockLocation.latitude);
        expect(data.longitude).toBe(mockLocation.longitude);
        expect(data.accuracy).toBe(mockLocation.accuracy);
        expect(data.timestamp).toBeDefined();
        done();
      });
    }, 5000);

    it('should handle current location request for bus with no tracker', (done) => {
      const busNumber = '99';
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(null);

      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('get-current-location', {
          busNumber
        });
      });

      consumer1Client.on('no-active-tracker', (data: any) => {
        expect(data.busNumber).toBe(busNumber);
        expect(data.message).toContain('No active tracker');
        done();
      });
    }, 5000);

    it('should handle invalid bus number in location request', (done) => {
      consumer1Client = new Client(`http://localhost:${port}`);
      
      consumer1Client.on('connect', () => {
        consumer1Client.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-1'
        });
      });

      consumer1Client.on('consumer-authenticated', () => {
        consumer1Client.emit('get-current-location', {
          busNumber: ''
        });
      });

      consumer1Client.on('current-location-error', (data: any) => {
        expect(data.error).toContain('Bus number is required');
        done();
      });
    }, 5000);
  });
});