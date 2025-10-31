# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GT Course Planner is a comprehensive academic planning application for Georgia Tech students. Built with Next.js 15 (App Router), React 19, TypeScript, Supabase, and Zustand for state management. The application provides drag-and-drop course planning, degree requirement tracking, and academic progress visualization.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Production build
- `npm run lint` - Run ESLint checks
- `npm start` - Start production server

### Data Management Commands
- `npm run crawler:run` - Run course catalog crawler
- `npm run crawler:import` - Import crawled courses to database
- `npm run data:refresh` - Full refresh: crawl and import courses
- `npm run data:seed` - Seed sample data

### Security & Monitoring Commands
- `npm run security:health` - Check security health score
- `npm run security:monitor` - View security metrics
- `npm run security:audit` - Run full security audit

### Bundle Analysis
- `npm run analyze` - Analyze bundle size with webpack bundle analyzer

## Architecture Overview

### State Management Strategy

**Zustand (Client State)**: `usePlannerStore` at `src/hooks/usePlannerStore.ts` (1605 lines)
- Primary state store for the entire application
- Persists to localStorage with user isolation via anonymous session IDs
- Manages: semesters, course planning, student info, academic progress, deadlines, degree programs
- **CRITICAL**: Uses `persist` middleware with partialize to limit localStorage bloat (max 5MB)
- **SECURITY NOTE**: Removed vulnerable `getUserId()` function - components should use server-side alternatives

**React Query (Server State)**: Configured in `src/lib/queryClient.ts`
- Server state synchronization and caching
- Used alongside Zustand for API data fetching
- Optimistic updates for user interactions

**Key State Flow**:
1. Authentication via `AuthProvider` → sets user context
2. `usePlannerStore` loads user-specific data from localStorage and Supabase
3. React Query hooks (like `useRequirements`, `useAllCourses`) fetch server data
4. Components consume state and trigger actions

### Provider Hierarchy

Located in `src/providers/AppProviders.tsx`:
```
GlobalErrorBoundary
└─ QueryClientProvider (React Query)
   └─ CriticalErrorBoundary
      └─ AuthErrorBoundary
         └─ AuthProvider (Supabase auth)
            └─ CoursesProvider
               └─ DndProvider (drag-and-drop)
```

**Error Boundaries**: Nested error boundaries provide granular error handling at different levels (general, auth, courses)

### Authentication & Security

**Auth Flow**:
- Supabase Auth with Google OAuth
- Client: `src/lib/supabaseClient.ts` (browser client with session persistence)
- Server: `src/lib/supabaseServer.ts` (cookie-based server client)
- Admin: `src/lib/supabaseAdmin.ts` (service role for admin operations)
- **Middleware**: `src/lib/auth-server.ts` provides server-side auth helpers
- **FERPA Compliance**: Strict data access controls, audit logging, error handling without data exposure

**Security Features**:
- Row Level Security (RLS) policies on all Supabase tables
- Anomaly detection (`src/lib/security/anomaly-detection.ts`)
- Security event monitoring (`src/lib/security/monitoring.ts`)
- Health scoring system (`src/lib/security/health-scoring.ts`)
- Database query validation (`src/lib/security/database.ts`) - prevents SQL injection

### Data Architecture

**Primary Database Tables**:
- `users` - User profiles with academic information (auth_id, major, minors JSON array, graduation_year)
- `courses` - Complete course catalog with prerequisites
- `user_courses` - Course completion tracking (course_id, user_id, status, grade)
- `user_course_plans` - Semester planning data
- `degree_programs` - Degree program definitions (BS, Thread, Minor types)
- `degree_requirements` - Requirement structure with categories
- `flexible_course_options` - Flexible requirement options
- `deadlines` - Academic deadlines with is_active flag
- `opportunities` - Internships, co-ops, research positions, and full-time jobs
- `user_opportunity_applications` - User applications to opportunities
- `advisors` - Academic advisors with specializations and departments
- `student_advisor_connections` - Student-advisor relationships
- `advisor_appointments` - Scheduled meetings between students and advisors

**Key Data Flows**:
1. **Profile Setup** → `src/components/profile/ProfileSetup.tsx` → API routes → Supabase users table
2. **Course Planning** → `usePlannerStore` actions → localStorage + optional Supabase sync
3. **Requirements Tracking** → `useRequirements` hook → Fetches from `degree_programs` table → Calculates progress
4. **Course Completion** → `useCompletionTracking` hook → Updates `user_courses` table

### API Routes Pattern

