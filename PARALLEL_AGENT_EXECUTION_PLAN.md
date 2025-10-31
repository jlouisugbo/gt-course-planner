# Parallel Agent Execution Plan - GT Course Planner Sprint

## 🎯 Overview

**Goal**: Demo-ready GT Course Planner in 4-5 days with 4 agents running in PARALLEL.

**Critical Issues Identified**:
1. Auth has infinite re-renders from Zustand conflicts and nested error boundaries
2. Database over-engineered with 57 tables (need ~15 for MVP)
3. UI has button/container sizing issues throughout
4. Backend over-optimized with security monitoring overkill
5. Zustand-Supabase sync is broken
6. Need 2 new features: Internships app + Advisor connection system

---

## 📋 PART 1: AGENT CREATION PROMPTS

### Agent 1 Creation Prompt: Infrastructure Stabilization Agent

```
Create a specialized agent called "Infrastructure Stabilization Agent" focused on:

1. Authentication and session management expertise (React, Next.js, Supabase Auth)
2. Database schema optimization for MVPs (PostgreSQL, reducing over-engineering)
3. State management (Zustand + Supabase sync patterns)
4. Backend API simplification (removing unnecessary monitoring/security)
5. Performance optimization

Responsibilities:
- Fix auth flow issues (re-renders, infinite loading)
- Simplify database by archiving analytics tables
- Implement Zustand-to-Supabase sync
- Reduce backend complexity
- Remove security monitoring infrastructure

PARALLEL EXECUTION CONSTRAINTS:
- Works on: src/providers/, src/hooks/usePlannerStore.ts, src/lib/auth*, src/lib/supabase*, src/app/api/security/
- Avoids: src/components/ (Agent 2), new feature code (Agent 3)
- Coordinates with: Agent 2 on provider changes, Agent 4 on demo mode

Prioritize stability and simplicity over features.
```

---

### Agent 2 Creation Prompt: UI/UX Consistency Agent

```
Create a specialized agent called "UI/UX Consistency Agent" focused on:

1. shadcn/ui component customization via className overrides
2. Responsive design and container sizing fixes
3. Button placement and visual hierarchy
4. Lucide icon integration
5. Tailwind CSS utility patterns

Responsibilities:
- Audit all components for layout inconsistencies
- Fix button sizing/placement using className overrides (NOT component edits)
- Ensure consistent spacing and responsive behavior
- Maintain design system consistency

PARALLEL EXECUTION CONSTRAINTS:
- Works on: src/components/*, src/app/*/page.tsx (styling only)
- Avoids: src/hooks/, src/lib/, src/providers/ (Agent 1), new feature components (Agent 3)
- Coordinates with: Agent 3 on new component styling standards

IMPORTANT: Customize shadcn/ui via Tailwind classes, NOT by editing base components.
```

---

### Agent 3 Creation Prompt: Feature Expansion Agent

```
Create a specialized agent called "Feature Expansion Agent" focused on:

1. Building new features following existing architectural patterns
2. Creating minimal viable implementations
3. Database schema design for new features
4. Frontend-backend integration
5. Following GT Course Planner conventions

Responsibilities:
- Build internship/opportunity application system
- Build advisor/counselor connection system
- Create simple, non-over-engineered solutions
- Follow existing code patterns
- Integrate seamlessly with current architecture

PARALLEL EXECUTION CONSTRAINTS:
- Works on: New tables (opportunities, advisors), src/components/opportunities/, src/components/advisors/, src/app/api/opportunities/, src/app/api/advisors/
- Avoids: Existing components (Agent 2), auth/state infrastructure (Agent 1)
- Coordinates with: Agent 2 for styling new components, Agent 4 for demo data

Build features matching existing app style. Avoid over-engineering.
```

---

### Agent 4 Creation Prompt: Integration & Demo Agent

```
Create a specialized agent called "Integration & Demo Agent" focused on:

1. Cross-component validation and integration testing
2. Demo mode implementation
3. Fallback mechanisms and error states
4. End-to-end user flow validation
5. Polish and final touches

Responsibilities:
- Implement comprehensive demo mode with sample data
- Validate all components work together
- Test critical user flows end-to-end
- Add graceful fallbacks for edge cases
- Ensure demo-ready presentation

PARALLEL EXECUTION CONSTRAINTS:
- Works on: src/lib/demo-mode.ts, src/lib/demo-data.ts, src/app/demo/, integration testing
- Waits for: Agent 1 auth fixes before implementing demo auth
- Coordinates with: All agents for demo data requirements

Focus on user experience for demo presentation.
```

---

## 🎯 PART 2: AGENT EXECUTION PROMPTS

### Agent 1 Execution Prompt: Infrastructure Stabilization

