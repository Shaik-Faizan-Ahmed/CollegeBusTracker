import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { WebSocketServer } from '../../../src/websocket';
import { databaseService } from '../../../src/services/databaseService';
import eventFixtures from '../../fixtures/websocket-events.json';
import sessionFixtures from '../../fixtures/session-data.json';

// Mock database service
jest.mock('../../../src/services/databaseService');
const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('Real-time Broadcasting Tests', () => {
  let httpServer: any;
  let webSocketServer: WebSocketServer;
  let trackerClient: any;
  let consumers: any[] = [];
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
    consumers = [];
  });

  afterEach((done) => {
    if (trackerClient && trackerClient.connected) {
      trackerClient.disconnect();
    }
    consumers.forEach(consumer => {
      if (consumer && consumer.connected) {
        consumer.disconnect();
      }
    });
    consumers = [];
    setTimeout(done, 200);
  });

  describe('Broadcasting Performance', () => {
    it('should broadcast location updates to multiple consumers simultaneously', (done) => {
      const busNumber = '12';
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      const consumerCount = 5;
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      let consumersJoined = 0;
      let consumersReceivedUpdate = 0;
      const startTime = Date.now();

      // Create multiple consumers
      for (let i = 0; i < consumerCount; i++) {
        const consumer = new Client(`http://localhost:${port}`);
        consumers.push(consumer);

        consumer.on('connect', () => {
          consumer.emit('authenticate', {
            type: 'consumer',
            busNumber,
            consumerId: `consumer-${i}`
          });
        });

        consumer.on('consumer-authenticated', () => {
          consumer.emit('join-bus-room', {
            busNumber,
            consumerId: `consumer-${i}`
          });
        });

        consumer.on('bus-room-joined', () => {
          consumersJoined++;
          
          if (consumersJoined === consumerCount) {
            // All consumers joined, now create tracker
            setupTracker();
          }
        });

        consumer.on('location-updated', (data) => {
          consumersReceivedUpdate++;
          
          expect(data.busNumber).toBe(busNumber);
          expect(data.latitude).toBe(trackingData.latitude);
          expect(data.longitude).toBe(trackingData.longitude);
          
          if (consumersReceivedUpdate === consumerCount) {
            const endTime = Date.now();
            const broadcastTime = endTime - startTime;
            
            // Broadcasting to 5 consumers should be fast (< 1 second)
            expect(broadcastTime).toBeLessThan(1000);
            
            console.log(`Broadcasting to ${consumerCount} consumers took ${broadcastTime}ms`);
            done();
          }
        });
      }

      function setupTracker() {
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber,
            sessionId: trackingData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          // Start timing from when we send the location update
          setTimeout(() => {
            trackerClient.emit('location-update', trackingData);
          }, 100);
        });
      }
    }, 15000);

    it('should handle rapid location updates without data loss', (done) => {
      const busNumber = '12';
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      const updateCount = 10;
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      let updatesReceived = 0;
      const receivedLatitudes = new Set();

      // Single consumer for this test
      const consumer = new Client(`http://localhost:${port}`);
      consumers.push(consumer);

      consumer.on('connect', () => {
        consumer.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'test-consumer'
        });
      });

      consumer.on('consumer-authenticated', () => {
        consumer.emit('join-bus-room', {
          busNumber,
          consumerId: 'test-consumer'
        });
      });

      consumer.on('bus-room-joined', () => {
        setupTracker();
      });

      consumer.on('location-updated', (data) => {
        updatesReceived++;
        receivedLatitudes.add(data.latitude);
        
        expect(data.busNumber).toBe(busNumber);
        
        if (updatesReceived === updateCount) {
          // Should receive all unique updates
          expect(receivedLatitudes.size).toBe(updateCount);
          done();
        }
      });

      function setupTracker() {
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber,
            sessionId: trackingData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          // Send rapid location updates with slightly different coordinates
          for (let i = 0; i < updateCount; i++) {
            setTimeout(() => {
              const updateData = {
                ...trackingData,
                latitude: trackingData.latitude + (i * 0.001), // Slightly different each time
                timestamp: Date.now()
              };
              trackerClient.emit('location-update', updateData);
            }, i * 50); // 50ms intervals
          }
        });
      }
    }, 15000);
  });

  describe('Broadcasting Accuracy', () => {
    it('should maintain data integrity across broadcasts', (done) => {
      const busNumber = 'A5';
      const trackingData = {
        ...eventFixtures.locationUpdate.valid,
        busNumber: 'A5',
        latitude: 17.123456789, // High precision
        longitude: 78.987654321,
        accuracy: 5.5
      };
      const mockSession = { ...sessionFixtures.activeSessions[1], bus_number: 'A5' };
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      const consumer = new Client(`http://localhost:${port}`);
      consumers.push(consumer);

      consumer.on('connect', () => {
        consumer.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'precision-consumer'
        });
      });

      consumer.on('consumer-authenticated', () => {
        consumer.emit('join-bus-room', {
          busNumber,
          consumerId: 'precision-consumer'
        });
      });

      consumer.on('bus-room-joined', () => {
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber,
            sessionId: trackingData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          trackerClient.emit('location-update', trackingData);
        });
      });

      consumer.on('location-updated', (data) => {
        // Verify exact data integrity
        expect(data.busNumber).toBe(trackingData.busNumber);
        expect(data.latitude).toBe(trackingData.latitude);
        expect(data.longitude).toBe(trackingData.longitude);
        expect(data.accuracy).toBe(trackingData.accuracy);
        expect(data.timestamp).toBe(trackingData.timestamp);
        
        // Verify no data corruption or rounding errors
        expect(typeof data.latitude).toBe('number');
        expect(typeof data.longitude).toBe('number');
        expect(data.latitude.toString()).toContain('123456789');
        expect(data.longitude.toString()).toContain('987654321');
        
        done();
      });
    }, 10000);

    it('should handle edge case coordinates correctly', (done) => {
      const busNumber = '1';
      const edgeCaseData = {
        ...eventFixtures.locationUpdate.valid,
        busNumber: '1',
        latitude: -89.999999, // Near south pole
        longitude: 179.999999, // Near date line
        accuracy: 0.1 // High accuracy
      };
      const mockSession = { ...sessionFixtures.activeSessions[0], bus_number: '1' };
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      const consumer = new Client(`http://localhost:${port}`);
      consumers.push(consumer);

      consumer.on('connect', () => {
        consumer.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'edge-consumer'
        });
      });

      consumer.on('consumer-authenticated', () => {
        consumer.emit('join-bus-room', {
          busNumber,
          consumerId: 'edge-consumer'
        });
      });

      consumer.on('bus-room-joined', () => {
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber,
            sessionId: edgeCaseData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          trackerClient.emit('location-update', edgeCaseData);
        });
      });

      consumer.on('location-updated', (data) => {
        expect(data.latitude).toBe(edgeCaseData.latitude);
        expect(data.longitude).toBe(edgeCaseData.longitude);
        expect(data.accuracy).toBe(edgeCaseData.accuracy);
        
        // Verify coordinates are within valid ranges
        expect(data.latitude).toBeGreaterThanOrEqual(-90);
        expect(data.latitude).toBeLessThanOrEqual(90);
        expect(data.longitude).toBeGreaterThanOrEqual(-180);
        expect(data.longitude).toBeLessThanOrEqual(180);
        
        done();
      });
    }, 10000);
  });

  describe('Broadcasting Latency', () => {
    it('should have minimal latency for location broadcasts', (done) => {
      const busNumber = '12';
      const trackingData = eventFixtures.locationUpdate.valid;
      const mockSession = sessionFixtures.activeSessions[0];
      
      mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockSession);
      mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
      mockDatabaseService.updateSession.mockResolvedValue();

      const consumer = new Client(`http://localhost:${port}`);
      consumers.push(consumer);
      let sendTime: number;

      consumer.on('connect', () => {
        consumer.emit('authenticate', {
          type: 'consumer',
          busNumber,
          consumerId: 'latency-consumer'
        });
      });

      consumer.on('consumer-authenticated', () => {
        consumer.emit('join-bus-room', {
          busNumber,
          consumerId: 'latency-consumer'
        });
      });

      consumer.on('bus-room-joined', () => {
        trackerClient = new Client(`http://localhost:${port}`);
        
        trackerClient.on('connect', () => {
          trackerClient.emit('authenticate', {
            type: 'tracker',
            busNumber,
            sessionId: trackingData.sessionId
          });
        });

        trackerClient.on('tracker-authenticated', () => {
          sendTime = Date.now();
          trackerClient.emit('location-update', trackingData);
        });
      });

      consumer.on('location-updated', () => {
        const receiveTime = Date.now();
        const latency = receiveTime - sendTime;
        
        console.log(`Broadcasting latency: ${latency}ms`);
        
        // Latency should be minimal (< 100ms in local test environment)
        expect(latency).toBeLessThan(100);
        
        done();
      });
    }, 10000);
  });

  describe('Broadcasting Isolation', () => {
    it('should only broadcast to consumers in the correct bus room', (done) => {
      const bus12Data = { ...eventFixtures.locationUpdate.valid, busNumber: '12' };
      const bus25Data = { ...eventFixtures.locationUpdate.valid, busNumber: '25', sessionId: 'session-25' };
      
      const mockSession12 = sessionFixtures.activeSessions[0];
      const mockSession25 = { ...sessionFixtures.activeSessions[1], bus_number: '25', id: 'session-25' };
      
      mockDatabaseService.getActiveBusLocation
        .mockResolvedValueOnce(mockSession12)
        .mockResolvedValueOnce(mockSession25);
        
      mockDatabaseService.findActiveSession
        .mockResolvedValue(mockSession12)
        .mockResolvedValueOnce(mockSession25);
        
      mockDatabaseService.updateSession.mockResolvedValue();

      let bus12UpdateReceived = false;
      let bus25UpdateReceived = false;

      // Consumer for bus 12
      const consumer12 = new Client(`http://localhost:${port}`);
      consumers.push(consumer12);

      consumer12.on('connect', () => {
        consumer12.emit('authenticate', {
          type: 'consumer',
          busNumber: '12',
          consumerId: 'consumer-12'
        });
      });

      consumer12.on('consumer-authenticated', () => {
        consumer12.emit('join-bus-room', {
          busNumber: '12',
          consumerId: 'consumer-12'
        });
      });

      // Consumer for bus 25
      const consumer25 = new Client(`http://localhost:${port}`);
      consumers.push(consumer25);

      consumer25.on('connect', () => {
        consumer25.emit('authenticate', {
          type: 'consumer',
          busNumber: '25',
          consumerId: 'consumer-25'
        });
      });

      consumer25.on('consumer-authenticated', () => {
        consumer25.emit('join-bus-room', {
          busNumber: '25',
          consumerId: 'consumer-25'
        });
      });

      let roomsJoined = 0;
      
      consumer12.on('bus-room-joined', () => {
        roomsJoined++;
        checkBothJoined();
      });

      consumer25.on('bus-room-joined', () => {
        roomsJoined++;
        checkBothJoined();
      });

      function checkBothJoined() {
        if (roomsJoined === 2) {
          // Setup tracker for bus 12
          trackerClient = new Client(`http://localhost:${port}`);
          
          trackerClient.on('connect', () => {
            trackerClient.emit('authenticate', {
              type: 'tracker',
              busNumber: '12',
              sessionId: bus12Data.sessionId
            });
          });

          trackerClient.on('tracker-authenticated', () => {
            // Send location update for bus 12
            trackerClient.emit('location-update', bus12Data);
          });
        }
      }

      // Only consumer12 should receive the update
      consumer12.on('location-updated', (data) => {
        bus12UpdateReceived = true;
        expect(data.busNumber).toBe('12');
        
        // Wait a moment to ensure consumer25 doesn't receive it
        setTimeout(() => {
          expect(bus12UpdateReceived).toBe(true);
          expect(bus25UpdateReceived).toBe(false);
          done();
        }, 500);
      });

      // This should not be called
      consumer25.on('location-updated', () => {
        bus25UpdateReceived = true;
        fail('Consumer 25 should not receive updates for bus 12');
      });
    }, 15000);
  });
});