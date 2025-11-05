/**
 * Profile Sync Utility
 * Ensures profile data is properly synchronized across the application
 */

import { api } from '@/lib/api/client';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { convertToSeasonYear } from '@/lib/utils/dateUtils';

export interface ProfileSyncResult {
  success: boolean;
  profile?: any;
  error?: string;
}

/**
 * Sync user profile data across all stores and components
 */
export async function syncUserProfile(): Promise<ProfileSyncResult> {
  try {
    // Fetch latest profile data via API
    const profile = await api.users.getProfile();
    if (!profile) return { success: false, error: 'Profile not found' };

    // Normalize field names similar to previous shape
    const normalizedProfile: any = {
      id: profile.id,
      full_name: profile.fullName || '',
      email: profile.email,
      major: profile.major,
      selected_threads: profile.selectedThreads || [],
      minors: profile.minors || [],
      plan_settings: profile.planSettings || {},
      startDate: (profile.planSettings as any)?.start_date,
      expectedGraduation: (profile.planSettings as any)?.expected_graduation,
    };

    // Update planner store from normalized profile
    const plannerStore = usePlannerStore.getState();
    plannerStore.updateStudentInfo({
      id: normalizedProfile.id,
      name: normalizedProfile.full_name || '',
      email: normalizedProfile.email || '',
      major: normalizedProfile.major || '',
      threads: normalizedProfile.selected_threads || [],
      minors: normalizedProfile.minors || [],
      startYear: normalizedProfile.plan_settings?.starting_year || new Date().getFullYear(),
      expectedGraduation: normalizedProfile.plan_settings?.expected_graduation || '',
      currentGPA: normalizedProfile.plan_settings?.current_gpa || 0,
      majorRequirements: [],
      minorRequirements: [],
      threadRequirements: [],
    });

    // Generate semesters if we have dates - support multiple field name patterns
  const planSettings = normalizedProfile.plan_settings || {};

    let startSemester: string | null = null;
    let gradSemester: string | null = null;

    if (planSettings.starting_semester) {
      startSemester = planSettings.starting_semester;
    } else if (planSettings.start_date) {
      startSemester = convertToSeasonYear(planSettings.start_date);
    } else if (normalizedProfile.startDate) {
      startSemester = normalizedProfile.startDate;
    }

    if (planSettings.expected_graduation) {
      gradSemester = convertToSeasonYear(planSettings.expected_graduation);
    } else if (normalizedProfile.expectedGraduation) {
      gradSemester = normalizedProfile.expectedGraduation;
    } else if (planSettings.graduation_year) {
      gradSemester = `Fall ${planSettings.graduation_year}`;
    }

    try {
      if (planSettings.starting_semester) {
        startSemester = convertToSeasonYear(planSettings.starting_semester);
      } else if (planSettings.start_date) {
        startSemester = convertToSeasonYear(planSettings.start_date);
      } else if (normalizedProfile.startDate) {
        startSemester = convertToSeasonYear(normalizedProfile.startDate);
      }

      if (planSettings.expected_graduation) {
        gradSemester = convertToSeasonYear(planSettings.expected_graduation);
      } else if (normalizedProfile.expectedGraduation) {
        gradSemester = convertToSeasonYear(normalizedProfile.expectedGraduation);
      } else if (planSettings.graduation_year) {
        gradSemester = convertToSeasonYear(planSettings.graduation_year);
      }

      if (startSemester && gradSemester) {
        console.log(`📅 [profileSync] Generating semesters from ${startSemester} to ${gradSemester}`);
        plannerStore.generateSemesters(startSemester, gradSemester);
      } else {
        console.log('[profileSync] ⏭️  Skipping semester generation - missing dates');
      }
    } catch (dateError) {
      console.warn('[profileSync] Cannot generate semesters - profile incomplete:', dateError);
    }

    // Initialize store data
    await plannerStore.initializeStore();

    return { success: true, profile };
  } catch (error) {
    console.error('Error syncing profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Watch for profile changes and auto-sync
 */
export function watchProfileChanges(_callback?: (profile: any) => void) {
  // Realtime subscriptions were previously implemented with the Supabase client.
  // When using the API client, realtime channels are not available here.
  // Implement a server-push or websocket-based subscription if realtime updates are required.
  console.warn('watchProfileChanges is disabled when using API client; implement server push if realtime is needed.');
  return null;
}