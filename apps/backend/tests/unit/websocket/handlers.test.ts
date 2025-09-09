import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import { TrackingHandlers } from '../../../src/websocket/handlers/trackingHandlers';
import { ConsumerHandlers } from '../../../src/websocket/handlers/consumerHandlers';
import { ConnectionHandlers } from '../../../src/websocket/handlers/connectionHandlers';
import { WebSocketService } from '../../../src/services/websocketService';
import { RoomManager } from '../../../src/websocket/rooms';
import { databaseService } from '../../../src/services/databaseService';
import eventFixtures from '../../fixtures/websocket-events.json';
import sessionFixtures from '../../fixtures/session-data.json';

// Mock database service
jest.mock('../../../src/services/databaseService');
const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('WebSocket Handlers', () => {
  let httpServer: any;
  let io: Server;
  let clientSocket: any;
  let serverSocket: Socket;
  let trackingHandlers: TrackingHandlers;
  let consumerHandlers: ConsumerHandlers;
  let connectionHandlers: ConnectionHandlers;
  let websocketService: WebSocketService;
  let roomManager: RoomManager;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    
    // Initialize services and handlers
    websocketService = new WebSocketService(io);
    roomManager = websocketService.getRoomManager();
    trackingHandlers = new TrackingHandlers(io, websocketService);
    consumerHandlers = new ConsumerHandlers(io, websocketService);
    connectionHandlers = new ConnectionHandlers(io, roomManager);

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = new Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TrackingHandlers', () => {
    beforeEach(() => {
      trackingHandlers.registerHandlers(serverSocket);
    });

    describe('location-update event', () => {
      it('should process valid location update', (done) => {
        const locationData = eventFixtures.locationUpdate.valid;
        const mockSession = sessionFixtures.activeSessions[0];

        mockDatabaseService.findActiveSession.mockResolvedValue(mockSession);
        mockDatabaseService.updateSession.mockResolvedValue();

        serverSocket.on('location-update-ack', (data) => {
          expect(data.busNumber).toBe(locationData.busNumber);
          expect(data.timestamp).toBe(locationData.timestamp);
          expect(data.processed).toBeDefined();
          done();
        });

        clientSocket.emit('location-update', locationData);
      });

      it('should reject location update with invalid latitude', (done) => {
        const locationData = eventFixtures.locationUpdate.invalid.invalidLatitude;

        serverSocket.on('location-update-error', (data) => {
          expect(data.error).toContain('latitude');
          done();
        });

        clientSocket.emit('location-update', locationData);
      });

      it('should reject location update with invalid longitude', (done) => {
        const locationData = eventFixtures.locationUpdate.invalid.invalidLongitude;

        serverSocket.on('location-update-error', (data) => {
          expect(data.error).toContain('longitude');
          done();
        });

        clientSocket.emit('location-update', locationData);
      });

      it('should reject location update with poor accuracy', (done) => {
        const locationData = eventFixtures.locationUpdate.invalid.poorAccuracy;

        serverSocket.on('location-update-error', (data) => {
          expect(data.error).toContain('accuracy');
          done();
        });

        clientSocket.emit('location-update', locationData);
      });

      it('should reject location update with expired session', (done) => {
        const locationData = eventFixtures.locationUpdate.valid;
        
        mockDatabaseService.findActiveSession.mockResolvedValue(null);

        serverSocket.on('session-expired', (data) => {
          expect(data.error).toContain('expired');
          expect(data.sessionId).toBe(locationData.sessionId);
          expect(data.busNumber).toBe(locationData.busNumber);
          done();
        });

        clientSocket.emit('location-update', locationData);
      });
    });

    describe('end-tracking-session event', () => {
      it('should end tracking session successfully', (done) => {
        const sessionData = {
          sessionId: sessionFixtures.activeSessions[0].id,
          busNumber: sessionFixtures.activeSessions[0].bus_number
        };

        mockDatabaseService.findActiveSession.mockResolvedValue(sessionFixtures.activeSessions[0]);
        mockDatabaseService.deactivateSession.mockResolvedValue();

        serverSocket.on('tracking-session-ended', (data) => {
          expect(data.busNumber).toBe(sessionData.busNumber);
          expect(data.sessionId).toBe(sessionData.sessionId);
          expect(data.timestamp).toBeDefined();
          done();
        });

        clientSocket.emit('end-tracking-session', sessionData);
      });

      it('should handle session not found', (done) => {
        const sessionData = {
          sessionId: 'non-existent-session',
          busNumber: '12'
        };

        mockDatabaseService.findActiveSession.mockResolvedValue(null);

        serverSocket.on('session-not-found', (data) => {
          expect(data.error).toContain('not found');
          expect(data.sessionId).toBe(sessionData.sessionId);
          done();
        });

        clientSocket.emit('end-tracking-session', sessionData);
      });
    });

    describe('tracker-heartbeat event', () => {
      it('should acknowledge valid heartbeat', (done) => {
        const heartbeatData = {
          sessionId: sessionFixtures.activeSessions[0].id,
          busNumber: sessionFixtures.activeSessions[0].bus_number
        };

        mockDatabaseService.findActiveSession.mockResolvedValue(sessionFixtures.activeSessions[0]);

        serverSocket.on('tracker-heartbeat-ack', (data) => {
          expect(data.busNumber).toBe(heartbeatData.busNumber);
          expect(data.sessionId).toBe(heartbeatData.sessionId);
          expect(data.status).toBe('active');
          done();
        });

        clientSocket.emit('tracker-heartbeat', heartbeatData);
      });

      it('should handle expired session in heartbeat', (done) => {
        const heartbeatData = {
          sessionId: 'expired-session',
          busNumber: '12'
        };

        mockDatabaseService.findActiveSession.mockResolvedValue(null);

        serverSocket.on('session-expired', (data) => {
          expect(data.error).toContain('expired');
          expect(data.sessionId).toBe(heartbeatData.sessionId);
          done();
        });

        clientSocket.emit('tracker-heartbeat', heartbeatData);
      });
    });
  });

  describe('ConsumerHandlers', () => {
    beforeEach(() => {
      consumerHandlers.registerHandlers(serverSocket);
    });

    describe('join-bus-room event', () => {
      it('should join bus room successfully', (done) => {
        const joinData = eventFixtures.busRoomOperations.join;
        const mockLocation = sessionFixtures.activeSessions[0];

        mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

        serverSocket.on('bus-room-joined', (data) => {
          expect(data.busNumber).toBe(joinData.busNumber);
          expect(data.hasActiveTracker).toBeDefined();
          expect(data.consumerCount).toBeDefined();
          done();
        });

        clientSocket.emit('join-bus-room', joinData);
      });

      it('should handle no active tracker when joining room', (done) => {
        const joinData = eventFixtures.busRoomOperations.join;

        mockDatabaseService.getActiveBusLocation.mockResolvedValue(null);

        serverSocket.on('no-active-tracker', (data) => {
          expect(data.busNumber).toBe(joinData.busNumber);
          expect(data.message).toContain('No active tracker');
          done();
        });

        clientSocket.emit('join-bus-room', joinData);
      });

      it('should reject invalid bus number', (done) => {
        const joinData = {
          busNumber: 'invalid-999',
          consumerId: 'consumer-123'
        };

        serverSocket.on('join-bus-room-error', (data) => {
          expect(data.error).toContain('Invalid bus number');
          done();
        });

        clientSocket.emit('join-bus-room', joinData);
      });
    });

    describe('leave-bus-room event', () => {
      it('should leave bus room successfully', (done) => {
        const leaveData = eventFixtures.busRoomOperations.leave;

        serverSocket.on('bus-room-left', (data) => {
          expect(data.busNumber).toBe(leaveData.busNumber);
          expect(data.consumerCount).toBeDefined();
          done();
        });

        clientSocket.emit('leave-bus-room', leaveData);
      });
    });

    describe('get-current-location event', () => {
      it('should return current location if available', (done) => {
        const locationRequest = { busNumber: '12' };
        const mockLocation = sessionFixtures.activeSessions[0];

        mockDatabaseService.getActiveBusLocation.mockResolvedValue(mockLocation);

        serverSocket.on('current-location', (data) => {
          expect(data.busNumber).toBe(locationRequest.busNumber);
          expect(data.latitude).toBe(mockLocation.latitude);
          expect(data.longitude).toBe(mockLocation.longitude);
          expect(data.accuracy).toBe(mockLocation.accuracy);
          done();
        });

        clientSocket.emit('get-current-location', locationRequest);
      });

      it('should handle no active tracker for location request', (done) => {
        const locationRequest = { busNumber: '99' };

        mockDatabaseService.getActiveBusLocation.mockResolvedValue(null);

        serverSocket.on('no-active-tracker', (data) => {
          expect(data.busNumber).toBe(locationRequest.busNumber);
          expect(data.message).toContain('No active tracker');
          done();
        });

        clientSocket.emit('get-current-location', locationRequest);
      });
    });

    describe('consumer-heartbeat event', () => {
      it('should acknowledge consumer heartbeat', (done) => {
        const heartbeatData = {
          busNumber: '12',
          consumerId: 'consumer-123'
        };

        // First join the room so heartbeat can find the consumer
        roomManager.addConsumerToRoom(heartbeatData.busNumber, serverSocket.id);

        serverSocket.on('consumer-heartbeat-ack', (data) => {
          expect(data.busNumber).toBe(heartbeatData.busNumber);
          expect(data.consumerId).toBe(heartbeatData.consumerId);
          expect(data.timestamp).toBeDefined();
          done();
        });

        clientSocket.emit('consumer-heartbeat', heartbeatData);
      });
    });
  });
});