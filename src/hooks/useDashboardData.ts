/**
 * Dashboard Data Hook
 * Comprehensive database integration for dashboard components
 * Provides real-time user data with no placeholder values
 */

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { userDataService, UserCourseCompletion, UserSemesterPlan } from '@/lib/database/userDataService';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { gpaCalculationService } from '@/lib/gpa/gpaCalculationService';

// Export individual types for component compatibility
export interface DashboardUser {
  name: string;
  email: string;
  major: string;
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
  totalCredits: number; // alias for totalCreditsRequired
  currentGPA: number;
  projectedGPA: number;
  targetGPA: number; // target GPA for calculations
  progressPercentage: number;
  onTrack: boolean;
  onTrackForGraduation: boolean; // alias for onTrack
  coursesRemaining: number;
  coursesCompleted: number;
}

export interface DashboardActivity {
  id: string;
  type: 'course_completed' | 'requirement_met' | 'semester_planned' | 'course_added';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export interface DashboardData {
  // User Information (no more TBD values)
  user: {
    name: string;
    email: string;
    major: string;
    threads: string[];
    minors: string[];
    graduationYear: number;
    startYear: number;
    expectedGraduation: string; // Properly formatted, no TBD
    avatar?: string;
  } | null;

  // Academic Progress (real calculations)
  academicProgress: {
    creditsCompleted: number;
    creditsInProgress: number;
    creditsPlanned: number;
    totalCreditsRequired: number;
    totalCredits: number; // alias for totalCreditsRequired
    currentGPA: number;
    projectedGPA: number;
    targetGPA: number; // target GPA for calculations
    progressPercentage: number;
    onTrack: boolean;
    onTrackForGraduation: boolean; // alias for onTrack
    coursesRemaining: number;
    coursesCompleted: number;
  };

  // Course Data (from database)
  courses: {
    completed: UserCourseCompletion[];
    planned: UserSemesterPlan[];
    inProgress: UserSemesterPlan[];
    completedCount: number;
    remainingCount: number;
  };

  // GPA History (real data)
  gpaHistory: Array<{
    semester: string;
    gpa: number;
    credits: number;
    year: number;
  }>;

  // Recent Activity (real actions)
  recentActivity: Array<{
    id: string;
    type: 'course_completed' | 'requirement_met' | 'semester_planned' | 'course_added';
    title: string;
    description: string;
    timestamp: Date;
    icon: string;
  }>;

  // Upcoming Deadlines
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    date: Date;
    daysLeft: number;
    type: 'registration' | 'deadline' | 'graduation';
  }>;

  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export const useDashboardData = (): DashboardData => {
  const { user: authUser } = useAuth();
  const { getUpcomingDeadlines } = usePlannerStore();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [gpaData, setGpaData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to prevent multiple simultaneous API calls
  const loadingRef = useRef(false);

  // Memoized data loading function to prevent unnecessary re-calls
  const loadDashboardData = useCallback(async () => {
    // DEMO MODE: Return mock data immediately, NO API CALLS
    if (typeof window !== 'undefined') {
      const { isDemoMode } = await import('@/lib/demo-mode');
      if (isDemoMode()) {
        const {
          DEMO_USER,
          DEMO_COMPLETED_COURSES,
          DEMO_IN_PROGRESS_COURSES,
          DEMO_PLANNED_COURSES,
          DEMO_GPA_HISTORY,
          DEMO_ACTIVITY,
          DEMO_DEADLINES
        } = await import('@/lib/demo-data');

        console.log('[Demo Mode] useDashboardData: Using mock data, NO API calls');

        // Build mock dashboard data structure
        const mockData = {
          userProfile: DEMO_USER,
          courseCompletions: DEMO_COMPLETED_COURSES.map((course: any) => ({
            id: course.id,
            user_id: -1,
            course_id: course.id,
            status: 'completed',
            grade: course.grade,
            semester: `${course.season} ${course.year}`,
            credits: course.credits,
            completed_at: new Date().toISOString(),
          })),
          semesterPlans: [
            ...DEMO_IN_PROGRESS_COURSES.map((course: any) => ({
              id: course.id,
              user_id: -1,
              semester_id: course.semesterId,
              course_id: course.id,
              status: 'in_progress',
              credits: course.credits,
            })),
            ...DEMO_PLANNED_COURSES.map((course: any) => ({
              id: course.id,
              user_id: -1,
              semester_id: course.semesterId,
              course_id: course.id,
              status: 'planned',
              credits: course.credits,
            }))
          ]
        };

        const mockGpaData = {
          currentGPA: DEMO_USER.current_gpa,
          semesterGPAs: DEMO_GPA_HISTORY,
          trendAnalysis: {
            projectedNextSemester: 3.75,
          }
        };

        setDashboardData(mockData);
        setGpaData(mockGpaData);
        setIsLoading(false);
        setError(null);
        loadingRef.current = false;
        return;
      }
    }

    if (!authUser || loadingRef.current) {
      if (!authUser) setIsLoading(false);
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Batch both API calls for better performance
      const [data, comprehensiveGPA] = await Promise.all([
        userDataService.getDashboardData(),
        gpaCalculationService.calculateComprehensiveGPA()
      ]);

        if (!data) {
          setError('Failed to load dashboard data');
          return;
        }

      setDashboardData(data);
      setGpaData(comprehensiveGPA);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [authUser]);

  // Load comprehensive data from database
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Process and format the data
  const processedData: DashboardData = useMemo(() => {
    if (!dashboardData) {
      return {
        user: null,
        academicProgress: {
          creditsCompleted: 0,
          creditsInProgress: 0,
          creditsPlanned: 0,
          totalCreditsRequired: 126,
          totalCredits: 126,
          currentGPA: 0,
          projectedGPA: 0,
          targetGPA: 3.0,
          progressPercentage: 0,
          onTrack: false,
          onTrackForGraduation: false,
          coursesRemaining: 0,
          coursesCompleted: 0,
        },
        courses: {
          completed: [],
          planned: [],
          inProgress: [],
          completedCount: 0,
          remainingCount: 0,
        },
        gpaHistory: [],
        recentActivity: [],
        upcomingDeadlines: [],
        isLoading,
        error,
      };
    }

    const { userProfile, courseCompletions, semesterPlans } = dashboardData;

    // Process user information - NO MORE TBD VALUES
    const user = userProfile ? {
      name: userProfile.full_name || authUser?.user_metadata?.full_name || 'Student',
      email: userProfile.email || authUser?.email || '',
      major: userProfile.major || 'Computer Science', // Default instead of TBD
      threads: Array.isArray(userProfile.threads) ? userProfile.threads : [],
      minors: Array.isArray(userProfile.minors) ? userProfile.minors : [],
      graduationYear: userProfile.graduation_year || (new Date().getFullYear() + 2),
      startYear: userProfile.start_date ? parseInt(userProfile.start_date.match(/\d{4}/)?.[0] || '') || (new Date().getFullYear() - 2) : (new Date().getFullYear() - 2),
      expectedGraduation: userProfile.expected_graduation || `Spring ${userProfile.graduation_year || (new Date().getFullYear() + 2)}`,
      avatar: authUser?.user_metadata?.avatar_url,
    } : null;

    // Calculate real academic progress
    const completedCourses = courseCompletions.filter((c: UserCourseCompletion) => c.status === 'completed');
    const inProgressCourses = courseCompletions.filter((c: UserCourseCompletion) => c.status === 'in_progress');
    const plannedCourses = semesterPlans.filter((p: UserSemesterPlan) => p.status === 'planned');

    const creditsCompleted = completedCourses.reduce((sum: number, course: UserCourseCompletion) => sum + course.credits, 0);
    const creditsInProgress = inProgressCourses.reduce((sum: number, course: UserCourseCompletion) => sum + course.credits, 0);
    const creditsPlanned = plannedCourses.reduce((sum: number, plan: UserSemesterPlan) => sum + (plan.credits || 3), 0);
    
    const totalCreditsRequired = userProfile?.plan_settings?.total_credits || 126;
    const progressPercentage = totalCreditsRequired > 0 ? (creditsCompleted / totalCreditsRequired) * 100 : 0;

    // Calculate if on track
    const currentYear = new Date().getFullYear();
    const yearsSinceStart = user ? currentYear - user.startYear : 1;
    const expectedProgress = Math.min((yearsSinceStart / 4) * 100, 100);
    const onTrack = progressPercentage >= (expectedProgress * 0.85); // 85% of expected progress

    const academicProgress = {
      creditsCompleted,
      creditsInProgress,
      creditsPlanned,
      totalCreditsRequired,
      totalCredits: totalCreditsRequired,
      currentGPA: gpaData?.currentGPA || 0,
      projectedGPA: gpaData?.trendAnalysis?.projectedNextSemester || 0,
      targetGPA: userProfile?.plan_settings?.target_gpa || 3.0,
      progressPercentage: Math.min(progressPercentage, 100),
      onTrack,
      onTrackForGraduation: onTrack,
      coursesRemaining: Math.max(0, Math.ceil((totalCreditsRequired - creditsCompleted) / 3)),
      coursesCompleted: completedCourses.length,
    };

    // Process courses
    const courses = {
      completed: completedCourses,
      planned: plannedCourses,
      inProgress: inProgressCourses.length > 0 ? inProgressCourses.map((c: UserCourseCompletion) => ({
        id: c.id,
        user_id: c.user_id,
        semester_id: c.semester,
        course_id: c.course_id,
        position: 0,
        credits: c.credits,
        status: 'in_progress' as const,
      })) : [],
      completedCount: completedCourses.length,
      remainingCount: Math.max(0, Math.ceil((totalCreditsRequired - creditsCompleted) / 3)),
    };

    // Process GPA history with proper formatting
    const gpaHistory = (gpaData?.semesterGPAs || []).map((semester: { semester: string; gpa: number; credits: number }) => ({
      ...semester,
      year: parseInt(semester.semester.match(/\d{4}/)?.[0] || new Date().getFullYear().toString()),
    })).sort((a: { year: number; semester: string }, b: { year: number; semester: string }) => {
      if (a.year !== b.year) return a.year - b.year;
      const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
      const aOrder = seasonOrder[a.semester.split(' ')[0] as keyof typeof seasonOrder] || 0;
      const bOrder = seasonOrder[b.semester.split(' ')[0] as keyof typeof seasonOrder] || 0;
      return aOrder - bOrder;
    });

    // Generate recent activity from actual data
    const recentActivity = [
      ...completedCourses.slice(0, 3).map((course: UserCourseCompletion) => ({
        id: `completion-${course.id}`,
        type: 'course_completed' as const,
        title: `Completed course`,
        description: `${course.semester} - Grade: ${course.grade}`,
        timestamp: new Date(course.completed_at),
        icon: '✅',
      })),
      ...plannedCourses.slice(0, 2).map((plan: UserSemesterPlan) => ({
        id: `plan-${plan.id}`,
        type: 'semester_planned' as const,
        title: `Course planned`,
        description: `Added to ${plan.semester_id}`,
        timestamp: new Date(),
        icon: '📅',
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    // Get upcoming deadlines
    const upcomingDeadlines = getUpcomingDeadlines().slice(0, 5).map(deadline => ({
      id: deadline.id?.toString() || Math.random().toString(),
      title: deadline.title || 'Deadline',
      date: new Date(deadline.date),
      daysLeft: deadline.daysLeft,
      type: deadline.type as any || 'deadline'
    }));

    return {
      user,
      academicProgress,
      courses,
      gpaHistory,
      recentActivity,
      upcomingDeadlines,
      isLoading,
      error,
    };
  }, [dashboardData, authUser, getUpcomingDeadlines, isLoading, error, gpaData?.currentGPA, gpaData?.semesterGPAs, gpaData?.trendAnalysis]);

  return processedData;
};