import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { usePlannerStore } from './usePlannerStore';

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
      
      console.log('✅ Loaded completion data from Zustand store:', {
        completedCourses: completedCourses.size,
        plannedCourses: plannedCourses.size,
        groups: completedGroups.size
      });
      
    } catch (err) {
      console.error('Error loading completion data:', err);
      setError('Error loading completion data');
    } finally {
      setIsLoading(false);
    }
  }, [user, completedCourses.size, plannedCourses.size, completedGroups.size]);

  // Toggle course completion using Zustand store
  const toggleCourseCompletion = useCallback(async (courseCode: string) => {
    if (!user) return;

    const { getAllCourses, updateCourseStatus, addCourseToSemester, getSafeSemesters } = usePlannerStore.getState();
    const allCourses = getAllCourses();
    const course = allCourses.find(c => c.code === courseCode);
    
    if (!course) {
      // Course not in planner yet - we need to add it first
      console.log(`Course ${courseCode} not found in planner, adding as completed`);
      
      // Find the earliest available semester to add the course
      const semesters = getSafeSemesters();
      const earliestSemester = semesters.find(s => s.year <= new Date().getFullYear()) || semesters[0];
      
      if (!earliestSemester) {
        console.warn('No semesters available to add course');
        return;
      }

      // Create a placeholder course object for the requirement course
      const newCourse = {
        id: Date.now(), // Temporary ID
        code: courseCode,
        title: `${courseCode} (From Requirements)`,
        credits: 3, // Default credits
        semesterId: earliestSemester.id,
        status: 'completed' as const,
        grade: 'A'
      };

      addCourseToSemester(newCourse);
      console.log(`✅ Added and marked course as completed: ${courseCode}`);
      return;
    }

    const wasCompleted = course.status === 'completed';
    
    if (wasCompleted) {
      updateCourseStatus(course.id, course.semesterId, 'planned');
      console.log(`❌ Marked course as planned: ${courseCode}`);
    } else {
      updateCourseStatus(course.id, course.semesterId, 'completed', 'A'); // Default grade
      console.log(`✅ Marked course as completed: ${courseCode}`);
    }
    
  }, [user]);

  // Set group completion (local state only - no database persistence needed)
  const setGroupCompletion = useCallback(async (groupId: string, isSatisfied: boolean) => {
    if (!user) return;

    const newCompletedGroups = new Set(completedGroups);
    const wasCompleted = newCompletedGroups.has(groupId);
    
    if (isSatisfied && !wasCompleted) {
      newCompletedGroups.add(groupId);
      console.log(`✅ Group satisfied: ${groupId}`);
    } else if (!isSatisfied && wasCompleted) {
      newCompletedGroups.delete(groupId);
      console.log(`❌ Group unsatisfied: ${groupId}`);
    } else {
      return; // No change needed
    }
    
    setCompletedGroups(newCompletedGroups);
    console.log('💾 Updated completed groups in local state');
  }, [user, completedGroups]);

  // Preserve completed courses when major changes (now handled by Zustand persistence)
  const preserveCompletionsOnMajorChange = useCallback(async (newMajor: string, oldMajor?: string) => {
    if (!user) return;
    
    try {
      // Completion data is now preserved automatically in Zustand store
      console.log(`🔄 Major changed from "${oldMajor}" to "${newMajor}". Completed and planned courses preserved in Zustand store.`);
      console.log(`✅ Preserved ${completedCourses.size} completed courses, ${plannedCourses.size} planned courses, and ${completedGroups.size} completed groups`);
      
      return {
        preservedCourses: Array.from(completedCourses),
        preservedPlannedCourses: Array.from(plannedCourses),
        preservedGroups: Array.from(completedGroups)
      };
    } catch (error) {
      console.error('Error preserving completions on major change:', error);
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
    console.log(`🔗 Linked flexible course: ${courseCode} for requirement: ${requirementType}`);
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