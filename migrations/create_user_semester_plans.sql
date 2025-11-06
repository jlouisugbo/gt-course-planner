-- Migration: Create user_semesters table
-- Purpose: Move semester data from localStorage to database for persistence and sync
-- Author: Claude Code
-- Date: 2025-01-04

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS user_semesters CASCADE;

-- Create user_semesters table
CREATE TABLE user_semesters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,

    -- Semester identification
    semester_id INTEGER NOT NULL, -- Unique ID like 202400 (year * 100 + season index)
    semester_name VARCHAR(20) NOT NULL, -- e.g., "Fall 2024"
    year INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL CHECK (season IN ('Fall', 'Spring', 'Summer')),

    -- Semester data
    courses JSONB DEFAULT '[]'::jsonb, -- Array of course objects with status, grade, etc.
    total_credits INTEGER DEFAULT 0,
    max_credits INTEGER DEFAULT 18,
    is_active BOOLEAN DEFAULT false, -- Current semester
    is_completed BOOLEAN DEFAULT false,
    gpa DECIMAL(3,2) DEFAULT 0.00,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to users table
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Unique constraint: one semester per user per semester_id
    CONSTRAINT unique_user_semester
        UNIQUE (user_id, semester_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_semesters_user_id ON user_semesters(user_id);
CREATE INDEX idx_user_semesters_semester_id ON user_semesters(semester_id);
CREATE INDEX idx_user_semesters_year ON user_semesters(year);
CREATE INDEX idx_user_semesters_is_active ON user_semesters(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_semesters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_semesters_updated_at
    BEFORE UPDATE ON user_semesters
    FOR EACH ROW
    EXECUTE FUNCTION update_user_semesters_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_semesters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own semester plans
CREATE POLICY user_semesters_select_policy
    ON user_semesters
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_semesters_insert_policy
    ON user_semesters
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_semesters_update_policy
    ON user_semesters
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_semesters_delete_policy
    ON user_semesters
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_semesters TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_semesters_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_semesters IS 'Stores user semester planning data - replaces localStorage storage';
COMMENT ON COLUMN user_semesters.semester_id IS 'Unique semester ID: year * 100 + season index (0=Fall, 1=Spring, 2=Summer)';
COMMENT ON COLUMN user_semesters.courses IS 'JSONB array of planned courses with status, grades, credits';
COMMENT ON COLUMN user_semesters.is_active IS 'Current semester flag - only one should be true per user';
COMMENT ON COLUMN user_semesters.gpa IS 'Calculated GPA for completed semester';
