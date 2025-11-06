-- Migration: Create user_courses table
-- Purpose: Track course completion status and grades for requirements
-- Author: Claude Code
-- Date: 2025-01-06

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS user_courses CASCADE;

-- Create user_courses table
CREATE TABLE user_courses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT,  -- Optional: FK to courses table
    course_code VARCHAR(20) NOT NULL,  -- e.g., "CS 1301"

    -- Completion status
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'in-progress', 'planned', 'dropped')),
    grade VARCHAR(5),  -- e.g., "A", "B+", "C", "P", "F"
    semester_taken VARCHAR(20),  -- e.g., "Fall 2024"
    semester_id INTEGER,  -- FK to semester ID

    -- Credits
    credits_earned INTEGER DEFAULT 0,  -- Actual credits earned (0 if not completed/failed)

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,  -- When marked as completed

    -- Foreign key to users table
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Unique constraint: one record per user per course
    CONSTRAINT unique_user_course
        UNIQUE (user_id, course_code)
);

-- Create indexes for performance
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_status ON user_courses(status);
CREATE INDEX idx_user_courses_course_code ON user_courses(course_code);
CREATE INDEX idx_user_courses_semester_id ON user_courses(semester_id);
CREATE INDEX idx_user_courses_completed ON user_courses(user_id, status) WHERE status = 'completed';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_courses_updated_at
    BEFORE UPDATE ON user_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_courses_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own course records
CREATE POLICY user_courses_select_policy
    ON user_courses
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_courses_insert_policy
    ON user_courses
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_courses_update_policy
    ON user_courses
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY user_courses_delete_policy
    ON user_courses
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM users WHERE auth_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_courses TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_courses_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_courses IS 'Tracks course completion status and grades for each user';
COMMENT ON COLUMN user_courses.status IS 'Course status: completed, in-progress, planned, dropped';
COMMENT ON COLUMN user_courses.grade IS 'Letter grade (A-F) or P/F for completed courses';
COMMENT ON COLUMN user_courses.credits_earned IS 'Actual credits earned (0 for failed/dropped courses)';
COMMENT ON COLUMN user_courses.semester_taken IS 'Semester when course was taken (for display)';