```
Use the infra-stabilizer agent to Work in PARALLEL with 3 other agents. Your zone: auth, database, state management, backend APIs.

## TASK BREAKDOWN

### PHASE 1: Database Simplification (2 hours)

Archive analytics tables by renaming with `_archived_` prefix:

```sql
-- Archive analytics (NOT DROP - keep for post-demo)
ALTER TABLE IF EXISTS analytics_daily_summary RENAME TO _archived_analytics_daily_summary;
ALTER TABLE IF EXISTS performance_metrics RENAME TO _archived_performance_metrics;
ALTER TABLE IF EXISTS realtime_metrics RENAME TO _archived_realtime_metrics;
ALTER TABLE IF EXISTS query_performance_log RENAME TO _archived_query_performance_log;
ALTER TABLE IF EXISTS page_views RENAME TO _archived_page_views;
ALTER TABLE IF EXISTS user_sessions RENAME TO _archived_user_sessions;
ALTER TABLE IF EXISTS feature_usage RENAME TO _archived_feature_usage;
ALTER TABLE IF EXISTS access_logs RENAME TO _archived_access_logs;

-- Remove redundant columns
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS completed_courses;
ALTER TABLE IF EXISTS user_semesters DROP COLUMN IF EXISTS planned_courses;
ALTER TABLE IF EXISTS user_semesters DROP COLUMN IF EXISTS completed_courses;
```

Delete code referencing these:
- `src/lib/security/*` (entire directory)
- `src/lib/performance-monitor.ts`
- `src/lib/auth-monitoring.ts`
- `src/lib/storage-manager.ts`
- `src/lib/access-log-cleanup.ts`
- `src/components/debug/AuthMonitoringDashboard.tsx`

### PHASE 2: Fix Authentication (3 hours)

**Problem**: Nested error boundaries + session conflicts causing re-renders.

**Fix AppProviders.tsx**:
```typescript
// SIMPLIFIED - remove AsyncErrorBoundary nesting, CriticalErrorBoundary, AuthErrorBoundary
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CoursesProvider>
            <DndProvider backend={HTML5Backend}>
              {children}
              {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
            </DndProvider>
          </CoursesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
```

**Fix AuthProvider.tsx**:
```typescript
// SIMPLE pattern - no retries, no timeouts, just auth state
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};
```

Delete: `src/lib/session-management.ts`

### PHASE 3: Fix Zustand-Supabase Sync (2 hours)

**In usePlannerStore.ts**:

Remove deprecated methods:
- `checkAndHandleUserChange()`
- `getCurrentStorageUserId()`
- All user isolation logic

Add sync function:
```typescript
syncToSupabase: async () => {
  const state = get();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const userId = user.id; // Use auth user ID directly

  // Sync planned courses
  const plannedCourses = state.getAllCourses().filter(c => c.status === 'planned');
  const { error: planError } = await supabase.from('user_semester_plans').upsert(
    plannedCourses.map(course => ({
      user_id: userId,
      semester_id: course.semesterId.toString(),
      course_id: course.id,
      course_code: course.code,
      credits: course.credits,
      status: 'planned',
      updated_at: new Date().toISOString()
    })),
    { onConflict: 'user_id,semester_id,course_id' }
  );

  // Sync completed courses
  const completedCourses = state.getAllCourses().filter(c => c.status === 'completed');
  const { error: compError } = await supabase.from('user_course_completions').upsert(
    completedCourses.map(course => ({
      user_id: userId,
      course_id: course.id,
      course_code: course.code,
      grade: course.grade,
      semester: `${state.semesters[course.semesterId]?.season} ${state.semesters[course.semesterId]?.year}`,
      credits: course.credits,
      status: 'completed',
      updated_at: new Date().toISOString()
    })),
    { onConflict: 'user_id,course_id' }
  );

  if (planError) console.error('Sync error (plans):', planError);
  if (compError) console.error('Sync error (completions):', compError);
},
```

Add debounced auto-sync - call after `addCourseToSemester`, `removeCourseFromSemester`, `updateCourseStatus`.

### PHASE 4: Simplify Backend APIs (2 hours)

**Remove from ALL API routes in src/app/api/**:
- Security event logging calls
- Performance monitoring
- Access logging
- Anomaly detection
- FERPA over-engineering

**Standard pattern**:
```typescript
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query logic
    const { data, error } = await supabase.from('table').select('*');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Delete: `src/app/api/security/*` (entire directory)

### VALIDATION CHECKLIST

Test these:
- [ ] Sign in with Google → loads in <2s
- [ ] No infinite loading states
- [ ] Add course → saves to Zustand immediately
- [ ] Wait 5s → auto-syncs to Supabase
- [ ] Refresh page → data persists
- [ ] Sign out → clears Zustand
- [ ] Sign back in → reloads data
- [ ] No console errors related to auth
- [ ] `npm run build` succeeds

### COORDINATION NOTES

**For Agent 2**: Provider hierarchy simplified, auth errors removed
**For Agent 3**: Database schema clean, can add new tables
**For Agent 4**: Auth structure ready for demo mode integration

**Deliverables**: SQL migration file, simplified auth, working sync, deleted files list
```

---

### Agent 2 Execution Prompt: UI/UX Consistency

```
Use the ui-ux-consistency agent to work in PARALLEL with 3 other agents. Your zone: all UI components, styling, layout fixes.

## TASK BREAKDOWN

### PHASE 1: Visual Audit (1 hour)

Create audit document listing:
- Button/container sizing issues
- Text overflow problems
- Spacing inconsistencies
- Icon alignment issues
- Responsive breakage

Categorize: Critical → High → Medium → Low

### PHASE 2: Fix shadcn/ui Components (3 hours)

**RULES**:
- DO NOT edit files in `src/components/ui/`
- ONLY use className overrides
- Test at: 375px, 768px, 1440px, 1920px

**Common Fixes**:

Buttons overflowing:
```tsx
<Button className="w-full max-w-[200px] truncate">Long Text</Button>
```

Card content:
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-2">...</CardContent>
</Card>
```

Text overflow:
```tsx
className="truncate"        // Single line
className="line-clamp-2"    // 2 lines
className="break-words"     // Wrap long words
```

Responsive:
```tsx
className="text-sm md:text-base px-3 md:px-4 py-2"
```

**Priority Files**:
- `src/components/planner/PlannerGrid.tsx`
- `src/components/planner/parts/PlannerCourseCard.tsx`
- `src/components/requirements/RequirementsDashboard.tsx`
- `src/components/requirements/parts/*.tsx`
- `src/components/dashboard/parts/*.tsx`
- `src/components/courses/CourseExplorer.tsx`
- `src/components/layout/Header.tsx`
- `src/components/profile/ProfileSetup.tsx`

### PHASE 3: Standardize Spacing (1 hour)

**Apply these patterns**:
```tsx
// Page containers
className="container mx-auto px-4 py-6 md:py-8 space-y-6"

// Sections
className="space-y-4"

// Grids
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Button groups
className="flex items-center gap-2"

// Forms
className="space-y-4"
```

### PHASE 4: Fix Icon Alignment (30 min)

**Standard patterns**:
```tsx
// Icon with text
<div className="flex items-center gap-2">
  <IconName className="h-4 w-4" />
  <span>Text</span>
</div>

// Icon button
<Button variant="ghost" size="icon" className="h-9 w-9">
  <IconName className="h-4 w-4" />
</Button>
```

### PHASE 5: Responsive Validation (2 hours)

Test all pages at breakpoints, fix with:
```tsx
// Responsive grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"

// Responsive flex
className="flex flex-col md:flex-row gap-4"

// Show/hide
className="hidden md:block"  // Hide mobile
className="md:hidden"        // Show only mobile
```

### PHASE 6: GT Theme Consistency (1 hour)

Verify GT colors used consistently:
- Primary: GT Gold (#B3A369, #EEB211)
- Check all primary buttons
- Verify hover states

Ensure component variants match:
- Buttons: default, outline, ghost, destructive
- Cards: default, flat
- Badges: default, outline, secondary

### VALIDATION CHECKLIST

- [ ] All buttons fit in containers (all breakpoints)
- [ ] No text overflow anywhere
- [ ] Consistent spacing throughout
- [ ] Icons aligned with text
- [ ] Mobile (375px) usable
- [ ] Tablet (768px) usable
- [ ] Desktop (1440px) polished

### COORDINATION NOTES

**For Agent 3**: Provide styling standards for new components
**For Agent 4**: UI polished and ready for demo presentation

**Deliverables**: Audit document, before/after screenshots, component fixes list
```

---

### Agent 3 Execution Prompt: Feature Expansion

```
Use the feature-expansion agent to work in PARALLEL with 3 other agents. Your zone: new tables, new features (opportunities, advisors).

## TASK BREAKDOWN

### PHASE 1: Database Schema (1 hour)

**Create migration file**: `migrations/2025-01-27_new_features.sql`

```sql
-- OPPORTUNITIES FEATURE
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

CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(application_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_user ON user_opportunity_applications(user_id);

-- ADVISORS FEATURE
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

CREATE TABLE IF NOT EXISTS student_advisor_connections (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  advisor_id BIGINT REFERENCES advisors(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'assigned',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, advisor_id)
);

CREATE TABLE IF NOT EXISTS advisor_appointments (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  advisor_id BIGINT REFERENCES advisors(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_type TEXT DEFAULT 'in-person',
  meeting_link TEXT,
  topic TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisors_specializations ON advisors USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_advisors_departments ON advisors USING GIN(departments);
CREATE INDEX IF NOT EXISTS idx_connections_student ON student_advisor_connections(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON advisor_appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON advisor_appointments(appointment_date);
```

### PHASE 2: Opportunities Feature (4 hours)

**API Routes** (`src/app/api/opportunities/route.ts`):
```typescript
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('is_active', true)
    .order('application_deadline', { ascending: true });

  if (error) throw error;
  return NextResponse.json(data);
}
```

**Components**:

`src/components/opportunities/OpportunitiesExplorer.tsx`:
```typescript
// Copy pattern from CourseExplorer.tsx
// Search bar + filters (type, company, deadline)
// Grid of opportunity cards
```

`src/components/opportunities/OpportunityCard.tsx`:
```typescript
<Card className="overflow-hidden hover:shadow-lg transition">
  <CardHeader>
    <CardTitle className="truncate">{title}</CardTitle>
    <p className="text-sm text-muted-foreground">{company}</p>
  </CardHeader>
  <CardContent className="space-y-2">
    <Badge>{opportunityType}</Badge>
    <p className="text-sm line-clamp-2">{description}</p>
    <div className="flex items-center gap-2 text-sm">
      <Calendar className="h-4 w-4" />
      <span>{deadline}</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Apply</Button>
  </CardFooter>
</Card>
```

`src/components/opportunities/OpportunityApplicationModal.tsx`:
```typescript
// Dialog with form
// Fields: cover_letter (textarea), custom questions
// Resume upload placeholder
// Submit → POST to /api/opportunities/applications
```

`src/components/opportunities/MyApplications.tsx`:
```typescript
// Fetch user's applications
// Show status badges
// Allow editing drafts
```

**Page** (`src/app/opportunities/page.tsx`):
```typescript
<Tabs defaultValue="browse">
  <TabsList>
    <TabsTrigger value="browse">Browse</TabsTrigger>
    <TabsTrigger value="my-applications">My Applications</TabsTrigger>
  </TabsList>
  <TabsContent value="browse"><OpportunitiesExplorer /></TabsContent>
  <TabsContent value="my-applications"><MyApplications /></TabsContent>
</Tabs>
```

**Hook** (`src/hooks/useOpportunities.ts`):
```typescript
export const useOpportunities = () => {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const res = await fetch('/api/opportunities');
      return res.json();
    }
  });
};
```

### PHASE 3: Advisors Feature (4 hours)

**API Routes**:
- `src/app/api/advisors/route.ts` - List all
- `src/app/api/advisors/connect/route.ts` - Create connection
- `src/app/api/advisors/appointments/route.ts` - CRUD appointments

**Components**:

`src/components/advisors/AdvisorDirectory.tsx`:
```typescript
// Grid of advisor cards
// Filters: department, specialization
// Search by name
```

`src/components/advisors/AdvisorCard.tsx`:
```typescript
<Card>
  <CardHeader>
    <CardTitle>{name}</CardTitle>
    <p className="text-sm text-muted-foreground">{title}</p>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-1">
      {specializations.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">View Profile</Button>
  </CardFooter>
</Card>
```

`src/components/advisors/AdvisorProfile.tsx`:
```typescript
// Full bio
// Office hours display
// "Request Connection" button
// "Book Appointment" button (if connected)
```

`src/components/advisors/MyAdvisors.tsx`:
```typescript
// List connected advisors
// Upcoming appointments
// Quick actions
```

`src/components/advisors/AppointmentBooking.tsx`:
```typescript
// Use react-day-picker (already installed)
// Time slot selection from office hours
// Topic/notes input
// Submit → POST to /api/advisors/appointments
```

**Page** (`src/app/advisors/page.tsx`):
```typescript
<Tabs defaultValue="directory">
  <TabsList>
    <TabsTrigger value="directory">Directory</TabsTrigger>
    <TabsTrigger value="my-advisors">My Advisors</TabsTrigger>
    <TabsTrigger value="appointments">Appointments</TabsTrigger>
  </TabsList>
  {/* Tab contents */}
