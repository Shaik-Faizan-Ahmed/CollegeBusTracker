-- Create the active_sessions table
CREATE TABLE active_sessions (
  "sessionId" TEXT PRIMARY KEY,
  "busNumber" TEXT NOT NULL,
  "trackerId" TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "lastUpdated" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster lookups on busNumber
CREATE INDEX idx_active_sessions_bus_number ON active_sessions("busNumber");

-- Create an index for faster lookups on expiresAt for cleanup
CREATE INDEX idx_active_sessions_expires_at ON active_sessions("expiresAt");

-- Enable Row-Level Security (RLS) on the table
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for access
-- Allow public read-only access to active buses
CREATE POLICY "Allow public read-only access" 
ON active_sessions FOR SELECT 
USING (true);

-- Allow service_role to perform all actions (for backend server access)
CREATE POLICY "Allow full access for service_role" 
ON active_sessions FOR ALL 
USING (true) 
WITH CHECK (true);
