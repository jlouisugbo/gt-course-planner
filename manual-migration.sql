-- Manual migration to be run in Supabase SQL Editor
-- FERPA-COMPLIANT ACCESS LOGGING SCHEMA for GT Course Planner

-- Create access_logs table for FERPA compliance
CREATE TABLE IF NOT EXISTS access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_type TEXT NOT NULL DEFAULT 'academic_data',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    response_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_type ON access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_endpoint ON access_logs(endpoint);

-- Enable Row Level Security for additional protection
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only view their own access logs
DROP POLICY IF EXISTS access_logs_user_policy ON access_logs;
CREATE POLICY access_logs_user_policy ON access_logs
    FOR ALL
    USING (auth.uid() = user_id);

-- Admin policy removed - no role column exists in users table

-- Comment on the table for documentation
COMMENT ON TABLE access_logs IS 'FERPA-compliant logging of all academic data access for GT Course Planner';
COMMENT ON COLUMN access_logs.user_id IS 'GT user ID who accessed the data';
COMMENT ON COLUMN access_logs.endpoint IS 'API endpoint that was accessed';
COMMENT ON COLUMN access_logs.method IS 'HTTP method used (GET, POST, etc.)';
COMMENT ON COLUMN access_logs.access_type IS 'Type of data accessed (academic_data, course_catalog, etc.)';
COMMENT ON COLUMN access_logs.accessed_at IS 'Timestamp when data was accessed';