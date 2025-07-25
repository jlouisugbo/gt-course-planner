-- Fix for GT Course Planner Database Schema
-- Add missing columns to users table for requirements tracking

-- Step 1: Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS completed_courses text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_groups text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_detailed_gpa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS semester_gpas jsonb DEFAULT '[]'::jsonb;

-- Step 2: Update existing user record with proper structure
UPDATE users 
SET 
    completed_courses = '{}',
    completed_groups = '{}',
    has_detailed_gpa = false,
    semester_gpas = '[]'::jsonb
WHERE auth_id = '7fd4e3a0-5b35-41e4-a7a1-99853fa226ab';

-- Step 3: Ensure degree_programs table has the Aerospace Engineering program
-- (You already have this data, but let's make sure it's active)
UPDATE degree_programs 
SET is_active = true 
WHERE name = 'Aerospace Engineering';

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_completed_courses ON users USING gin(completed_courses);
CREATE INDEX IF NOT EXISTS idx_degree_programs_active ON degree_programs(is_active) WHERE is_active = true;

-- Step 5: Verify the data
SELECT 
    id, 
    name, 
    degree_type, 
    is_active,
    CASE 
        WHEN requirements IS NOT NULL THEN 'Has Requirements'
        ELSE 'No Requirements'
    END as requirements_status
FROM degree_programs 
WHERE is_active = true;