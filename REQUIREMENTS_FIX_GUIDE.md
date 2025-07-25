# Requirements Integration Fix Guide

## Issues Found:
1. ❌ Missing `completed_courses` and `completed_groups` columns in users table
2. ❌ Database query failing due to missing columns
3. ❌ Degree programs table exists but may have activation issues

## Step-by-Step Fix:

### 1. Run Database Schema Fix

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS completed_courses text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_groups text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_detailed_gpa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS semester_gpas jsonb DEFAULT '[]'::jsonb;

-- Update your existing user record
UPDATE users 
SET 
    completed_courses = '{}',
    completed_groups = '{}',
    has_detailed_gpa = false,
    semester_gpas = '[]'::jsonb
WHERE auth_id = '7fd4e3a0-5b35-41e4-a7a1-99853fa226ab';

-- Ensure degree programs are active
UPDATE degree_programs 
SET is_active = true 
WHERE name = 'Aerospace Engineering';
```

### 2. Verify the Fix

Run this verification query:

```sql
-- Check user record
SELECT 
    id, auth_id, major, completed_courses, completed_groups
FROM users 
WHERE auth_id = '7fd4e3a0-5b35-41e4-a7a1-99853fa226ab';

-- Check degree programs  
SELECT id, name, degree_type, is_active
FROM degree_programs 
WHERE is_active = true;
```

### 3. Expected Results:

**User Query Should Return:**
```
id: 5
auth_id: 7fd4e3a0-5b35-41e4-a7a1-99853fa226ab
major: Aerospace Engineering
completed_courses: [] (empty array)
completed_groups: [] (empty array)
```

**Degree Programs Should Return:**
```
id: 6
name: Aerospace Engineering
degree_type: BS
is_active: true
```

### 4. Test the Requirements Tab

After running the SQL fix:
1. Refresh your application
2. Go to the Requirements tab
3. You should see the Aerospace Engineering requirements loaded
4. Checkboxes should be functional
5. Course completion should sync with planner recommendations

### 5. Database Column Details:

```sql
-- New columns added:
completed_courses text[]     -- Array of completed course codes
completed_groups text[]      -- Array of satisfied requirement group IDs  
has_detailed_gpa boolean     -- Whether user provided semester-by-semester GPA
semester_gpas jsonb          -- Array of semester GPA objects
```

### 6. Integration Flow:

1. **Requirements Tab**: User checks off completed courses
2. **Database**: Stores completed courses in `users.completed_courses` 
3. **Planner Tab**: Reads completed courses for recommendations
4. **Recommendations**: Filter courses based on prerequisite completion

## Troubleshooting:

### If you still get 400 errors:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('completed_courses', 'completed_groups');
```

### If degree programs still not found:
```sql
-- Check all programs regardless of active status
SELECT id, name, degree_type, is_active 
FROM degree_programs;

-- Force activate all programs
UPDATE degree_programs SET is_active = true;
```

### If requirements don't load:
1. Check browser console for specific errors
2. Verify user.major matches degree_programs.name exactly
3. Ensure requirements JSON is properly formatted in database

## Success Indicators:

1. ✅ No 400 errors in network tab
2. ✅ Requirements tab loads Aerospace Engineering program
3. ✅ Checkboxes appear and are functional
4. ✅ Planner recommendations update based on completed courses
5. ✅ Console shows: "✅ Loaded completion data: {courses: 0, groups: 0}"

Run the SQL fix above and let me know the results!