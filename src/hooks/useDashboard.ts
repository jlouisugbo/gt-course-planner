/**
 * Unified Dashboard Hook
 *
 * Consolidates all dashboard data loading into a single hook to prevent:
 * - Multiple re-renders from independent hooks
 * - Cascading API calls
 * - Unstable dependencies causing infinite loops
 * - Race conditions between data fetches
 *
 * This hook replaces the combination of:
 * - useDashboardData
 * - useRequirements
 * - useUserAwarePlannerStore
 *
 * All data is loaded in one coordinated effect and returned as stable memoized values.
 */

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { userDataService, UserCourseCompletion, UserSemesterPlan } from '@/lib/database/userDataService';
import { useUserPlannerData } from '@/hooks/useUserPlannerData';
import { useDeadlines, getDaysUntilDeadline } from '@/hooks/useDeadlines';
import { gpaCalculationService } from '@/lib/gpa/gpaCalculationService';
import {
  DegreeProgressSummary,
  CategoryProgress,
  RequirementDisplaySettings
} from '@/types/requirements';

// Re-export types for component compatibility
export interface DashboardUser {
  name: string;
  email: string;
  major: string | null;
  threads: string[];
  minors: string[];
  graduationYear: number;
  startYear: number;
  expectedGraduation: string;
  avatar?: string;
}

export interface DashboardStats {
  creditsCompleted: number;
  creditsInProgress: number;
  creditsPlanned: number;
  totalCreditsRequired: number;
  currentGPA: number;
  projectedGPA: number;
  targetGPA: number;
  progressPercentage: number;
  onTrack: boolean;
  coursesRemaining: number;
  coursesCompleted: number;
}

export interface DashboardRequirements {
  degreeProgram: any | null;
  minorPrograms: any[];
  progressSummary: DegreeProgressSummary | null;
  categoryProgress: CategoryProgress[];
  isLoading: boolean;
}

/**
 * Result of the unified dashboard hook
 */
export interface UnifiedDashboardData {
  // Loading & Error States
  isLoading: boolean;
  error: Error | null;

  // User Information
  user: DashboardUser | null;
  userProfile: any | null;

  // Academic Progress
  stats: DashboardStats;

  // Course Data
  courses: {
    completed: UserCourseCompletion[];
    planned: UserSemesterPlan[];
    inProgress: UserSemesterPlan[];
    completedCount: number;
    remainingCount: number;
  };

  // GPA Data
  gpaHistory: Array<{
    semester: string;
    gpa: number;
    credits: number;
    year: number;
  }>;
  currentGPA: number;

  // Requirements
  requirements: DashboardRequirements;
  progressSummary: DegreeProgressSummary | null;

  // Deadlines
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    date: Date;
    daysLeft: number;
    type: string;
  }>;

  // Activity Feed
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    icon: string;
  }>;

  // Planner Store Access
  semesters: any;

  // Refresh function
  refresh: () => Promise<void>;
}

/**
 * Unified Dashboard Hook
 *
 * @param settings - Optional requirement display settings
 * @returns All dashboard data with stable references
 */
