/**
 * useDeadlines Hook
 * React Query hook for managing academic deadlines
 * Replaces usePlannerStore.fetchDeadlines
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleError } from '@/lib/errorHandlingUtils';
import { api } from '@/lib/api/client';

/**
 * Deadline Type
 */
export interface Deadline {
  id: number;
  title: string;
  description?: string;
  date?: string; // ISO timestamp (legacy field)
  due_date?: string; // ISO timestamp
  type: 'registration' | 'withdrawal' | 'graduation' | 'thread-confirmation' | 'financial' | 'housing';
  category?: string;
  urgent: boolean;
  is_active: boolean;
  source?: string; // URL to official GT page
  created_at?: string;
  updated_at?: string;
}

/**
 * Deadline creation/update data
 */
export interface DeadlineInput {
  title: string;
  description?: string;
  due_date: string;
  type: 'registration' | 'withdrawal' | 'graduation' | 'thread-confirmation' | 'financial' | 'housing';
  category?: string;
  is_active?: boolean;
}

/**
 * Return type for useDeadlines hook
 */
export interface UseDeadlinesReturn {
  deadlines: Deadline[];
  upcomingDeadlines: Deadline[];
  urgentDeadlines: Deadline[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createDeadline: (deadline: DeadlineInput) => Promise<Deadline>;
  updateDeadline: (id: number, deadline: Partial<DeadlineInput>) => Promise<Deadline>;
  deleteDeadline: (id: number) => Promise<void>;
}

/**
 * Query key for deadlines
 */
const DEADLINES_QUERY_KEY = ['deadlines'];

/**
 * Fetch deadlines from API
 */
async function fetchDeadlines(): Promise<Deadline[]> {
  const deadlines = await api.deadlines.getAll();
  return deadlines.map((deadline: any) => ({
    ...deadline,
    date: deadline.due_date || deadline.date,
    due_date: deadline.due_date || deadline.date
  }));
}

/**
 * Create new deadline
 */
async function createDeadlineApi(deadline: DeadlineInput): Promise<Deadline> {
  return api.deadlines.create(deadline);
}

/**
 * Update existing deadline
 */
async function updateDeadlineApi(id: number, deadline: Partial<DeadlineInput>): Promise<Deadline> {
  return api.deadlines.update(id, deadline);
}

/**
 * Delete deadline
 */
async function deleteDeadlineApi(id: number): Promise<void> {
  await api.deadlines.delete(id);
}

/**
 * Main hook for deadlines
 *
 * @example
 * ```typescript
 * const { deadlines, upcomingDeadlines, createDeadline } = useDeadlines();
 *
 * // Create new deadline
 * await createDeadline({
 *   title: 'Drop Deadline',
 *   due_date: '2025-01-15T23:59:59Z',
 *   type: 'withdrawal',
 *   is_active: true
 * });
 * ```
 */
export function useDeadlines(): UseDeadlinesReturn {
  const queryClient = useQueryClient();

  // Fetch deadlines
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Deadline[], Error>({
    queryKey: DEADLINES_QUERY_KEY,
    queryFn: fetchDeadlines,
    staleTime: 5 * 60 * 1000, // 5 minutes - deadlines don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes to catch new deadlines
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
          context: 'useDeadlines',
          showToast: false,
          logToConsole: true
        });
      }
    }
  });

  // Create deadline mutation
  const createMutation = useMutation({
    mutationFn: createDeadlineApi,
    onMutate: async (newDeadline: DeadlineInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: DEADLINES_QUERY_KEY });

      // Snapshot previous value
      const previousDeadlines = queryClient.getQueryData<Deadline[]>(DEADLINES_QUERY_KEY);

      // Optimistically update
      if (previousDeadlines) {
        const optimisticDeadline: Deadline = {
          id: Date.now(), // Temporary ID
          ...newDeadline,
          date: newDeadline.due_date,
          urgent: false,
          is_active: newDeadline.is_active ?? true,
          created_at: new Date().toISOString()
        };

        queryClient.setQueryData<Deadline[]>(
          DEADLINES_QUERY_KEY,
          [...previousDeadlines, optimisticDeadline]
        );
      }

      return { previousDeadlines };
    },
    onError: (error, newDeadline, context) => {
      // Rollback on error
      if (context?.previousDeadlines) {
        queryClient.setQueryData(DEADLINES_QUERY_KEY, context.previousDeadlines);
      }
      handleError(error, {
        context: 'createDeadline',
        showToast: true,
        userMessage: 'Failed to create deadline. Please try again.'
      });
    },
    onSuccess: (newDeadline) => {
      console.log('[useDeadlines] Deadline created successfully:', newDeadline.title);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: DEADLINES_QUERY_KEY });
    }
  });

  // Update deadline mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DeadlineInput> }) =>
      updateDeadlineApi(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: DEADLINES_QUERY_KEY });

      const previousDeadlines = queryClient.getQueryData<Deadline[]>(DEADLINES_QUERY_KEY);

      // Optimistically update
      if (previousDeadlines) {
        queryClient.setQueryData<Deadline[]>(
          DEADLINES_QUERY_KEY,
          previousDeadlines.map(deadline =>
            deadline.id === id
              ? {
                  ...deadline,
                  ...data,
                  date: data.due_date || deadline.date,
                  updated_at: new Date().toISOString()
                }
              : deadline
          )
        );
      }

      return { previousDeadlines };
    },
    onError: (error, variables, context) => {
      if (context?.previousDeadlines) {
        queryClient.setQueryData(DEADLINES_QUERY_KEY, context.previousDeadlines);
      }
      handleError(error, {
        context: 'updateDeadline',
        showToast: true,
        userMessage: 'Failed to update deadline. Please try again.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DEADLINES_QUERY_KEY });
    }
  });

  // Delete deadline mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDeadlineApi,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: DEADLINES_QUERY_KEY });

      const previousDeadlines = queryClient.getQueryData<Deadline[]>(DEADLINES_QUERY_KEY);

      // Optimistically remove
      if (previousDeadlines) {
        queryClient.setQueryData<Deadline[]>(
          DEADLINES_QUERY_KEY,
          previousDeadlines.filter(deadline => deadline.id !== id)
        );
      }

      return { previousDeadlines };
    },
    onError: (error, id, context) => {
      if (context?.previousDeadlines) {
        queryClient.setQueryData(DEADLINES_QUERY_KEY, context.previousDeadlines);
      }
      handleError(error, {
        context: 'deleteDeadline',
        showToast: true,
        userMessage: 'Failed to delete deadline. Please try again.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DEADLINES_QUERY_KEY });
    }
  });

  // Computed values
  const deadlines = data || [];

  // Get upcoming deadlines (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingDeadlines = deadlines.filter(deadline => {
    const deadlineDate = new Date(deadline.date || deadline.due_date || '');
    return deadlineDate >= now && deadlineDate <= thirtyDaysFromNow;
  });

  // Get urgent deadlines (next 7 days or marked urgent)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const urgentDeadlines = deadlines.filter(deadline => {
    if (deadline.urgent) return true;

    const deadlineDate = new Date(deadline.date || deadline.due_date || '');
    return deadlineDate >= now && deadlineDate <= sevenDaysFromNow;
  });

  return {
    deadlines,
    upcomingDeadlines,
    urgentDeadlines,
    isLoading,
    isError,
    error: error || null,
    refetch: async () => {
      await refetch();
    },
    createDeadline: async (deadline: DeadlineInput) => {
      return createMutation.mutateAsync(deadline);
    },
    updateDeadline: async (id: number, deadline: Partial<DeadlineInput>) => {
      return updateMutation.mutateAsync({ id, data: deadline });
    },
    deleteDeadline: async (id: number) => {
      await deleteMutation.mutateAsync(id);
    }
  };
}

