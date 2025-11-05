# Implementation Log

This file records each completed task with a concise engineering note, decisions, and validation steps.

## 2025-11-04 — Phase 2: Standardize on `client.ts` (hooks migration)

Completed a migration to a unified, typed API client (`src/lib/api/client.ts`) and refactored core data hooks to use it. The client now exposes table-oriented methods with proper TypeScript generics and minimal shared types for users, courses, semesters, deadlines, and degree programs. Updated hooks include `useUserProfile` (normalized camelCase + strict nulls), `useCourses` and `useInfiniteCourses` (paginated via `api.courses.getAll`), `useDegreePrograms` (single + all via `api.degreePrograms`), and `useDeadlines` (CRUD with optimistic updates retained). Added `GET /api/degree-programs/all` for program listings. Verified with a full Next.js production build; no new blocking errors introduced. This standardization reduces direct fetch/Supabase usage in the client and improves type safety across the data layer.

## 2025-11-04 — Phase 3 groundwork: UI/data separation primitives

Introduced new focused hooks to prepare splitting the monolithic planner store: `usePlannerUIStore` (Zustand store for purely UI state like expanded panels, modals, filters, drag, layout), `useUserPlannerData` (aggregates profile + semesters + degree programs using existing hooks), and `useReliablePlannerData` (wraps aggregation with safe defaults on error). These enable components to consume the right slice (UI or domain data) without coupled responsibilities, paving the way to trim `usePlannerStore` down to semester CRUD and course manipulation only. Build validated successfully post-additions.

## 2025-11-04 — Degree Programs: listings route

## 2025-11-04 — Phase 3: First component swap to new data hooks (Profile Page)

Rewired the profile page (`src/app/profile/page.tsx`) to read user data via the new `useUserProfile` hook instead of the monolithic planner store. Mapped camelCase fields from the API (e.g., `fullName`, `selectedThreads`, `planSettings.expected_graduation`) into the page’s form state. Aligned the save path to `useProfileSetup` by providing `threads`, `expectedGraduation`, and `currentGPA` (instead of the previous snake_case fields) to match its `ExtendedProfileData` contract. Verified the app still builds successfully. This reduces `usePlannerStore` surface area in a user-facing route and moves us closer to a clean UI/data split.

Added `src/app/api/degree-programs/all/route.ts` returning `{ programs: [...] }` for active programs. This supports selection UIs and consolidates read patterns behind the server route. The route uses the existing security middleware configuration and Supabase admin client for reads. Verified visibility in build output and integrated it with `useDegreePrograms` via the API client.

## 2025-11-05 — Phase 3: Dashboard hook migrated off planner store

Refactored `src/hooks/useDashboard.ts` to remove its dependency on the monolithic `usePlannerStore`. It now sources: (a) profile, semesters, and programs via the aggregated `useUserPlannerData`; (b) upcoming deadlines via the `useDeadlines` React Query hook; and (c) GPA via the existing `gpaCalculationService`. The hook continues to return the same `UnifiedDashboardData` shape but avoids calling `plannerStore.fetchDegreeProgramRequirements`, `fetchMinorProgramsRequirements`, and `getUpcomingDeadlines`. Degree/minor programs are derived from the aggregated `programs` list, and semesters are read from the new data hook. Types were tightened to satisfy the current requirements model while deferring full requirement progress wiring. Performed a project build to validate no blocking errors; any remaining lints are non-blocking and queued for Phase 5 cleanup.

## 2025-11-05 — Phase 3: PlannerDashboard swapped to use new hooks

Updated `src/components/planner/PlannerDashboard.tsx` to consume `useDashboard()` instead of the legacy `useReliablePlannerStore`. Mapped dashboard fields to existing UI needs (semesters, userProfile, degreeProgram, loading/error, refresh) and removed unused store imports and variables. Preserved `PlannerGrid` props and existing visual layout. Verified with a production build; no blocking errors were introduced. This reduces direct store usage in a key planner surface and moves us closer to trimming `usePlannerStore` to semester/course CRUD only.

## 2025-11-05 — Phase 3: Introduced UI-only store in PlannerDashboard (sidebar toggle)

Integrated the new `usePlannerUIStore` into `PlannerDashboard` to manage UI-only sidebar state (collapse/expand) with a toggle button. The sidebar (CourseRecommendationsAI) now hides/shows via the Zustand UI store, and the main grid adjusts its span accordingly. This begins the header/sidebar refactor by moving ephemeral layout state out of the monolithic planner store and local component state, aligning with the planned UI/data split.

## 2025-11-05 — Phase 3: Finish trimming planner store + align semesters client types

- Removed requirement-fetching responsibilities from `src/hooks/usePlannerStore.ts` entirely: dropped `fetchAndUpdateRequirements` from the `PlannerState` interface and stripped calls in `updateStudentThreads`, `updateStudentMinors`, and `updateStudentMajor`.
- Removed demo deadlines from store initialization (deadlines now live in dedicated React Query hooks). Kept demo semesters and activity for demo mode.
- Fixed implicit-any TypeScript errors in `getThreadMinorProgress` by typing `category` and `courseId`.
- Aligned `generateSemesters()` persistence to the bulk API and broadened the API client types:
  - Updated `src/lib/api/client.ts` `Semester` interface to include `semesterId`, `season`, `total_credits`, `max_credits`, and `is_active` for server compatibility.
  - Relaxed return types for `semesters.create/update/bulkCreate` to match route responses and avoid excess property errors.
- Ran a production build to verify changes: PASS (warnings only). This unblocks further migrations off the monolithic store.
