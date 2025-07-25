-- Add new columns to users table
ALTER TABLE users ADD COLUMN major text;
ALTER TABLE users ADD COLUMN minors jsonb DEFAULT '[]'::jsonb;

-- Create indexes for better query performance
CREATE INDEX idx_users_major ON users (major);
CREATE INDEX idx_users_minors ON users USING GIN (minors);

-- Optional: Update existing users with degree_program_id to have major text
-- This query joins degree_program_id to populate the major column for existing users
UPDATE users 
SET major = degree_programs.name 
FROM degree_programs 
WHERE users.degree_program_id = degree_programs.id 
AND users.major IS NULL;

-- Verify the new columns exist
\d users;

-- Test query to find Aerospace Engineering degree program
SELECT id, name, degree_type, total_credits, requirements 
FROM degree_programs 
WHERE name = 'Aerospace Engineering' 
AND is_active = true;

-- Test query to join user major to degree program requirements
SELECT 
    u.id as user_id,
    u.major,
    u.minors,
    dp.id as degree_program_id,
    dp.name as program_name,
    dp.degree_type,
    dp.total_credits,
    dp.requirements,
    c.name as college_name
FROM users u
LEFT JOIN degree_programs dp ON u.major = dp.name AND dp.is_active = true
LEFT JOIN colleges c ON dp.college_id = c.id
WHERE u.major IS NOT NULL
LIMIT 5;