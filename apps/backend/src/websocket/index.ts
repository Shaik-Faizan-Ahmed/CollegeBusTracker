import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ConnectionHandlers } from './handlers/connectionHandlers';
import { TrackingHandlers } from './handlers/trackingHandlers';
import { ConsumerHandlers } from './handlers/consumerHandlers';
import { WebSocketService } from '../services/websocketService';
import { createRateLimitMiddleware } from './middleware/rateLimiter';

export class WebSocketServer {
  private io: Server;
  private websocketService: WebSocketService;
  private connectionHandlers: ConnectionHandlers;
  private trackingHandlers: TrackingHandlers;
  private consumerHandlers: ConsumerHandlers;

  constructor(httpServer: HttpServer) {
    // Initialize Socket.IO server with CORS configuration
    this.io = new Server(httpServer, {
      cors: {
        origin: "*", // In production, specify allowed origins
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    // Add rate limiting middleware
    this.io.use(createRateLimitMiddleware({
      windowMs: 60 * 1000,        // 1 minute window
      maxRequests: 100,           // Max 100 requests per minute per connection
      blockDurationMs: 30 * 1000  // Block for 30 seconds if limit exceeded
    }));

    // Initialize services and handlers
    this.websocketService = new WebSocketService(this.io);
    this.connectionHandlers = new ConnectionHandlers(this.io, this.websocketService.getRoomManager());
    this.trackingHandlers = new TrackingHandlers(this.io, this.websocketService);
    this.consumerHandlers = new ConsumerHandlers(this.io, this.websocketService);

    this.setupEventHandlers();
    this.websocketService.startCleanupInterval();

    console.log('WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      // Handle connection establishment
      this.connectionHandlers.handleConnection(socket);

      // Register tracking handlers
      this.trackingHandlers.registerHandlers(socket);

      // Register consumer handlers  
      this.consumerHandlers.registerHandlers(socket);
    });
  }

  public getIO(): Server {
    return this.io;
  }

  public getWebSocketService(): WebSocketService {
    return this.websocketService;
  }

  public getRoomStats() {
    return this.websocketService.getRoomStats();
  }

  public getActiveConnections() {
    return this.connectionHandlers.getActiveConnections();
  }
}