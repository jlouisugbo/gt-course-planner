import { useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Course } from '@/types/courses';

interface RequirementCoursesResult {
  data: Course[];
  total: number;
  requirementName: string;
  requirementType?: string;
  minCredits?: number;
  selectionCount?: number;
  isFlexible?: boolean;
  message?: string;
}

interface UseRequirementCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  requirementInfo: {
    name: string;
    type: string;
    minCredits: number;
    selectionCount: number;
    isFlexible: boolean;
    message?: string;
  } | null;
  fetchRequirementCourses: (requirementName: string) => Promise<void>;
  clearRequirementCourses: () => void;
}

export const useRequirementCourses = (): UseRequirementCoursesReturn => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirementInfo, setRequirementInfo] = useState<{
    name: string;
    type: string;
    minCredits: number;
    selectionCount: number;
    isFlexible: boolean;
    message?: string;
  } | null>(null);

  const fetchRequirementCourses = useCallback(async (requirementName: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/requirement?name=${encodeURIComponent(requirementName)}&userId=${user.id}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RequirementCoursesResult = await response.json();
      
      setCourses(result.data);
      setRequirementInfo({
        name: result.requirementName,
        type: result.requirementType || 'unknown',
        minCredits: result.minCredits || 0,
        selectionCount: result.selectionCount || 0,
        isFlexible: result.isFlexible || false,
        message: result.message
      });

      console.log(`✅ Requirement courses loaded: ${result.total} courses for "${result.requirementName}"`);
      
    } catch (err) {
      console.error('❌ Failed to fetch requirement courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requirement courses');
      setCourses([]);
      setRequirementInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearRequirementCourses = useCallback(() => {
    setCourses([]);
    setError(null);
    setRequirementInfo(null);
  }, []);

  return {
    courses,
    isLoading,
    error,
    requirementInfo,
    fetchRequirementCourses,
    clearRequirementCourses
  };
};