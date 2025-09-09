import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { 
  validateConnection, 
  validateWebSocketSession 
} from '../../../src/websocket/middleware/websocketAuth';
import { 
  validateLocationUpdate, 
  validateBusRoomData, 
  checkSessionActive 
} from '../../../src/websocket/middleware/sessionValidator';
import { databaseService } from '../../../src/services/databaseService';
import eventFixtures from '../../fixtures/websocket-events.json';
import sessionFixtures from '../../fixtures/session-data.json';

// Mock database service
jest.mock('../../../src/services/databaseService');
const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

describe('WebSocket Middleware', () => {
  let httpServer: any;
  let io: Server;
  let mockSocket: any;

  beforeAll(() => {
    httpServer = createServer();
    io = new Server(httpServer);
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = {
      id: 'mock-socket-id'
    } as Socket;
  });

  describe('validateConnection', () => {
    describe('tracker connections', () => {
      it('should validate valid tracker connection', () => {
        const data = eventFixtures.authentication.tracker.valid;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(true);
        expect(result.connection).toBeDefined();
        expect(result.connection!.type).toBe('tracker');
        expect(result.connection!.busNumber).toBe(data.busNumber);
        expect(result.connection!.sessionId).toBe(data.sessionId);
      });

      it('should reject tracker connection without session ID', () => {
        const data = eventFixtures.authentication.tracker.invalid.missingSessionId;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Session ID is required');
      });

      it('should reject tracker connection with invalid bus number', () => {
        const data = eventFixtures.authentication.tracker.invalid.invalidBusNumber;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid bus number format');
      });
    });

    describe('consumer connections', () => {
      it('should validate valid consumer connection', () => {
        const data = eventFixtures.authentication.consumer.valid;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(true);
        expect(result.connection).toBeDefined();
        expect(result.connection!.type).toBe('consumer');
        expect(result.connection!.busNumber).toBe(data.busNumber);
        expect(result.connection!.sessionId).toBeUndefined();
      });

      it('should reject consumer connection without consumer ID', () => {
        const data = eventFixtures.authentication.consumer.invalid.missingConsumerId;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Consumer ID is required');
      });

      it('should reject consumer connection with invalid bus number', () => {
        const data = eventFixtures.authentication.consumer.invalid.invalidBusNumber;
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid bus number format');
      });
    });

    describe('general validation', () => {
      it('should reject connection without type', () => {
        const data = { busNumber: '12' };
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid connection type');
      });

      it('should reject connection with invalid type', () => {
        const data = { type: 'invalid', busNumber: '12' };
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid connection type');
      });

      it('should reject connection without bus number', () => {
        const data = { type: 'consumer', consumerId: 'consumer-123' };
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Bus number is required');
      });

      it('should reject connection with empty bus number', () => {
        const data = { type: 'consumer', busNumber: '', consumerId: 'consumer-123' };
        const result = validateConnection(mockSocket, data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Bus number is required');
      });
    });

    describe('bus number format validation', () => {
      const validBusNumbers = ['1', '12', '50', 'A1', 'A20', 'B1', 'B20', 'C1', 'C10'];
      const invalidBusNumbers = ['0', '51', '999', 'A0', 'A21', 'B21', 'C11', 'D1', 'AA1'];

      validBusNumbers.forEach(busNumber => {
        it(`should accept valid bus number: ${busNumber}`, () => {
          const data = { type: 'consumer', busNumber, consumerId: 'consumer-123' };
          const result = validateConnection(mockSocket, data);
          
          expect(result.isValid).toBe(true);
        });
      });

      invalidBusNumbers.forEach(busNumber => {
        it(`should reject invalid bus number: ${busNumber}`, () => {
          const data = { type: 'consumer', busNumber, consumerId: 'consumer-123' };
          const result = validateConnection(mockSocket, data);
          
          expect(result.isValid).toBe(false);
          expect(result.error).toContain('Invalid bus number format');
        });
      });
    });
  });

  describe('validateWebSocketSession', () => {
    it('should validate active tracker session', async () => {
      const sessionData = { sessionId: 'session-123', type: 'tracker' };
      mockDatabaseService.findActiveSession.mockResolvedValue(sessionFixtures.activeSessions[0]);
      
      const result = await validateWebSocketSession(mockSocket, sessionData);
      
      expect(result).toBe(true);
      expect(mockDatabaseService.findActiveSession).toHaveBeenCalledWith('session-123');
    });

    it('should reject inactive tracker session', async () => {
      const sessionData = { sessionId: 'session-123', type: 'tracker' };
      mockDatabaseService.findActiveSession.mockResolvedValue(null);
      
      const result = await validateWebSocketSession(mockSocket, sessionData);
      
      expect(result).toBe(false);
    });

    it('should validate consumer without session validation', async () => {
      const sessionData = { type: 'consumer' };
      
      const result = await validateWebSocketSession(mockSocket, sessionData);
      
      expect(result).toBe(true);
      expect(mockDatabaseService.findActiveSession).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const sessionData = { sessionId: 'session-123', type: 'tracker' };
      mockDatabaseService.findActiveSession.mockRejectedValue(new Error('Database error'));
      
      const result = await validateWebSocketSession(mockSocket, sessionData);
      
      expect(result).toBe(false);
    });
  });

  describe('validateLocationUpdate', () => {
    it('should validate correct location update', () => {
      const data = eventFixtures.locationUpdate.valid;
      const result = validateLocationUpdate(data);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject location update without bus number', () => {
      const data = { ...eventFixtures.locationUpdate.valid, busNumber: undefined };
      const result = validateLocationUpdate(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Bus number');
    });

    it('should reject location update without session ID', () => {
      const data = { ...eventFixtures.locationUpdate.valid, sessionId: undefined };
      const result = validateLocationUpdate(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('session ID');
    });

    it('should reject invalid latitude values', () => {
      const testCases = [-91, 91, 'invalid', null];
      
      testCases.forEach(latitude => {
        const data = { ...eventFixtures.locationUpdate.valid, latitude };
        const result = validateLocationUpdate(data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('latitude');
      });
    });

    it('should reject invalid longitude values', () => {
      const testCases = [-181, 181, 'invalid', null];
      
      testCases.forEach(longitude => {
        const data = { ...eventFixtures.locationUpdate.valid, longitude };
        const result = validateLocationUpdate(data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('longitude');
      });
    });

    it('should reject poor accuracy values', () => {
      const testCases = [-1, 101, 'invalid', null];
      
      testCases.forEach(accuracy => {
        const data = { ...eventFixtures.locationUpdate.valid, accuracy };
        const result = validateLocationUpdate(data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('accuracy');
      });
    });

    it('should reject invalid timestamp values', () => {
      const testCases = [0, -1, 'invalid', null];
      
      testCases.forEach(timestamp => {
        const data = { ...eventFixtures.locationUpdate.valid, timestamp };
        const result = validateLocationUpdate(data);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('timestamp');
      });
    });

    it('should reject old timestamps', () => {
      const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const data = { ...eventFixtures.locationUpdate.valid, timestamp: oldTimestamp };
      const result = validateLocationUpdate(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too old');
    });
  });

  describe('validateBusRoomData', () => {
    it('should validate correct bus room data', () => {
      const data = eventFixtures.busRoomOperations.join;
      const result = validateBusRoomData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject bus room data without bus number', () => {
      const data = { consumerId: 'consumer-123' };
      const result = validateBusRoomData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Bus number is required');
    });

    it('should reject bus room data without consumer ID', () => {
      const data = { busNumber: '12' };
      const result = validateBusRoomData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Consumer ID is required');
    });

    it('should reject invalid bus number in room data', () => {
      const data = { busNumber: 'invalid-999', consumerId: 'consumer-123' };
      const result = validateBusRoomData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid bus number format');
    });
  });

  describe('checkSessionActive', () => {
    it('should return true for active session', async () => {
      mockDatabaseService.findActiveSession.mockResolvedValue(sessionFixtures.activeSessions[0]);
      
      const result = await checkSessionActive('session-123');
      
      expect(result).toBe(true);
    });

    it('should return false for inactive session', async () => {
      mockDatabaseService.findActiveSession.mockResolvedValue(sessionFixtures.inactiveSessions[0]);
      
      const result = await checkSessionActive('session-123');
      
      expect(result).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      mockDatabaseService.findActiveSession.mockResolvedValue(null);
      
      const result = await checkSessionActive('non-existent');
      
      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockDatabaseService.findActiveSession.mockRejectedValue(new Error('Database error'));
      
      const result = await checkSessionActive('session-123');
      
      expect(result).toBe(false);
    });
  });
});