</Tabs>
```

**Hooks**:
- `useAdvisors.ts` - Fetch all advisors
- `useMyAdvisors.ts` - Fetch connected
- `useAppointments.ts` - Fetch/create appointments

### PHASE 4: Navigation Integration (30 min)

Add to `src/components/layout/Header.tsx`:
```tsx
<Link href="/opportunities">Opportunities</Link>
<Link href="/advisors">Advisors</Link>
```

### KEEP IT SIMPLE

- No file uploads (placeholder only)
- No real-time features
- Basic CRUD only
- Simple validation (required fields)
- Copy patterns from existing features

### VALIDATION CHECKLIST

- [ ] Can browse opportunities
- [ ] Can create application
- [ ] Application saves to DB
- [ ] Can browse advisors
- [ ] Can request connection
- [ ] Can book appointment
- [ ] UI matches existing style
- [ ] No new dependencies
- [ ] `npm run build` succeeds

### COORDINATION NOTES

**For Agent 2**: Follow spacing/styling standards from existing components
**For Agent 4**: Provide data structure for demo opportunities/advisors

**Deliverables**: SQL migration, API routes, components, pages, hooks, navigation links
```

---

### Agent 4 Execution Prompt: Integration & Demo

```
Use the integration-demo-agent to work in PARALLEL initially, then integrate. Your zone: demo mode, testing, polish.

## TASK BREAKDOWN

### PHASE 1: Monitor Other Agents (Ongoing)

Track progress:
- Agent 1: Auth fixed? Sync working?
- Agent 2: UI polished?
- Agent 3: Features built?

### PHASE 2: Create Demo Infrastructure (2 hours)

**File**: `src/lib/demo-mode.ts`
```typescript
export const DEMO_MODE_KEY = 'gt-planner-demo-mode';

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const enableDemoMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
  }
};

