/**
 * useUserProfile Hook
 * React Query hook for managing user profile data
 * Follows the useNotifications pattern for consistency
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleError } from '@/lib/errorHandlingUtils';
import { api } from '@/lib/api/client';

// Query key for user profile - following useNotifications pattern
const USER_PROFILE_QUERY_KEY = ['user-profile'];

/**
 * User Profile Response Type
 * Matches the API response from /api/user-profile
 */
export interface UserProfileResponse {
  id: number;
  auth_id: string;
  email: string;
  fullName: string | null;
  gtUsername: string | null;
  graduationYear: number | null;
  major: string | null;
  minors: string[];
  selectedThreads: string[];
  degreeProgramId: number | null;
  completedCourses: string[];
  completedGroups: string[];
  hasDetailedGPA: boolean;
  semesterGPAs: Array<{
    semester: string;
    gpa: number;
    credits: number;
  }>;
  overallGPA: number;
  planSettings: {
    starting_semester?: string;
    start_date?: string;
    expected_graduation?: string;
    graduation_year?: number;
    total_credits?: number;
    target_gpa?: number;
  };
  admin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Profile Update Data
 */
export interface UserProfileUpdateData {
  full_name?: string;
  gt_username?: string;
  graduation_year?: number;
  major?: string;
  minors?: string[];
  threads?: string[];
  plan_settings?: {
    starting_semester?: string;
    start_date?: string;
    expected_graduation?: string;
    graduation_year?: number;
    total_credits?: number;
    target_gpa?: number;
  };
}

/**
 * Return type for useUserProfile hook
 */
export interface UseUserProfileReturn {
  profile: UserProfileResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updateProfile: (data: UserProfileUpdateData) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Fetch user profile from API
 */
async function fetchUserProfile(): Promise<UserProfileResponse> {
  const p = await api.users.getProfile();
  // Normalize undefined to null for strict typing in this hook
  return {
    id: p.id,
    auth_id: p.auth_id,
    email: p.email,
    fullName: p.fullName ?? null,
    gtUsername: p.gtUsername ?? null,
    graduationYear: p.graduationYear ?? null,
    major: p.major ?? null,
    minors: p.minors ?? [],
    selectedThreads: p.selectedThreads ?? [],
    degreeProgramId: p.degreeProgramId ?? null,
    completedCourses: p.completedCourses ?? [],
    completedGroups: p.completedGroups ?? [],
    hasDetailedGPA: p.hasDetailedGPA ?? false,
    semesterGPAs: p.semesterGPAs ?? [],
    overallGPA: p.overallGPA ?? 0,
    planSettings: (p.planSettings as any) ?? {},
    admin: p.admin ?? false,
    createdAt: p.createdAt ?? '',
    updatedAt: p.updatedAt ?? ''
  };
}

/**
 * Update user profile via API
 */
async function updateUserProfileApi(data: UserProfileUpdateData): Promise<UserProfileResponse> {
  const updated = await api.users.updateProfile(data as any);
  return {
    id: updated.id,
    auth_id: updated.auth_id,
    email: updated.email,
    fullName: updated.fullName ?? null,
    gtUsername: updated.gtUsername ?? null,
    graduationYear: updated.graduationYear ?? null,
    major: updated.major ?? null,
    minors: updated.minors ?? [],
    selectedThreads: updated.selectedThreads ?? [],
    degreeProgramId: updated.degreeProgramId ?? null,
    completedCourses: updated.completedCourses ?? [],
    completedGroups: updated.completedGroups ?? [],
    hasDetailedGPA: updated.hasDetailedGPA ?? false,
    semesterGPAs: updated.semesterGPAs ?? [],
    overallGPA: updated.overallGPA ?? 0,
    planSettings: (updated.planSettings as any) ?? {},
    admin: updated.admin ?? false,
    createdAt: updated.createdAt ?? '',
    updatedAt: updated.updatedAt ?? ''
  };
}

/**
 * Main hook for user profile
 *
 * @example
 * ```typescript
 * const { profile, isLoading, updateProfile } = useUserProfile();
 *
 * // Update profile
 * await updateProfile({
 *   full_name: 'John Doe',
 *   major: 'Computer Science'
 * });
 * ```
 */
export function useUserProfile(): UseUserProfileReturn {
  const queryClient = useQueryClient();

  // Fetch user profile - following useNotifications pattern
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<UserProfileResponse, Error>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile doesn't change often
    refetchOnWindowFocus: false, // Don't refetch on focus - profile is stable
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication') ||
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        return false;
      }
      // Don't retry if profile not found (user needs to complete setup)
      if (error.message.includes('not found') ||
          error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useUserProfile',
          showToast: false, // Don't spam user with profile load errors
          logToConsole: true
        });
      }
    }
  });

  // Update profile mutation with optimistic updates
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfileApi,
    onMutate: async (newData: UserProfileUpdateData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: USER_PROFILE_QUERY_KEY });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<UserProfileResponse>(USER_PROFILE_QUERY_KEY);

      // Optimistically update - following useNotifications pattern
      if (previousProfile) {
        queryClient.setQueryData<UserProfileResponse>(USER_PROFILE_QUERY_KEY, {
          ...previousProfile,
          fullName: newData.full_name ?? previousProfile.fullName,
          gtUsername: newData.gt_username ?? previousProfile.gtUsername,
          graduationYear: newData.graduation_year ?? previousProfile.graduationYear,
          major: newData.major ?? previousProfile.major,
          minors: newData.minors ?? previousProfile.minors,
          selectedThreads: newData.threads ?? previousProfile.selectedThreads,
          planSettings: newData.plan_settings ? {
            ...previousProfile.planSettings,
            ...newData.plan_settings
          } : previousProfile.planSettings,
          updatedAt: new Date().toISOString()
        });
      }

      return { previousProfile };
    },
    onError: (error, newData, context) => {
      // Rollback on error - following useNotifications pattern
      if (context?.previousProfile) {
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, context.previousProfile);
      }
      handleError(error, {
        context: 'updateUserProfile',
        showToast: true,
        userMessage: 'Failed to update profile. Please try again.'
      });
    },
    onSuccess: (updatedProfile) => {
      // Update cache with server response
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, updatedProfile);

      console.log('[useUserProfile] Profile updated successfully');
    },
    onSettled: () => {
      // Refetch to ensure consistency - following useNotifications pattern
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });

      // Also invalidate related queries that might depend on profile
      queryClient.invalidateQueries({ queryKey: ['user-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  return {
    profile: data || null,
    isLoading,
    isError,
    error: error || null,
    updateProfile: async (data: UserProfileUpdateData) => {
      await updateProfileMutation.mutateAsync(data);
    },
    refetch: async () => {
      await refetch();
    }
  };
}

/**
 * Hook to get just the loading state for profile
 * Useful for showing loaders without subscribing to data changes
 */
export function useUserProfileLoading(): boolean {
  const { isLoading } = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    enabled: false, // Don't fetch, just subscribe to loading state
  });

  return isLoading;
}

/**
 * Hook to prefetch user profile
 * Useful for optimistic loading before navigation
 *
 * @example
 * ```typescript
 * const prefetchProfile = usePrefetchUserProfile();
 *
 * // Prefetch on hover
 * <Link onMouseEnter={() => prefetchProfile()}>
 *   Profile
 * </Link>
 * ```
 */
export function usePrefetchUserProfile() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: USER_PROFILE_QUERY_KEY,
      queryFn: fetchUserProfile,
      staleTime: 5 * 60 * 1000,
    });
  };
}
