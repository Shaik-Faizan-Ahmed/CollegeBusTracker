require('dotenv').config();
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

// --- Health check endpoint ---
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

// --- Bus routes ---
app.get('/api/buses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('busNumber, latitude, longitude, lastUpdated')
      .eq('isActive', true);

    if (error) throw error;
    
    res.json({ buses: data });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

app.get('/api/buses/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;
    const { data, error } = await supabase
      .from('active_sessions')
      .select('busNumber, latitude, longitude, lastUpdated')
      .eq('busNumber', busNumber)
      .eq('isActive', true)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Bus not found or not active' });
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ error: 'Failed to fetch bus' });
  }
});

// --- Tracker routes ---
app.post('/api/tracker/start', async (req, res) => {
  try {
    const { busNumber, latitude, longitude, accuracy, timestamp } = req.body;
    
    console.log('🔍 Tracker start request:', { 
      busNumber, 
      latitude, 
      longitude, 
      accuracy, 
      timestamp, 
      body: req.body,
      bodyType: typeof req.body,
      latType: typeof latitude,
      lngType: typeof longitude
    });
    
    // Validate required fields
    if (!busNumber) {
      console.log('❌ Missing busNumber');
      return res.status(400).json({ 
        error: 'Missing required field: busNumber',
        received: { busNumber, latitude, longitude, accuracy, timestamp }
      });
    }
    
    if (latitude === undefined || latitude === null) {
      console.log('❌ Missing latitude');
      return res.status(400).json({ 
        error: 'Missing required field: latitude',
        received: { busNumber, latitude, longitude, accuracy, timestamp }
      });
    }
    
    if (longitude === undefined || longitude === null) {
      console.log('❌ Missing longitude');
      return res.status(400).json({ 
        error: 'Missing required field: longitude',
        received: { busNumber, latitude, longitude, accuracy, timestamp }
      });
    }
    
    // Convert to numbers if they're strings
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    
    // Validate coordinate values
    if (isNaN(lat) || isNaN(lng)) {
      console.log('❌ Invalid coordinates:', { lat, lng });
      return res.status(400).json({ 
        error: 'Invalid coordinates: latitude and longitude must be valid numbers',
        received: { busNumber, latitude, longitude, accuracy, timestamp }
      });
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log('❌ Coordinates out of range:', { lat, lng });
      return res.status(400).json({ 
        error: 'Coordinates out of valid range',
        received: { busNumber, latitude, longitude, accuracy, timestamp }
      });
    }
    
    // First, clean up any expired sessions for this bus (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    console.log(`🧹 Cleaning up sessions older than: ${twoHoursAgo}`);
    
    const { data: expiredSessions } = await supabase
      .from('active_sessions')
      .delete()
      .eq('busNumber', busNumber)
      .lt('lastUpdated', twoHoursAgo)
      .select();
      
    if (expiredSessions?.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired session(s) for bus ${busNumber}`);
    }
    
    // Now check if bus still has an active tracker
    const { data: existingSession, error: selectError } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('busNumber', busNumber)
      .eq('isActive', true)
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('active_sessions')
      .insert({
        sessionId,
        busNumber,
        trackerId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || 10.0,
        isActive: true,
        expiresAt
      });

    if (insertError) throw insertError;
    
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

app.post('/api/tracker/stop', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
    
    const { data: session, error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('sessionId', sessionId)
      .select()
      .single();

    if (deleteError) {
        if (deleteError.code === 'PGRST116') return res.status(404).json({ error: 'Session not found' });
        throw deleteError;
    }

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

// --- Debug routes to clear ghost sessions (temporary) ---
app.delete('/api/tracker/clear/:busNumber', async (req, res) => {
  try {
    const { busNumber } = req.params;
    
    const { data: sessions, error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .eq('busNumber', busNumber)
      .select();

    if (deleteError) throw deleteError;

    res.json({
      message: `Cleared ${sessions.length} session(s) for bus ${busNumber}`,
      clearedSessions: sessions.length
    });
    
  } catch (error) {
    console.error('Error clearing sessions:', error);
    res.status(500).json({ error: 'Failed to clear sessions' });
  }
});

// Clear all expired sessions (older than 24 hours)
app.post('/api/debug/clear-expired-sessions', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredSessions, error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .lt('lastUpdated', twentyFourHoursAgo)
      .select();

    if (deleteError) throw deleteError;

    res.json({
      message: `Cleared ${expiredSessions?.length || 0} expired session(s)`,
      clearedSessions: expiredSessions?.length || 0,
      cutoffTime: twentyFourHoursAgo
    });
    
  } catch (error) {
    console.error('Error clearing expired sessions:', error);
    res.status(500).json({ error: 'Failed to clear expired sessions' });
  }
});

// Clear all sessions (use with caution!)
app.post('/api/debug/clear-all-sessions', async (req, res) => {
  try {
    const { data: allSessions, error: deleteError } = await supabase
      .from('active_sessions')
      .delete()
      .neq('sessionId', '') // Delete all non-empty sessionIds (i.e., all records)
      .select();

    if (deleteError) throw deleteError;

    res.json({
      message: `Cleared all ${allSessions?.length || 0} session(s)`,
      clearedSessions: allSessions?.length || 0
    });
    
  } catch (error) {
    console.error('Error clearing all sessions:', error);
    res.status(500).json({ error: 'Failed to clear all sessions' });
  }
});

// --- WebSocket connection handling ---
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  socket.on('location-update', async (data) => {
    try {
      const { busNumber, latitude, longitude, accuracy, timestamp, sessionId } = data;
      
      const { error } = await supabase
        .from('active_sessions')
        .update({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          lastUpdated: new Date().toISOString()
        })
        .eq('sessionId', sessionId);

      if (error) {
        // If the session doesn't exist, the update will fail silently (0 rows updated).
        // We need to check if the session exists first to return a specific error.
        const { data: sessionExists } = await supabase.from('active_sessions').select('sessionId').eq('sessionId', sessionId).single();
        if (!sessionExists) {
            socket.emit('error', { message: 'Invalid session' });
            return;
        }
        throw error;
      }
      
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
  
  socket.on('join-bus-room', async (data) => {
    try {
      const { busNumber } = data;
      if (!busNumber) return socket.emit('error', { message: 'Bus number required' });
      
      socket.join(`bus-${busNumber}`);
      
      const { data: session, error } = await supabase
        .from('active_sessions')
        .select('busNumber, latitude, longitude, lastUpdated')
        .eq('busNumber', busNumber)
        .eq('isActive', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

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
  
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

// --- Database cleanup ---
async function cleanupExpiredSessions() {
    const now = new Date().toISOString();
    const { error } = await supabase
        .from('active_sessions')
        .delete()
        .lt('expiresAt', now);

    if (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
}

setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Run every 5 minutes

// --- Start server ---
server.listen(PORT, () => {
  console.log('🚀 CVR Bus Tracker API Server running on port', PORT);
  console.log('📱 Environment:', NODE_ENV);
  console.log('🔌 WebSocket server ready');
  console.log('✅ Database connected successfully');
  cleanupExpiredSessions(); // Initial cleanup on start
});

module.exports = app;