All API routes follow this pattern in `src/app/api/*/route.ts`:
- Server-side authentication check via `supabaseServer`
- Input validation (often using Zod schemas)
- Database operations with RLS policies
- FERPA-compliant error handling
- Security event logging

**Key API Routes**:
- `/api/courses/all` - Fetch all courses with pagination
- `/api/degree-programs` - Get degree program requirements by major
- `/api/user-profile` - CRUD operations for user profile
- `/api/requirements/calculate` - Calculate requirement progress
- `/api/course-completions` - Track course completion status
- `/api/opportunities` - Fetch active opportunities (internships, co-ops, research, jobs)
- `/api/opportunities/applications` - Manage user opportunity applications
- `/api/advisors` - Fetch advisors with filters (specialization, department, accepting students)
- `/api/advisors/connections` - Manage student-advisor connections
- `/api/advisors/appointments` - Schedule and manage advisor appointments

### Component Organization

**Feature-Based Structure**:
- `src/components/planner/*` - Course planning drag-and-drop interface
- `src/components/requirements/*` - Degree requirement tracking UI
- `src/components/courses/*` - Course explorer and search
- `src/components/dashboard/*` - Student dashboard with analytics
- `src/components/profile/*` - Profile setup wizard
- `src/components/opportunities/*` - Opportunities explorer and application management
- `src/components/advisors/*` - Advisor directory, connections, and appointment booking
- `src/components/ui/*` - Reusable UI components (Radix UI + custom)
- `src/components/error/*` - Error boundaries and fallback components

**Key Large Components**:
- `PlannerGrid` - Main semester planning interface with drag-and-drop
- `RequirementsDashboard` - Comprehensive requirements tracking
- `CourseExplorer` - Advanced course search with filters

### Type System

**Centralized Types**: `src/types/index.ts` re-exports from:
- `src/types/user.ts` - User, profile, student info
- `src/types/courses.ts` - Course, prerequisites, planned courses
- `src/types/requirements.ts` - Requirements, degree programs, progress tracking
- `src/types/dashboard.ts` - Activity, deadlines, GPA history
- `src/types/components.ts` - Component prop types

**Important Type Patterns**:
- `PlannedCourse` extends `Course` with status ('completed' | 'in-progress' | 'planned')
- `VisualDegreeProgram` - Requirements displayed in UI
- `SemesterData` - Semester with courses array and computed totals

### Hooks Pattern

**Custom Hooks** in `src/hooks/`:
- `usePlannerStore` - Main Zustand store hook
- `useRequirements` - Enhanced requirements with progress calculation
- `useCompletionTracking` - Course completion toggle logic
- `useAllCourses` - Fetch all courses from API
- `useProfileSetup` - Multi-step profile setup state
- `useOpportunities` - Fetch and manage opportunities and applications
- `useAdvisors` - Fetch advisors, manage connections and appointments

**Hook Conventions**:
- Server data fetching hooks use React Query
- State management hooks use Zustand
- Complex business logic encapsulated in hooks

## Important Implementation Details

### Semester Generation System

Located in `usePlannerStore.generateSemesters`:
- Generates semesters from start date to graduation + 1 year
- Unique semester IDs: `YYYYSS` format (year * 100 + season index)
- Seasons: Fall (0), Spring (1), Summer (2)
- Detects current semester based on system date
- Safety limit: 25 semesters max to prevent infinite loops

### Prerequisite System

**Prerequisite Data Structure**:
- Stored in `courses.prerequisites` as nested JSON
- Can be: AND groups, OR groups, or flat arrays
- Validation logic in `src/lib/validation/prerequisites.ts`

**Prerequisite Display**:
- `PrerequisiteDisplay` component recursively renders nested prereqs
- Highlights completed vs. incomplete prerequisites
- Shows prerequisite chains in course modals

### Requirements Calculation Engine

In `useRequirements` hook:
1. Fetches degree program requirements via API
2. Gets user course completions from `user_courses` table
3. Maps completed courses to requirement categories
4. Calculates credits satisfied per category
5. Returns `progressSummary` with warnings/errors
6. Supports flexible course options (choose N from M)

**Flexible Requirements**:
- Categories can have `min_courses_required` (e.g., "choose 2 of these 5")
- `FlexibleCourseCard` component displays options
- Completion tracked at category level, not individual course level

### GPA Calculation

Located in `src/lib/gpa/gpaCalculationService.ts`:
- Grade to GPA mapping: A=4.0, B=3.0, C=2.0, D=1.0, F=0.0
- Weighted by credit hours
- Calculated per semester and cumulative
- Stored in `semesters[id].gpa` for historical tracking