export const disableDemoMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
};

export const DEMO_USER = {
  id: 'demo-user-12345',
  email: 'demo@gatech.edu',
  full_name: 'Alex Johnson',
  major: 'Computer Science',
  graduation_year: 2026,
  threads: ['Intelligence', 'Systems & Architecture'],
  minors: []
};
```

**File**: `src/lib/demo-data.ts`
```typescript
export const DEMO_COMPLETED_COURSES = [
  { code: 'CS 1301', title: 'Intro to Computing', credits: 3, grade: 'A', semester: 'Fall 2022' },
  { code: 'CS 1331', title: 'Intro to OOP', credits: 3, grade: 'B', semester: 'Spring 2023' },
  { code: 'MATH 1551', title: 'Calculus I', credits: 4, grade: 'A', semester: 'Fall 2022' },
  { code: 'CS 1332', title: 'Data Structures', credits: 3, grade: 'A', semester: 'Fall 2023' },
  { code: 'CS 2050', title: 'Discrete Math', credits: 3, grade: 'B', semester: 'Spring 2023' },
  { code: 'CS 2110', title: 'Computer Org', credits: 4, grade: 'B', semester: 'Spring 2024' },
  { code: 'CS 2340', title: 'Objects & Design', credits: 3, grade: 'A', semester: 'Fall 2023' },
  { code: 'MATH 1552', title: 'Calculus II', credits: 4, grade: 'B', semester: 'Spring 2023' },
  { code: 'MATH 2550', title: 'Linear Algebra', credits: 4, grade: 'A', semester: 'Fall 2023' },
  { code: 'ENGL 1101', title: 'English Comp I', credits: 3, grade: 'A', semester: 'Fall 2022' },
  { code: 'ENGL 1102', title: 'English Comp II', credits: 3, grade: 'B', semester: 'Spring 2023' },
  { code: 'PHYS 2211', title: 'Physics I', credits: 4, grade: 'B', semester: 'Fall 2023' },
  { code: 'CS 3510', title: 'Design & Analysis', credits: 3, grade: 'A', semester: 'Spring 2024' },
  { code: 'CS 3600', title: 'Intro to AI', credits: 3, grade: 'A', semester: 'Fall 2024' },
  { code: 'CS 4400', title: 'Database Systems', credits: 3, grade: 'B', semester: 'Fall 2024' }
];

