-- Add prerequisites and postrequisites columns to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS postrequisites JSONB DEFAULT '[]'::jsonb;

-- Add indexes for faster queries on these JSONB columns
CREATE INDEX IF NOT EXISTS idx_courses_prerequisites ON courses USING GIN (prerequisites);
CREATE INDEX IF NOT EXISTS idx_courses_postrequisites ON courses USING GIN (postrequisites);

-- Add comments to document the expected structure
COMMENT ON COLUMN courses.prerequisites IS 'JSON structure: [] for no prereqs, ["and", {"id": "COURSE", "grade": "C"}] for single prereq, complex nested structure for multiple';
COMMENT ON COLUMN courses.postrequisites IS 'JSON structure: same as prerequisites but represents courses that have this course as a prerequisite';