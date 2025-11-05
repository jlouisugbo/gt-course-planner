import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface InfiniteCoursesOptions {
  initialLimit?: number;
  search?: string;
  types?: string[];
  credits?: number[];
}

export function useInfiniteCourses(options: InfiniteCoursesOptions = {}) {
  const { initialLimit = 100, search, types, credits } = options;

  const fetchPage = (offset: number) =>
    api.courses.getAll({
      search,
      limit: initialLimit,
      offset,
    });

  return useInfiniteQuery<any, Error>({
    queryKey: ['courses', { search: search || '', types: types || [], credits: credits || [], limit: initialLimit }],
    queryFn: async ({ pageParam = 0 }) => fetchPage(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, pages: any[]) => {
      if (!lastPage) return undefined;
      // Use count/limit heuristic if totalPages is not provided
      if (typeof lastPage.totalPages === 'number') {
        return lastPage.totalPages > pages.length ? pages.length : undefined;
      }
      return lastPage.hasMore ? pages.reduce((sum, p) => sum + (p?.data?.length || 0), 0) : undefined;
    }
  });
}