export const DEMO_PLANNED_COURSES = [
  { code: 'CS 4641', title: 'Machine Learning', credits: 3, semesterId: 202501 },
  { code: 'CS 3750', title: 'HCI', credits: 3, semesterId: 202501 },
  { code: 'CS 4460', title: 'Info Visualization', credits: 3, semesterId: 202501 },
  { code: 'CS 4540', title: 'Advanced Algorithms', credits: 3, semesterId: 202502 },
  { code: 'CS 4650', title: 'NLP', credits: 3, semesterId: 202502 },
  { code: 'CS 4803', title: 'Special Topics', credits: 3, semesterId: 202502 }
];

export const DEMO_OPPORTUNITIES = [
  {
    id: 1,
    title: 'Software Engineering Intern',
    company: 'Google',
    opportunity_type: 'internship',
    description: 'Work on cloud infrastructure projects',
    location: 'Atlanta, GA',
    application_deadline: '2025-12-01T00:00:00Z',
    requirements: { gpa_min: 3.0, skills: ['Python', 'Java', 'C++'] }
  },
  {
    id: 2,
    title: 'Machine Learning Research Assistant',
    company: 'GT Research Lab',
    opportunity_type: 'research',
    description: 'AI/ML research in robotics',
    location: 'Atlanta, GA',
    application_deadline: '2025-11-15T00:00:00Z',
    requirements: { gpa_min: 3.5, skills: ['Python', 'TensorFlow'] }
  },
  {
    id: 3,
    title: 'Full Stack Developer Co-op',
    company: 'Microsoft',
    opportunity_type: 'co-op',
    description: 'Build cloud applications',
    location: 'Redmond, WA',
    application_deadline: '2025-12-15T00:00:00Z',
    requirements: { skills: ['React', 'Node.js', 'Azure'] }
  }
];

