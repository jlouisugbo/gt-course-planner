/**
 * useDegreePrograms Hook
 * React Query hook for managing degree program requirements
 * Replaces scattered usePlannerStore.fetchDegreeProgramRequirements calls
 */

'use client';

import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { handleError } from '@/lib/errorHandlingUtils';
import { api } from '@/lib/api/client';

/**
 * Degree Program Response Type from API
 */
export interface DegreeProgramResponse {
  id: number;
  name: string;
  degree_type: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread';
  total_credits: number;
  requirements: any; // JSON structure varies by program
  footnotes?: string;
}

/**
 * Query parameters for degree program
 */
export interface DegreeProgramParams {
  major: string;
  degreeType?: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread';
}

/**
 * Return type for useDegreeProgram hook
 */
export interface UseDegreeProgramReturn {
  program: DegreeProgramResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Return type for useAllDegreePrograms hook
 */
export interface UseAllDegreeProgramsReturn {
  programs: DegreeProgramResponse[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Build query key for degree program
 */
function buildDegreeProgramQueryKey(params: DegreeProgramParams) {
  return ['degree-program', params.major, params.degreeType || 'BS'];
}

/**
 * Fetch degree program from API
 */
async function fetchDegreeProgram(params: DegreeProgramParams): Promise<DegreeProgramResponse> {
  return api.degreePrograms.get({ major: params.major, degreeType: params.degreeType });
}

/**
 * Fetch all degree programs (for program selection)
 */
async function fetchAllDegreePrograms(): Promise<DegreeProgramResponse[]> {
  const res = await api.degreePrograms.getAll();
  return res.programs || [];
}

/**
 * Main hook for fetching a specific degree program
 *
 * @example
 * ```typescript
 * const { program, isLoading } = useDegreeProgram({
 *   major: 'Computer Science',
 *   degreeType: 'BS'
 * });
 *
 * // Access requirements
 * const requirements = program?.requirements;
 * ```
 */
export function useDegreeProgram(params: DegreeProgramParams): UseDegreeProgramReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<DegreeProgramResponse, Error>({
    queryKey: buildDegreeProgramQueryKey(params),
    queryFn: () => fetchDegreeProgram(params),
    enabled: !!params.major, // Only fetch if major is provided
    staleTime: 30 * 60 * 1000, // 30 minutes - degree requirements rarely change
    gcTime: 60 * 60 * 1000, // 1 hour cache time
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') ||
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        return false;
      }
      // Don't retry on 404 (program not found)
      if (error.message.includes('not found') ||
          error.message.includes('404') ||
          error.message.includes('No degree program')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useDegreeProgram',
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  return {
    program: data || null,
    isLoading,
    isError,
    error: error || null,
    refetch: async () => {
      await refetch();
    }
  };
}

/**
 * Hook to fetch all available degree programs
 * Useful for program selection dropdowns
 *
 * @example
 * ```typescript
 * const { programs, isLoading } = useAllDegreePrograms();
 *
 * // Render dropdown
 * programs.map(p => <option key={p.id}>{p.name}</option>)
 * ```
 */
export function useAllDegreePrograms(): UseAllDegreeProgramsReturn {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<DegreeProgramResponse[], Error>({
    queryKey: ['degree-programs', 'all'],
    queryFn: fetchAllDegreePrograms,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication') ||
          error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useAllDegreePrograms',
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  return {
    programs: data || [],
    isLoading,
    isError,
    error: error || null,
    refetch: async () => {
      await refetch();
    }
  };
}

/**
 * Hook to fetch multiple degree programs (e.g., major + minors)
 *
 * @example
 * ```typescript
 * const { programs, isLoading } = useMultipleDegreePrograms([
 *   { major: 'Computer Science', degreeType: 'BS' },
 *   { major: 'Mathematics', degreeType: 'Minor' }
 * ]);
 * ```
 */
export function useMultipleDegreePrograms(
  programParams: DegreeProgramParams[]
): {
  programs: (DegreeProgramResponse | null)[];
  isLoading: boolean;
  isError: boolean;
  errors: (Error | null)[];
} {
  // Fetch all programs in parallel using useQueries (safe for dynamic lists)
  const queries = useQueries({
    queries: programParams.map(params => ({
      queryKey: buildDegreeProgramQueryKey(params),
      queryFn: () => fetchDegreeProgram(params),
      enabled: !!params.major,
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: Error) => {
        if (error.message.includes('Authentication') ||
            error.message.includes('not found') ||
            error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      }
    }))
  });

  return {
    programs: queries.map(q => q.data || null),
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    errors: queries.map(q => q.error || null)
  };
}

/**
 * Hook to prefetch degree program
 * Useful for optimistic loading before navigation
 *
 * @example
 * ```typescript
 * const prefetchProgram = usePrefetchDegreeProgram();
 *
 * // Prefetch on hover
 * <Link onMouseEnter={() => prefetchProgram({ major: 'Computer Science' })}>
 *   View CS Requirements
 * </Link>
 * ```
 */
export function usePrefetchDegreeProgram() {
  const queryClient = useQueryClient();

  return (params: DegreeProgramParams) => {
    queryClient.prefetchQuery({
      queryKey: buildDegreeProgramQueryKey(params),
      queryFn: () => fetchDegreeProgram(params),
      staleTime: 30 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate degree program cache
 * Use when program requirements have been updated
 */
export function useInvalidateDegreePrograms() {
  const queryClient = useQueryClient();

  return (params?: DegreeProgramParams) => {
    if (params) {
      // Invalidate specific program
      queryClient.invalidateQueries({
        queryKey: buildDegreeProgramQueryKey(params)
      });
    } else {
      // Invalidate all programs
      queryClient.invalidateQueries({
        queryKey: ['degree-program']
      });
      queryClient.invalidateQueries({
        queryKey: ['degree-programs']
      });
    }
  };
}

/**
 * Utility function to extract requirement categories from program
 */
export function extractRequirementCategories(program: DegreeProgramResponse): string[] {
  if (!program.requirements || typeof program.requirements !== 'object') {
    return [];
  }

  return Object.keys(program.requirements);
}

/**
 * Utility function to get courses from a specific requirement category
 */
export function getCoursesFromCategory(
  program: DegreeProgramResponse,
  category: string
): string[] {
  if (!program.requirements || !program.requirements[category]) {
    return [];
  }

  const requirement = program.requirements[category];

  // Handle different requirement structures
  if (Array.isArray(requirement)) {
    return requirement;
  }

  if (requirement.courses && Array.isArray(requirement.courses)) {
    return requirement.courses;
  }

  if (requirement.required && Array.isArray(requirement.required)) {
    return requirement.required;
  }

  return [];
}

/**
 * Utility function to calculate total required credits from requirements
 */
export function calculateTotalCredits(program: DegreeProgramResponse): number {
  // Use total_credits if available
  if (program.total_credits) {
    return program.total_credits;
  }

  // Otherwise try to sum from requirements
  if (!program.requirements || typeof program.requirements !== 'object') {
    return 0;
  }

  let total = 0;
  Object.values(program.requirements).forEach((req: any) => {
    if (req.credits) {
      total += req.credits;
    } else if (req.min_credits) {
      total += req.min_credits;
    }
  });

  return total;
}