### Performance Optimizations

**Code Splitting**:
- Dynamic imports for heavy components (charts, modals)
- Route-based automatic splitting via Next.js App Router

**Data Fetching**:
- React Query caching with staleTime/cacheTime
- Parallel fetching with Promise.all in hooks
- Optimistic updates for instant UI feedback

**Storage Management**:
- `usePlannerStore` partialize limits localStorage to 5MB
- Automatic cleanup of old activity items (max 10)
- Reduces semesters with no courses if over limit

## Common Development Patterns

### Adding a New Feature

1. **Define types** in `src/types/`
2. **Create API route** in `src/app/api/[feature]/route.ts` with auth + validation
3. **Add hook** in `src/hooks/` for data fetching/state management
4. **Build components** in `src/components/[feature]/`
5. **Add route** in `src/app/[feature]/page.tsx`
6. **Update navigation** in `src/components/layout/Header.tsx` or `Sidebar.tsx`

### Working with Supabase

**Client-side queries** (read-only):
```typescript
import { supabase } from '@/lib/supabaseClient';
const { data, error } = await supabase.from('table').select('*');
```

**Server-side queries** (API routes):
```typescript
import { createClient } from '@/lib/supabaseServer';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**Admin operations** (service role):
```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin';
// Use sparingly - bypasses RLS
```

### Updating State in usePlannerStore

```typescript
const { addCourseToSemester, updateCourseStatus } = usePlannerStore();

// Add course to semester
addCourseToSemester({
  id: courseId,
  code: 'CS 1301',
  title: 'Intro to Computing',
  credits: 3,
  semesterId: 202400,
  status: 'planned'
});

// Update course status
updateCourseStatus(courseId, semesterId, 'completed', 'A');
```

### Error Handling Pattern

**In API routes**:
```typescript
import { handleApiError } from '@/lib/errorHandlingUtils';

try {
  // API logic
} catch (error) {
  return handleApiError(error, 'Operation description');
}
```

**In components**:
- Use error boundaries for unhandled errors
- Display user-friendly messages without exposing data (FERPA)
- Log errors to console in development

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Offline Mode**: If Supabase credentials are invalid, app runs with mock client (see `src/lib/supabaseClient.ts:createMockClient`)

## Path Aliases

TypeScript path mapping configured in `tsconfig.json`:
- `@/*` → `src/*`

Example: `import { Button } from '@/components/ui/button'`

## Styling

**Tailwind CSS v4** with custom GT theme:
- Primary colors: GT Gold (#B3A369), Tech Gold (#EEB211)
- UI components styled with Tailwind utility classes
- Theme configuration in `tailwind.config.ts`
- Global styles in `src/app/globals.css`

## Known Issues & Workarounds

1. **TypeScript Strict Mode**: Gradually enabled - some files may have type warnings
2. **LocalStorage Limits**: Automatic cleanup when exceeding 5MB
3. **Semester ID Collisions**: Use YYYYSS format (year * 100 + season index) to ensure uniqueness
4. **Cookie Consent**: Functional cookies required for state persistence - checked in Zustand storage adapter

## Testing Strategy

Currently no automated tests (Jest/testing-library removed in cleanup). Manual testing workflow:
1. Test auth flow with Google OAuth
2. Complete profile setup wizard
3. Add courses to semesters via drag-and-drop
4. Mark courses complete and verify GPA calculation
5. Check requirement progress updates
6. Test deadline display and security monitoring

## Migration & Deployment Notes

**Database Migrations**:
- Managed via Supabase dashboard
- SQL files in root for reference (e.g., `create_deadlines_table.sql`)
- Always backup before running migrations

**Deployment Checklist**:
1. Set environment variables
2. Run `npm run build` to verify build succeeds
3. Check bundle size with `npm run analyze`
4. Test auth callback URL matches deployment URL
5. Verify Supabase RLS policies are active
6. Monitor security health score after deployment

## Troubleshooting

**Infinite Loading**: Check `useRequirements` and `usePlannerStore` for circular dependencies
**Auth Issues**: Verify callback URL in Supabase dashboard matches deployment URL
**State Not Persisting**: Check cookie consent settings and localStorage quota
**Requirement Progress Wrong**: Verify `degree_programs` table has correct requirements JSON structure

## Additional Resources

- Project summary: `PROJECT_SUMMARY.md`
- Supabase setup guide: `setup-supabase.md`
- Security documentation: `src/lib/security/README.md` (if exists)
- Recent fixes documented in `*_FIX.md` and `*_IMPLEMENTATION.md` files
