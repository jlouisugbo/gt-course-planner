/**
 * useCourses Hook
 * React Query hook for managing course data with pagination
 * Replaces CoursesProvider for efficient course loading
 */

'use client';

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '@/types/courses';
import { handleError } from '@/lib/errorHandlingUtils';
import { api } from '@/lib/api/client';

/**
 * Course API Response Type
 */
export interface CoursesResponse {
  data: Course[];
  count: number;
  hasMore: boolean;
}

/**
 * Course Filter Parameters
 */
export interface CourseFilters {
  search?: string;
  subject?: string;
  limit?: number;
}

/**
 * Return type for useCourses hook
 */
export interface UseCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => Promise<void>;
  totalCount: number;
}

/**
 * Return type for useAllCourses hook (loads all at once)
 */
export interface UseAllCoursesReturn {
  allCourses: Course[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Build query key for courses with filters
 */
function buildCoursesQueryKey(filters?: CourseFilters) {
  return ['courses', filters || {}];
}

/**
 * Fetch courses from API with pagination
 */
async function fetchCourses(
  filters: CourseFilters = {},
  pageParam: number = 0
): Promise<CoursesResponse> {
  return api.courses.getAll({
    search: filters.search,
    subject: filters.subject,
    limit: filters.limit,
    offset: pageParam,
  });
}

/**
 * Fetch all courses at once (for backwards compatibility)
 * Use sparingly - prefer paginated useCourses() for better performance
 */
async function fetchAllCourses(filters: CourseFilters = {}): Promise<Course[]> {
  const allCourses: Course[] = [];
  let offset = 0;
  const limit = 500; // Batch size
  let hasMore = true;

  while (hasMore && offset < 10000) { // Safety limit
    const response = await fetchCourses({ ...filters, limit }, offset);
    allCourses.push(...response.data);

    hasMore = response.hasMore;
    offset += limit;

    // Small delay to prevent API overload
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return allCourses;
}

/**
 * Main hook for courses with infinite scroll pagination
 *
 * @example
 * ```typescript
 * const { courses, fetchNextPage, hasNextPage } = useCourses({ search: 'CS' });
 *
 * // Load more courses
 * if (hasNextPage) {
 *   fetchNextPage();
 * }
 * ```
 */
export function useCourses(filters?: CourseFilters): UseCoursesReturn {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: fetchNext,
    refetch
  } = useInfiniteQuery<CoursesResponse, Error>({
    queryKey: buildCoursesQueryKey(filters),
    queryFn: ({ pageParam = 0 }) => fetchCourses(filters, pageParam as number),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.hasMore) return undefined;

      // Calculate next offset based on pages loaded
      const totalLoaded = pages.reduce((sum, page) => sum + page.data.length, 0);
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - courses don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') ||
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useCourses',
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  // Flatten all pages into single array
  const courses = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.count || 0;

  return {
    courses,
    isLoading,
    isFetching,
    isError,
    error: error || null,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNext();
      }
    },
    refetch: async () => {
      await refetch();
    },
    totalCount
  };
}

/**
 * Hook to load all courses at once
 * Use this when you need the complete course list (e.g., for filtering, search)
 *
 * WARNING: This loads thousands of courses - use sparingly!
 * Prefer useCourses() with pagination for better performance.
 *
 * @example
 * ```typescript
 * const { allCourses, isLoading } = useAllCourses();
 *
 * // Filter courses client-side
 * const csCourses = allCourses.filter(c => c.code.startsWith('CS'));
 * ```
 */
export function useAllCourses(filters?: CourseFilters): UseAllCoursesReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Course[], Error>({
    queryKey: ['courses', 'all', filters || {}],
    queryFn: () => fetchAllCourses(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication') ||
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useAllCourses',
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  return {
    allCourses: data || [],
    isLoading,
    isError,
    error: error || null,
    refetch: async () => {
      await refetch();
    }
  };
}

/**
 * Hook to search courses with a query string
 * Optimized for search functionality
 *
 * @example
 * ```typescript
 * const { courses, isLoading } = useSearchCourses('algorithms');
 * ```
 */
export function useSearchCourses(searchQuery?: string): UseCoursesReturn {
  return useCourses({ search: searchQuery, limit: 100 });
}

/**
 * Hook to get courses by subject/department
 *
 * @example
 * ```typescript
 * const { courses } = useCoursesBySubject('CS');
 * ```
 */
export function useCoursesBySubject(subject: string): UseCoursesReturn {
  return useCourses({ subject, limit: 100 });
}

/**
 * Hook to prefetch courses
 * Useful for optimistic loading before navigation
 *
 * @example
 * ```typescript
 * const prefetchCourses = usePrefetchCourses();
 *
 * // Prefetch on hover
 * <Link onMouseEnter={() => prefetchCourses({ subject: 'CS' })}>
 *   CS Courses
 * </Link>
 * ```
 */
export function usePrefetchCourses() {
  const queryClient = useQueryClient();

  return (filters?: CourseFilters) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: buildCoursesQueryKey(filters),
      queryFn: ({ pageParam = 0 }) => fetchCourses(filters, pageParam as number),
      initialPageParam: 0,
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate courses cache
 * Use when courses have been modified
 */
export function useInvalidateCourses() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };
}

/**
 * Client-side filtering utilities
 * Use these when you have allCourses loaded and need to filter
 */
export const courseFilters = {
  /**
   * Search courses by code, title, or description
   */
  search: (courses: Course[], query: string): Course[] => {
    if (!query.trim()) return courses;

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return courses.filter(course => {
      const searchableText = [
        course.code,
        course.title,
        course.description || '',
        course.department || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  },

  /**
   * Filter by difficulty range
   */
  byDifficulty: (courses: Course[], range: 'easy' | 'medium' | 'hard'): Course[] => {
    return courses.filter(course => {
      const difficulty = course.difficulty || 3;
      switch (range) {
        case 'easy': return difficulty <= 2;
        case 'medium': return difficulty === 3;
        case 'hard': return difficulty >= 4;
        default: return true;
      }
    });
  },

  /**
   * Filter by credits
   */
  byCredits: (courses: Course[], credits: number): Course[] => {
    return courses.filter(course => course.credits === credits);
  },

  /**
   * Filter by semester offering
   */
  byOffering: (courses: Course[], semester: 'fall' | 'spring' | 'summer'): Course[] => {
    return courses.filter(course => course.offerings?.[semester]);
  },

  /**
   * Filter by subject/department
   */
  bySubject: (courses: Course[], subject: string): Course[] => {
    return courses.filter(course =>
      course.code.toUpperCase().startsWith(subject.toUpperCase())
    );
  }
};

/**
 * Fetch a single course by code
 */
async function fetchCourseByCode(code: string): Promise<Course> {
  const response = await fetch(`/api/courses/${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Hook to fetch a single course by code with college information
 *
 * @example
 * ```typescript
 * const { course, isLoading, error } = useCourseByCode('CS 1301');
 * ```
 */
export function useCourseByCode(code: string) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Course, Error>({
    queryKey: ['course', code],
    queryFn: () => fetchCourseByCode(code),
    enabled: !!code, // Only fetch if code is provided
    staleTime: 15 * 60 * 1000, // 15 minutes - course details don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error.message.includes('404') || error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: `useCourseByCode(${code})`,
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  return {
    course: data || null,
    isLoading,
    isError,
    error: error || null,
    refetch: async () => {
      await refetch();
    }
  };
}
