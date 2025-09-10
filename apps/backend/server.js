const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

// Environment configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];

// Supabase configuration
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bmhrbvefthinvkebgavk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

console.log('🔍 Environment:', NODE_ENV);
console.log('🔑 CORS Origins:', CORS_ORIGINS);

// Express app setup
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// In-memory storage for active sessions
const activeSessions = new Map();
const busRooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    database: 'connected'
  });
});

// Bus routes
app.get('/api/buses', async (req, res) => {
  try {
    const activeBuses = Array.from(activeSessions.values()).map(session => ({
      busNumber: session.busNumber,
      latitude: session.latitude,
      longitude: session.longitude,
      lastUpdated: session.lastUpdated
    }));
    
    res.json({ buses: activeBuses });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

app.get('/api/buses/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;
    const session = Array.from(activeSessions.values()).find(s => s.busNumber === busNumber);
    
    if (!session) {
      return res.status(404).json({ error: 'Bus not found or not active' });
    }
    
    res.json({
      busNumber: session.busNumber,
      latitude: session.latitude,
      longitude: session.longitude,
      lastUpdated: session.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ error: 'Failed to fetch bus' });
  }
});

// Tracker routes
app.post('/api/tracker/start', async (req, res) => {
  try {
    const { busNumber, latitude, longitude } = req.body;
    
    if (!busNumber || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if bus already has an active tracker
    const existingSession = Array.from(activeSessions.values()).find(s => s.busNumber === busNumber);
    
    if (existingSession) {
      return res.status(409).json({
        error: {
          code: 'BUS_ALREADY_TRACKED',
          message: 'Bus already has an active tracker',
          existingTracker: {
            busNumber: existingSession.busNumber,
            lastUpdated: existingSession.lastUpdated,
            trackerId: existingSession.trackerId
          }
        }
      });
    }
    
    // Create new session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trackerId = `tracker_${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession = {
      sessionId,
      busNumber,
      trackerId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      isActive: true,
      lastUpdated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    activeSessions.set(sessionId, newSession);
    
    res.status(201).json({
      sessionId,
      busNumber,
      trackerId
    });
    
  } catch (error) {
    console.error('Error starting tracker:', error);
    res.status(500).json({ error: 'Failed to start tracker' });
  }
});

app.post('/api/tracker/stop', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Remove session
    activeSessions.delete(sessionId);
    
    // Notify consumers that tracker stopped
    io.to(`bus-${session.busNumber}`).emit('tracker-disconnected', {
      busNumber: session.busNumber,
      message: 'Tracker has stopped sharing location'
    });
    
    res.json({
      message: 'Tracking session stopped',
      busNumber: session.busNumber
    });
    
  } catch (error) {
    console.error('Error stopping tracker:', error);
    res.status(500).json({ error: 'Failed to stop tracker' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  // Handle location updates from trackers
  socket.on('location-update', (data) => {
    try {
      const { busNumber, latitude, longitude, accuracy, timestamp, sessionId } = data;
      
      // Verify session exists
      const session = activeSessions.get(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Invalid session' });
        return;
      }
      
      // Update session location
      session.latitude = parseFloat(latitude);
      session.longitude = parseFloat(longitude);
      session.lastUpdated = new Date().toISOString();
      
      // Broadcast to consumers in this bus room
      socket.to(`bus-${busNumber}`).emit('location-updated', {
        busNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy),
        timestamp
      });
      
    } catch (error) {
      console.error('Error handling location update:', error);
      socket.emit('error', { message: 'Failed to process location update' });
    }
  });
  
  // Handle consumers joining bus rooms
  socket.on('join-bus-room', (data) => {
    try {
      const { busNumber } = data;
      
      if (!busNumber) {
        socket.emit('error', { message: 'Bus number required' });
        return;
      }
      
      socket.join(`bus-${busNumber}`);
      
      // Send current location if available
      const session = Array.from(activeSessions.values()).find(s => s.busNumber === busNumber);
      if (session) {
        socket.emit('location-updated', {
          busNumber: session.busNumber,
          latitude: session.latitude,
          longitude: session.longitude,
          timestamp: session.lastUpdated
        });
      } else {
        socket.emit('no-tracker', { busNumber, message: 'No active tracker for this bus' });
      }
      
    } catch (error) {
      console.error('Error joining bus room:', error);
      socket.emit('error', { message: 'Failed to join bus room' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (new Date(session.expiresAt) < now) {
      console.log(`🧹 Cleaning up expired session: ${sessionId}`);
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log('🚀 CVR Bus Tracker API Server running on port', PORT);
  console.log('📱 Environment:', NODE_ENV);
  console.log('🔌 WebSocket server ready');
  console.log('✅ Database connected successfully');
});

module.exports = app;