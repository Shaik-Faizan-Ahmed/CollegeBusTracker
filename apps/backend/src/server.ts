import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services and routes
import ServerConfigService from './config/serverConfig';
import databaseService from './services/databaseService';
import MonitoringService from './services/monitoringService';
import healthRoute from './routes/health';
import healthRoutes from './routes/healthRoutes';
import busRoutes from './routes/busRoutes';
import trackerRoutes from './routes/trackerRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { WebSocketServer } from './websocket';

const app = express();
const server = createServer(app);
const serverConfig = ServerConfigService.getInstance();
const monitoringService = MonitoringService.getInstance();

// Initialize monitoring (must be first)
monitoringService.initialize(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: serverConfig.getCorsOrigins(),
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoute);
app.use('/api/health', healthRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/tracker', trackerRoutes);

// Monitoring error handler (must be before other error handlers)
monitoringService.addErrorHandler(app);

// Error handling middleware
app.use(errorHandler);
app.use(notFoundHandler);

// Initialize WebSocket server
const webSocketServer = new WebSocketServer(server);

const PORT = serverConfig.getPort();

// Initialize database connection
async function startServer() {
  try {
    await databaseService.connect();
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 CVR Bus Tracker API Server running on port ${PORT}`);
      console.log(`📱 Environment: ${serverConfig.getNodeEnv()}`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();