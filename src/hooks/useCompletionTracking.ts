import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePlannerStore } from './usePlannerStore';
import { createComponentLogger } from '@/lib/security/logger';

export const useCompletionTracking = () => {
  const { user } = useAuth();
  const { getCoursesByStatus } = usePlannerStore();
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());
  const [flexibleCourseSelections, setFlexibleCourseSelections] = useState<Record<string, string>>({}); // requirementType -> courseCode
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get completed and planned courses from Zustand store instead of database
  const completedCourses = useMemo(() => new Set(
    getCoursesByStatus('completed').map(course => course.code)
  ), [getCoursesByStatus]);
  
  const plannedCourses = useMemo(() => new Set(
    getCoursesByStatus('planned').map(course => course.code)
  ), [getCoursesByStatus]);

  // Load completion data from Zustand store (no longer from database)
  const loadCompletionData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Completion data now comes from Zustand store
      // completedCourses is computed from store state above
      // completedGroups remains local state for UI groups
      
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Loaded completion data from Zustand store', {
        completedCount: completedCourses.size,
        plannedCount: plannedCourses.size,
        groupsCount: completedGroups.size
      });
      
    } catch (err) {
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.error('Error loading completion data', err);
      setError('Error loading completion data');
    } finally {
      setIsLoading(false);
    }
  }, [user, completedCourses.size, plannedCourses.size, completedGroups.size]);

  // Save completion to database
  const saveCompletionToDatabase = useCallback(async (courseCode: string, isCompleted: boolean, grade?: string, semester?: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/course-completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode,
          grade: grade || 'A',
          semester: semester || `${new Date().getFullYear()}-fall`,
          credits: 3, // Default credits
          status: isCompleted ? 'completed' : 'planned'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save completion to database');
      }

      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Course completion status updated', {
        operation: 'saveCompletionToDatabase',
        status: isCompleted ? 'completed' : 'planned'
      });
    } catch (error) {
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.error('Error saving completion to database', error);
      // Continue anyway - don't let database errors break the UI
    }
  }, [user]);

  // Toggle course completion using Zustand store
  const toggleCourseCompletion = useCallback(async (courseCode: string) => {
    if (!user) return;

    const { getAllCourses, updateCourseStatus, addCourseToSemester, getSafeSemesters } = usePlannerStore.getState();
    const allCourses = getAllCourses();
    const course = allCourses.find(c => c.code === courseCode);
    
    if (!course) {
      // Course not in planner yet - we need to add it first
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Course not found in planner, adding as completed');
      
      // Find the earliest available semester to add the course
      const semesters = getSafeSemesters();
      const earliestSemester = semesters.find(s => s.year <= new Date().getFullYear()) || semesters[0];
      
      if (!earliestSemester) {
        const logger = createComponentLogger('COMPLETION_TRACKING');
        logger.warn('No semesters available to add course');
        return;
      }

      // Create a placeholder course object for the requirement course
      const newCourse = {
        id: Date.now(), // Temporary ID
        code: courseCode,
        title: `${courseCode} (From Requirements)`,
        description: `Course ${courseCode} added from requirements tracking`,
        credits: 3, // Default credits
        prerequisites: {} as any, // Placeholder for complex type
        college: 'Unknown',
        offerings: { fall: true, spring: true, summer: false },
        difficulty: 3,
        type: 'requirement',
        semesterId: earliestSemester.id,
        status: 'completed' as const,
        grade: 'A',
        year: earliestSemester.year,
        season: earliestSemester.season as "Fall" | "Spring" | "Summer"
      };

      addCourseToSemester(newCourse);
      await saveCompletionToDatabase(courseCode, true, 'A', `${earliestSemester.year}-${earliestSemester.season}`);
      logger.debug('Added and marked course as completed');
      return;
    }

    const wasCompleted = course.status === 'completed';
    
    if (wasCompleted) {
      updateCourseStatus(course.id, course.semesterId, 'planned');
      await saveCompletionToDatabase(courseCode, false);
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Marked course as planned');
    } else {
      updateCourseStatus(course.id, course.semesterId, 'completed', 'A'); // Default grade
      await saveCompletionToDatabase(courseCode, true, 'A');
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Marked course as completed');
    }
    
  }, [user, saveCompletionToDatabase]);

  // Set group completion (local state only - no database persistence needed)
  const setGroupCompletion = useCallback(async (groupId: string, isSatisfied: boolean) => {
    if (!user) return;

    const newCompletedGroups = new Set(completedGroups);
    const wasCompleted = newCompletedGroups.has(groupId);
    
    if (isSatisfied && !wasCompleted) {
      newCompletedGroups.add(groupId);
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Group requirement satisfied');
    } else if (!isSatisfied && wasCompleted) {
      newCompletedGroups.delete(groupId);
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.debug('Group requirement unsatisfied');
    } else {
      return; // No change needed
    }
    
    setCompletedGroups(newCompletedGroups);
    const logger = createComponentLogger('COMPLETION_TRACKING');
    logger.debug('Updated completed groups in local state');
  }, [user, completedGroups]);

  // Preserve completed courses when major changes (now handled by Zustand persistence)
  const preserveCompletionsOnMajorChange = useCallback(async (_newMajor: string, _oldMajor?: string) => {
    if (!user) return;
    
    try {
      // Completion data is now preserved automatically in Zustand store
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.info('Major changed - course data preserved', {
        preservedCompleted: completedCourses.size,
        preservedPlanned: plannedCourses.size,
        preservedGroups: completedGroups.size
      });
      
      return {
        preservedCourses: Array.from(completedCourses),
        preservedPlannedCourses: Array.from(plannedCourses),
        preservedGroups: Array.from(completedGroups)
      };
    } catch (error) {
      const logger = createComponentLogger('COMPLETION_TRACKING');
      logger.error('Error preserving completions on major change', error);
      return {
        preservedCourses: [],
        preservedPlannedCourses: [],
        preservedGroups: []
      };
    }
  }, [user, completedCourses, plannedCourses, completedGroups]);

  // Set flexible course selection
  const setFlexibleCourseSelection = useCallback((requirementType: string, courseCode: string) => {
    setFlexibleCourseSelections(prev => ({
      ...prev,
      [requirementType]: courseCode
    }));
    const logger = createComponentLogger('COMPLETION_TRACKING');
    logger.debug('Flexible course linked to requirement');
  }, []);

  // Get flexible course selection
  const getFlexibleCourseSelection = useCallback((requirementType: string): string | undefined => {
    return flexibleCourseSelections[requirementType];
  }, [flexibleCourseSelections]);

  // Load data on mount and user change
  useEffect(() => {
    loadCompletionData();
  }, [loadCompletionData]);

  return {
    completedCourses,
    plannedCourses,
    completedGroups,
    flexibleCourseSelections,
    isLoading,
    error,
    toggleCourseCompletion,
    setGroupCompletion,
    setFlexibleCourseSelection,
    getFlexibleCourseSelection,
    preserveCompletionsOnMajorChange,
    reloadCompletionData: loadCompletionData,
  };
};