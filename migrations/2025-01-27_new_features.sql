-- GT Course Planner: Opportunities and Advisors Features
-- Migration created: 2025-01-27

-- =====================================================
-- OPPORTUNITIES FEATURE
-- =====================================================

-- Main opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  opportunity_type TEXT NOT NULL, -- 'internship', 'co-op', 'research', 'job'
  application_deadline TIMESTAMP WITH TIME ZONE,
  requirements JSONB,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User applications to opportunities
CREATE TABLE IF NOT EXISTS user_opportunity_applications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'accepted', 'rejected'
  cover_letter TEXT,
  resume_url TEXT,
  application_answers JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(application_deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_user ON user_opportunity_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON user_opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON user_opportunity_applications(status);

-- =====================================================
-- ADVISORS FEATURE
-- =====================================================

-- Advisors table
CREATE TABLE IF NOT EXISTS advisors (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  specializations TEXT[],
  departments TEXT[],
  bio TEXT,
  office_location TEXT,
  office_hours JSONB,
  booking_url TEXT,
  is_accepting_students BOOLEAN DEFAULT true,
  max_students INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student-advisor connections
CREATE TABLE IF NOT EXISTS student_advisor_connections (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  advisor_id BIGINT REFERENCES advisors(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'requested', -- 'requested', 'assigned', 'self-selected'
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'declined', 'inactive'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, advisor_id)
);

-- Advisor appointments
CREATE TABLE IF NOT EXISTS advisor_appointments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  advisor_id BIGINT REFERENCES advisors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_type TEXT DEFAULT 'in-person', -- 'in-person', 'virtual', 'phone'
  meeting_link TEXT,
  topic TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no-show'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for advisors
CREATE INDEX IF NOT EXISTS idx_advisors_specializations ON advisors USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_advisors_departments ON advisors USING GIN(departments);
CREATE INDEX IF NOT EXISTS idx_advisors_active ON advisors(is_active);
CREATE INDEX IF NOT EXISTS idx_advisors_accepting ON advisors(is_accepting_students);
CREATE INDEX IF NOT EXISTS idx_connections_student ON student_advisor_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_connections_advisor ON student_advisor_connections(advisor_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON student_advisor_connections(status);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON advisor_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_advisor ON advisor_appointments(advisor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON advisor_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON advisor_appointments(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_advisor_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_appointments ENABLE ROW LEVEL SECURITY;

-- Opportunities policies (all users can view active opportunities)
CREATE POLICY "Anyone can view active opportunities" ON opportunities
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all opportunities" ON opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Applications policies (users can only see their own applications)
CREATE POLICY "Users can view their own applications" ON user_opportunity_applications
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create their own applications" ON user_opportunity_applications
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own applications" ON user_opportunity_applications
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete their own applications" ON user_opportunity_applications
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Advisors policies (all authenticated users can view active advisors)
CREATE POLICY "Authenticated users can view active advisors" ON advisors
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Connections policies (users can see their own connections)
CREATE POLICY "Users can view their own connections" ON student_advisor_connections
  FOR SELECT USING (student_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create their own connections" ON student_advisor_connections
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own connections" ON student_advisor_connections
  FOR UPDATE USING (student_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Appointments policies (users and advisors can see relevant appointments)
CREATE POLICY "Users can view their own appointments" ON advisor_appointments
  FOR SELECT USING (
    student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can create their own appointments" ON advisor_appointments
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can update their own appointments" ON advisor_appointments
  FOR UPDATE USING (
    student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can delete their own appointments" ON advisor_appointments
  FOR DELETE USING (
    student_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample opportunities
INSERT INTO opportunities (title, company, description, opportunity_type, application_deadline, location, is_active)
VALUES
  ('Software Engineering Intern', 'Google', 'Work on cutting-edge cloud infrastructure projects', 'internship', '2025-03-15 23:59:59-05', 'Mountain View, CA', true),
  ('Machine Learning Research Assistant', 'GT Research Lab', 'Assist with NLP research projects', 'research', '2025-02-28 23:59:59-05', 'Atlanta, GA', true),
  ('Full Stack Developer Co-op', 'Microsoft', 'Build enterprise-scale web applications', 'co-op', '2025-04-01 23:59:59-05', 'Seattle, WA', true)
ON CONFLICT DO NOTHING;

-- Sample advisors
INSERT INTO advisors (user_id, full_name, email, title, specializations, departments, bio, office_location, is_accepting_students, is_active)
VALUES
  (NULL, 'Dr. Jane Smith', 'jane.smith@gatech.edu', 'Senior Academic Advisor', ARRAY['Computer Science', 'Career Planning'], ARRAY['College of Computing'], 'Specializes in CS undergraduate advising with 10+ years of experience', 'KACB 2100', true, true),
  (NULL, 'Dr. Robert Johnson', 'robert.johnson@gatech.edu', 'Faculty Advisor', ARRAY['Artificial Intelligence', 'Research Guidance'], ARRAY['School of Interactive Computing'], 'Research advisor for ML and AI projects', 'CODA 1315', true, true)
ON CONFLICT DO NOTHING;