export const DEMO_ADVISORS = [
  {
    id: 1,
    full_name: 'Dr. Sarah Williams',
    email: 'swilliams@gatech.edu',
    title: 'Academic Advisor - College of Computing',
    specializations: ['Computer Science', 'Intelligence Thread', 'Career Planning'],
    departments: ['College of Computing'],
    bio: 'Academic advisor with 10+ years experience helping CS students',
    office_location: 'KACB 2124',
    is_accepting_students: true
  },
  {
    id: 2,
    full_name: 'John Martinez',
    email: 'jmartinez@gatech.edu',
    title: 'Career Counselor',
    specializations: ['Internships', 'Resume Review', 'Interview Prep'],
    departments: ['Career Center'],
    bio: 'Career counselor specializing in tech industry placements',
    office_location: 'Student Center 210',
    is_accepting_students: true
  }
];
```

### PHASE 3: Integrate Demo Mode (2 hours)

**Update AuthProvider** (coordinate with Agent 1):
```typescript
useEffect(() => {
  if (isDemoMode()) {
    setUser(DEMO_USER as any);
    setLoading(false);
    return;
  }

  // Normal auth flow
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

**Update usePlannerStore** (coordinate with Agent 1):
```typescript
initializeStore: async () => {
  if (isDemoMode()) {
    // Load demo data
    const demoSemesters = get().generateSemesters('Fall 2022', 'Spring 2026');

    // Populate with completed courses
    DEMO_COMPLETED_COURSES.forEach(course => {
      const semester = Object.values(demoSemesters).find(s =>
        s.season + ' ' + s.year === course.semester
      );
      if (semester) {
        get().addCourseToSemester({
          id: Math.random() * 10000,
          code: course.code,
          title: course.title,
          credits: course.credits,
          semesterId: semester.id,
          status: 'completed',
          grade: course.grade
        });
      }
    });

    // Populate with planned courses
    DEMO_PLANNED_COURSES.forEach(course => {
      get().addCourseToSemester({
        id: Math.random() * 10000,
        code: course.code,
        title: course.title,
        credits: course.credits,
        semesterId: course.semesterId,
        status: 'planned'
      });
    });

    set({
      studentInfo: {
        ...get().studentInfo,
        ...DEMO_USER,
        name: DEMO_USER.full_name,
        currentGPA: 3.67
      }
    });

    return;
  }

  // Normal flow
  await Promise.all([get().fetchDeadlines()]);
},
```

**Create Demo Page** (`src/app/demo/page.tsx`):
```typescript
'use client';
import { enableDemoMode } from '@/lib/demo-mode';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DemoPage() {
  const router = useRouter();

  const startDemo = () => {
    enableDemoMode();
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">GT Course Planner Demo</CardTitle>
          <CardDescription>
            Experience the full app without signing in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Demo includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>15 completed courses with grades</li>
              <li>6 planned future courses</li>
              <li>Degree progress tracking</li>
              <li>Internship opportunities</li>
              <li>Advisor connections</li>
            </ul>
          </div>
          <Button onClick={startDemo} className="w-full" size="lg">
            Start Demo
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href="/">Sign In Instead</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Add Demo Indicator to Header**:
```typescript
import { isDemoMode } from '@/lib/demo-mode';
import { Badge } from '@/components/ui/badge';

// In Header component
{isDemoMode() && (
  <Badge variant="secondary" className="ml-2">
    Demo Mode
  </Badge>
)}
```

### PHASE 4: Cross-Component Testing (2 hours)

**Critical User Flows**:

1. **New User Onboarding**
   - Sign in → Profile setup → Dashboard → Planner
   - ✅ Expected: Smooth, no errors

2. **Returning User**
   - Sign in → Dashboard shows data → Planner shows courses
   - ✅ Expected: All data loads

3. **Demo Mode**
   - Visit /demo → Click Start → See full app with data
   - ✅ Expected: Works without auth

4. **Opportunities**
   - Browse → Apply → View applications
   - ✅ Expected: Application saves

5. **Advisors**
   - Browse → Connect → Book appointment
   - ✅ Expected: Connection/appointment saves

### PHASE 5: Error Handling & Polish (2 hours)

**Add loading states**:
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
```

**Add error states**:
```tsx
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}. Please refresh.
      </AlertDescription>
    </Alert>
  );
}
```

**Add empty states**:
```tsx
if (data.length === 0) {
  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold">No courses yet</h3>
      <p className="text-muted-foreground">Start planning</p>
      <Button className="mt-4">Browse Courses</Button>
    </Card>
  );
}
```

**Add toast notifications**:
```typescript
import { toast } from 'sonner';

toast.success('Course added!');
toast.error('Failed to save');
```

### VALIDATION CHECKLIST

**Authentication**:
- [ ] Google OAuth works
- [ ] Demo mode works
- [ ] No infinite loading
- [ ] No re-render loops

**Data Persistence**:
- [ ] Zustand saves immediately
- [ ] Supabase syncs
- [ ] Refresh preserves data

**Features**:
- [ ] Planner works
- [ ] Requirements track
- [ ] Opportunities browse/apply
- [ ] Advisors connect/book

**UI/UX**:
- [ ] Desktop works
- [ ] Mobile (375px) works
- [ ] No layout issues
- [ ] Consistent styling

**Performance**:
- [ ] Load <3s
- [ ] No console errors
- [ ] Build succeeds

### COORDINATION NOTES

**For Agent 1**: Demo mode integrates with your auth fixes
**For Agent 2**: Demo page needs styling
**For Agent 3**: Demo data uses your new tables

**Deliverables**: Demo mode working, all flows tested, checklist completed, README updated
```

---

## 🔧 PART 3: PARALLEL EXECUTION STRATEGY

### File Zone Assignments (No Conflicts)

**Agent 1 Zone**:
- `src/providers/AppProviders.tsx`, `src/providers/AuthProvider.tsx`
- `src/hooks/usePlannerStore.ts`
- `src/lib/supabase*.ts`, `src/lib/auth*.ts`
- `src/app/api/security/` (delete)
- Delete: `src/lib/security/*`, `src/lib/performance-monitor.ts`, etc.

**Agent 2 Zone**:
- `src/components/**/*` (all existing components)
- `src/app/*/page.tsx` (styling only, no logic changes)
- NO TOUCH: `src/hooks/`, `src/lib/`, `src/providers/`

**Agent 3 Zone**:
- New: `src/components/opportunities/*`, `src/components/advisors/*`
- New: `src/app/opportunities/`, `src/app/advisors/`
- New: `src/app/api/opportunities/`, `src/app/api/advisors/`
- New: `src/hooks/useOpportunities.ts`, `src/hooks/useAdvisors.ts`, etc.
- Database: New tables only (opportunities, advisors, etc.)

**Agent 4 Zone**:
- New: `src/lib/demo-mode.ts`, `src/lib/demo-data.ts`
- New: `src/app/demo/page.tsx`
- Integration: Coordinates with all agents
- Testing: All zones

### Coordination Points

**Agent 1 → Agent 4**: Auth structure for demo mode
**Agent 2 → Agent 3**: Styling standards for new components
**Agent 3 → Agent 4**: Data structure for demo data
**All → Agent 4**: Testing coordination

### Git Strategy

Each agent creates branches:
- `agent-1-infrastructure`
- `agent-2-ui-consistency`
- `agent-3-features`
- `agent-4-demo`

Merge order: 1 → 2/3 (parallel) → 4

### Communication Protocol

Agents comment in code when coordination needed:
```typescript
// @Agent2: Please style this new component following existing patterns
// @Agent4: Demo data structure: { id, title, company, ... }
```

---

## 📊 PART 4: SUCCESS METRICS

### Before Sprint
- Auth load: >5s, infinite loading common
- Database: 57 tables
- Lines of code: ~15,000
- Console errors: 10+
- Features: 5 (planner, requirements, courses, dashboard, profile)

### After Sprint (Targets)
- Auth load: <2s, no infinite loading
- Database: 15 active, 42 archived
- Lines of code: ~12,000 (cleaner)
- Console errors: 0 critical
- Features: 7 (+ opportunities, advisors)
- Demo mode: 100% functional

### Quality Gates

**Before Agent 2/3 start**:
- [ ] Agent 1: Auth works, no infinite loading
- [ ] Agent 1: Zustand-Supabase sync functional
- [ ] Agent 1: Build succeeds

**Before Agent 4 starts**:
- [ ] Agent 2: All UI fixed, responsive
- [ ] Agent 3: Both features working
- [ ] Build succeeds

**Final**:
- [ ] Demo mode works without auth
- [ ] All flows tested
- [ ] README updated
- [ ] Ready to present

---

## 🚨 PARALLEL EXECUTION CHECKLIST

### Setup (Before Starting Agents)

```bash
# 1. Backup
git add .
git commit -m "Pre-sprint backup"
git branch backup-before-sprint

# 2. Create agent branches
git checkout -b agent-1-infrastructure
git checkout main
git checkout -b agent-2-ui-consistency
git checkout main
git checkout -b agent-3-features
git checkout main
git checkout -b agent-4-demo

# 3. Verify build
git checkout main
npm run build

# 4. Backup env
cp .env.local .env.local.backup
```

### During Execution

**Each agent works in their branch**:
- Agent 1: `git checkout agent-1-infrastructure`
- Agent 2: `git checkout agent-2-ui-consistency`
- Agent 3: `git checkout agent-3-features`
- Agent 4: `git checkout agent-4-demo`

**Coordination**: Use comments in code, Slack/Discord, or shared doc

### Credit Management

**If credits run out mid-agent**:

1. Document state:
```markdown
## Agent [N] Progress
Task: [Current task]
Completed: [List]
In Progress: [Specific subtask stopped at]
Next: [Next action]
Files: [Modified files]
```

2. Commit work: `git add . && git commit -m "WIP: Agent N - Task X"`
3. When credits refresh: Paste progress doc + "Resume from here"

### Merging Strategy

```bash
# 1. Agent 1 completes first
git checkout main
git merge agent-1-infrastructure
npm run build  # Verify

# 2. Agents 2 & 3 merge next (in either order)
git merge agent-2-ui-consistency
npm run build  # Verify
git merge agent-3-features
npm run build  # Verify

# 3. Agent 4 merges last
git merge agent-4-demo
npm run build  # Final verify
```

### SQL Migration Execution

**Run migrations in order**:
```bash
# Agent 1 migration (archive tables)
psql -d your_db -f migrations/agent-1-archive-analytics.sql

# Agent 3 migration (new tables)
psql -d your_db -f migrations/agent-3-new-features.sql
```

---

## 📖 PART 5: QUICK REFERENCE

### Database Changes Summary

**Agent 1 Archives** (rename with `_archived_`):
- analytics_daily_summary
- performance_metrics
- realtime_metrics
- query_performance_log
- page_views
- user_sessions
- feature_usage
- access_logs

**Agent 1 Removes Columns**:
- users.completed_courses
- user_semesters.planned_courses
- user_semesters.completed_courses

**Agent 3 Creates**:
- opportunities
- user_opportunity_applications
- advisors
- student_advisor_connections
- advisor_appointments

### File Deletions

**Agent 1 Deletes**:
- `src/lib/security/*` (entire directory)
- `src/lib/performance-monitor.ts`
- `src/lib/auth-monitoring.ts`
- `src/lib/storage-manager.ts`
- `src/lib/access-log-cleanup.ts`
- `src/lib/session-management.ts`
- `src/components/debug/AuthMonitoringDashboard.tsx`
- `src/app/api/security/*` (entire directory)

### New Files Created

**Agent 3**:
- `src/components/opportunities/OpportunitiesExplorer.tsx`
- `src/components/opportunities/OpportunityCard.tsx`
- `src/components/opportunities/OpportunityApplicationModal.tsx`
- `src/components/opportunities/MyApplications.tsx`
- `src/components/advisors/AdvisorDirectory.tsx`
- `src/components/advisors/AdvisorCard.tsx`
- `src/components/advisors/AdvisorProfile.tsx`
- `src/components/advisors/MyAdvisors.tsx`
- `src/components/advisors/AppointmentBooking.tsx`
- `src/app/opportunities/page.tsx`
- `src/app/advisors/page.tsx`
- `src/app/api/opportunities/route.ts`
- `src/app/api/advisors/route.ts`
- `src/hooks/useOpportunities.ts`
- `src/hooks/useAdvisors.ts`
- `src/hooks/useAppointments.ts`

**Agent 4**:
- `src/lib/demo-mode.ts`
- `src/lib/demo-data.ts`
- `src/app/demo/page.tsx`

---

## ⚡ EXECUTION TIMELINE

### Day 1 (8 hours)
- **Hour 0**: Setup (all agents)
- **Hours 1-3**: All agents work in parallel
- **Hours 4-6**: Continue parallel work
- **Hours 7-8**: Agent 1 completes, others continue

### Day 2 (8 hours)
- **Hours 1-4**: Agents 2 & 3 complete work
- **Hours 5-6**: Agent 4 integrates
- **Hours 7-8**: Testing

### Day 3 (4 hours)
- **Hours 1-2**: Bug fixes
- **Hours 3-4**: Final polish, demo prep

**Total**: 20 hours across 3 days (aggressive but achievable)

---

## 🎯 FINAL NOTES

### Keep It Simple
- No over-engineering
- Copy existing patterns
- Basic CRUD operations
- Minimal new dependencies

### Demo First
- Everything must work in demo mode
- Real auth is secondary (for now)
- Focus on presentation quality

### Quality Over Quantity
- Better to have 2 polished features than 5 broken ones
- Working demo > perfect code
- Test critical flows thoroughly

### Emergency Contacts
- If stuck: Check existing similar features
- If blocked: Skip and document for post-demo
- If credits run out: Document state, resume later

---

**START AGENTS NOW** - Good luck! 🚀
