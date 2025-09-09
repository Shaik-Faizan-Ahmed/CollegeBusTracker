-- CVR College Bus Tracker Database Schema
-- PostgreSQL 15+ (Supabase)
-- Migration: 001 - Create bus_sessions table

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bus tracking sessions table
CREATE TABLE IF NOT EXISTS bus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number VARCHAR(10) NOT NULL,
    tracker_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6, 2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Constraints
    CONSTRAINT valid_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT valid_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT positive_accuracy CHECK (accuracy > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bus_sessions_active_bus ON bus_sessions (bus_number, is_active) 
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bus_sessions_expires ON bus_sessions (expires_at);

-- Unique constraint: Only one active tracker per bus
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_tracker 
    ON bus_sessions (bus_number) 
    WHERE is_active = true;

-- Automatic cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Mark expired sessions as inactive
    UPDATE bus_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    -- Delete expired sessions (after marking inactive for grace period)
    DELETE FROM bus_sessions 
    WHERE expires_at < (NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- View for active bus locations (API consumption)
CREATE OR REPLACE VIEW active_buses AS
SELECT 
    bus_number,
    latitude,
    longitude,
    accuracy,
    updated_at as last_updated,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM bus_sessions 
WHERE is_active = true 
    AND expires_at > NOW()
ORDER BY bus_number;