export function useDashboard(
  _settings: RequirementDisplaySettings = {
    groupByCategory: true,
    showCompletedRequirements: true,
    showProgressBars: true,
    showCourseDetails: false,
    sortBy: 'category',
    expandedCategories: []
  }
): UnifiedDashboardData {
  const { user: authUser } = useAuth();
  const plannerData = useUserPlannerData();
  const { upcomingDeadlines } = useDeadlines();

  // State for all data - grouped together
  const [state, setState] = useState({
    userProfile: null as any,
    courseCompletions: [] as UserCourseCompletion[],
    semesterPlans: [] as UserSemesterPlan[],
    gpaData: null as any,
    degreeProgram: null as any,
    minorPrograms: [] as any[],
    isLoading: true,
    error: null as Error | null
  });

  // Use ref to prevent multiple simultaneous loads
  const loadingRef = useRef(false);
  const authUserIdRef = useRef(authUser?.id);

  /**
   * Main data loading function - loads ALL dashboard data in one go
   * This prevents cascading API calls and race conditions
   */
  const loadAllData = useCallback(async () => {
    // Skip if no user or already loading
    if (!authUser?.id || loadingRef.current) {
      if (!authUser?.id) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    try {
      loadingRef.current = true;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load everything in parallel for maximum performance
      const [dashboardData, gpaData] = await Promise.all([
        // Dashboard data (user profile, completions, plans)
        userDataService.getDashboardData().catch(err => {
          console.warn('[useDashboard] Dashboard data fetch failed:', err instanceof Error ? err.message : String(err));
          return null;
        }),

        // GPA calculations
        gpaCalculationService.calculateComprehensiveGPA().catch(err => {
          console.warn('[useDashboard] GPA calculation failed:', err instanceof Error ? err.message : String(err));
          return null;
        })
      ]);

      // Update state with all data at once
      setState({
        userProfile: dashboardData?.userProfile || null,
        courseCompletions: dashboardData?.courseCompletions || [],
        semesterPlans: dashboardData?.semesterPlans || [],
        gpaData: gpaData || null,
        degreeProgram: null,
        minorPrograms: [],
        isLoading: false,
        error: null
      });

    } catch (err) {
      console.error('[useDashboard] Error loading dashboard data:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to load dashboard data')
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [authUser?.id]);

  /**
   * Load data when user changes
   * Only depends on user ID (stable reference)
   */
  useEffect(() => {
    // Check if user actually changed
    if (authUserIdRef.current !== authUser?.id) {
      authUserIdRef.current = authUser?.id;
      loadAllData();
    } else if (!state.userProfile && !state.isLoading && authUser?.id) {
      // Initial load
      loadAllData();
    }
  }, [authUser?.id, loadAllData, state.userProfile, state.isLoading]);

  /**
   * Process and memoize all data
   * Returns stable object references to prevent re-renders
   */
  const processedData = useMemo((): UnifiedDashboardData => {
    const {
      userProfile,
      courseCompletions,
      semesterPlans,
      gpaData,
      degreeProgram,
      minorPrograms,
      isLoading,
      error
    } = state;

    // Process user information
    const user: DashboardUser | null = userProfile ? {
      name: userProfile.full_name || authUser?.user_metadata?.full_name || 'Student',
      email: userProfile.email || authUser?.email || '',
      major: userProfile.major || null,
      threads: Array.isArray(userProfile.threads) ? userProfile.threads : [],
      minors: Array.isArray(userProfile.minors) ? userProfile.minors : [],
      graduationYear: userProfile.graduation_year || (new Date().getFullYear() + 2),
      startYear: userProfile.start_date ?
        parseInt(userProfile.start_date.match(/\d{4}/)?.[0] || '') || (new Date().getFullYear() - 2) :
        (new Date().getFullYear() - 2),
      expectedGraduation: userProfile.expected_graduation ||
        `Spring ${userProfile.graduation_year || (new Date().getFullYear() + 2)}`,
      avatar: authUser?.user_metadata?.avatar_url,
    } : null;

    // Separate courses by status
    const completedCourses = courseCompletions.filter(c => c.status === 'completed');
    const inProgressCourses = courseCompletions.filter(c => c.status === 'in_progress');
    const plannedCourses = semesterPlans.filter(p => p.status === 'planned');

    // Calculate credit totals
    const creditsCompleted = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    const creditsInProgress = inProgressCourses.reduce((sum, c) => sum + c.credits, 0);
    const creditsPlanned = plannedCourses.reduce((sum, p) => sum + (p.credits || 3), 0);

    const totalCreditsRequired = userProfile?.plan_settings?.total_credits || 126;
    const progressPercentage = totalCreditsRequired > 0 ?
      Math.min((creditsCompleted / totalCreditsRequired) * 100, 100) : 0;

    // Calculate if on track for graduation
    const currentYear = new Date().getFullYear();
    const yearsSinceStart = user ? currentYear - user.startYear : 1;
    const expectedProgress = Math.min((yearsSinceStart / 4) * 100, 100);
    const onTrack = progressPercentage >= (expectedProgress * 0.85);

    // Build stats object
    const stats: DashboardStats = {
      creditsCompleted,
      creditsInProgress,
      creditsPlanned,
      totalCreditsRequired,
      currentGPA: gpaData?.currentGPA || 0,
      projectedGPA: gpaData?.trendAnalysis?.projectedNextSemester || 0,
      targetGPA: userProfile?.plan_settings?.target_gpa || 3.0,
      progressPercentage: Math.min(progressPercentage, 100),
      onTrack,
      coursesRemaining: Math.max(0, Math.ceil((totalCreditsRequired - creditsCompleted) / 3)),
      coursesCompleted: completedCourses.length,
    };

    // Process courses
    const courses = {
      completed: completedCourses,
      planned: plannedCourses,
      inProgress: [] as UserSemesterPlan[],
      completedCount: completedCourses.length,
      remainingCount: Math.max(0, Math.ceil((totalCreditsRequired - creditsCompleted) / 3)),
    };

    // Process GPA history
    const gpaHistory = (gpaData?.semesterGPAs || [])
      .map((semester: any) => ({
        semester: semester.semester,
        gpa: semester.gpa,
        credits: semester.credits,
        year: parseInt(semester.semester.match(/\d{4}/)?.[0] || new Date().getFullYear().toString()),
      }))
      .sort((a: any, b: any) => {
        if (a.year !== b.year) return a.year - b.year;
        const seasonOrder: Record<string, number> = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
        const aOrder = seasonOrder[a.semester.split(' ')[0]] || 0;
        const bOrder = seasonOrder[b.semester.split(' ')[0]] || 0;
        return aOrder - bOrder;
      });

  // Placeholder for requirement progress until requirements service is wired
  const progressSummary: DegreeProgressSummary | null = null;

    // Requirements object
    const requirements: DashboardRequirements = {
      degreeProgram,
      minorPrograms,
      progressSummary,
      categoryProgress: [], // Would need calculation logic here
      isLoading: false
    };

    // Generate recent activity
    const recentActivity = [
      ...completedCourses.slice(0, 3).map(course => ({
        id: `completion-${course.id}`,
        type: 'course_completed',
        title: 'Completed course',
        description: `${course.semester} - Grade: ${course.grade}`,
        timestamp: new Date(course.completed_at),
        icon: '✅',
      })),
      ...plannedCourses.slice(0, 2).map(plan => ({
        id: `plan-${plan.id}`,
        type: 'semester_planned',
        title: 'Course planned',
        description: `Added to ${plan.semester_id}`,
        timestamp: new Date(),
        icon: '📅',
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    // Get upcoming deadlines
    // Upcoming deadlines via hook (limit to 5)
    const upcoming = (upcomingDeadlines || []).slice(0, 5).map(d => ({
      id: d.id?.toString() || Math.random().toString(),
      title: d.title || 'Deadline',
      date: new Date(d.date || d.due_date || ''),
      daysLeft: getDaysUntilDeadline({ ...(d as any) }),
      type: d.type || 'deadline'
    }));

    // Determine degree program and minors from aggregated planner data
    const programList = plannerData.programs.filter(Boolean) as any[];
  const degreeProgramComputed = programList.find(p => p.degree_type !== 'Minor' && p.degree_type !== 'Thread') || null;
  const minorProgramsComputed = programList.filter(p => p.degree_type === 'Minor');

    return {
      isLoading,
      error,
      user,
      userProfile,
      stats,
      courses,
      gpaHistory,
      currentGPA: gpaData?.currentGPA || 0,
      requirements: {
        ...requirements,
        degreeProgram: degreeProgramComputed,
        minorPrograms: minorProgramsComputed,
      },
      progressSummary,
      upcomingDeadlines: upcoming,
      recentActivity,
      semesters: plannerData.semesters,
      refresh: loadAllData
    };
  }, [state, authUser, plannerData, upcomingDeadlines, loadAllData]);

  return processedData;
}