/**
 * Hook to get deadlines by type
 *
 * @example
 * ```typescript
 * const { deadlines } = useDeadlinesByType('registration');
 * ```
 */
export function useDeadlinesByType(type: Deadline['type']): {
  deadlines: Deadline[];
  isLoading: boolean;
} {
  const { deadlines, isLoading } = useDeadlines();

  return {
    deadlines: deadlines.filter(d => d.type === type),
    isLoading
  };
}

/**
 * Hook to prefetch deadlines
 * Useful for optimistic loading before navigation
 *
 * @example
 * ```typescript
 * const prefetchDeadlines = usePrefetchDeadlines();
 *
 * // Prefetch on hover
 * <Link onMouseEnter={() => prefetchDeadlines()}>
 *   View Deadlines
 * </Link>
 * ```
 */
export function usePrefetchDeadlines() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: DEADLINES_QUERY_KEY,
      queryFn: fetchDeadlines,
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate deadlines cache
 * Use when deadlines have been modified externally
 */
export function useInvalidateDeadlines() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: DEADLINES_QUERY_KEY });
  };
}

/**
 * Utility function to check if deadline is overdue
 */
export function isDeadlineOverdue(deadline: Deadline): boolean {
  const deadlineDate = new Date(deadline.date || deadline.due_date || '');
  return deadlineDate < new Date();
}

/**
 * Utility function to get days until deadline
 */
export function getDaysUntilDeadline(deadline: Deadline): number {
  const deadlineDate = new Date(deadline.date || deadline.due_date || '');
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Utility function to format deadline date
 */
export function formatDeadlineDate(deadline: Deadline): string {
  const date = new Date(deadline.date || deadline.due_date || '');

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
