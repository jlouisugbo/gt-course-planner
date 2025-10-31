/**
 * Profile Sync Utility
 * Ensures profile data is properly synchronized across the application
 */

import { supabase } from '@/lib/supabaseClient';
import { usePlannerStore } from '@/hooks/usePlannerStore';

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
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Fetch latest profile data
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return { success: false, error: profileError.message };
    }

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Update planner store
    const plannerStore = usePlannerStore.getState();
    
    plannerStore.updateStudentInfo({
      id: profile.id,
      name: profile.full_name || '',
      email: profile.email || user.email || '',
      major: profile.major || '',
      threads: profile.selected_threads || [],
      minors: profile.minors || [],
      startYear: profile.plan_settings?.starting_year || new Date().getFullYear(),
      expectedGraduation: profile.plan_settings?.expected_graduation || '',
      currentGPA: profile.current_gpa || 0,
      majorRequirements: [],
      minorRequirements: [],
      threadRequirements: [],
    });

    // Generate semesters if we have dates - support multiple field name patterns
    const planSettings = profile.plan_settings || {};
    
    // Get start semester from multiple possible field names
    let startSemester: string | null = null;
    let gradSemester: string | null = null;
    
    // Check for start semester in various formats
    if (planSettings.starting_semester) {
      startSemester = planSettings.starting_semester;
    } else if (planSettings.start_date) {
      startSemester = convertToSeasonYear(planSettings.start_date);
    } else if (profile.startDate) {
      startSemester = profile.startDate;
    }
    
    // Check for graduation semester in various formats
    if (planSettings.expected_graduation) {
      gradSemester = convertToSeasonYear(planSettings.expected_graduation);
    } else if (profile.expectedGraduation) {
      gradSemester = profile.expectedGraduation;
    } else if (planSettings.graduation_year) {
      // Convert graduation year to Fall semester format
      gradSemester = `Fall ${planSettings.graduation_year}`;
    }

    // Convert date format to semester format if needed
    function convertToSeasonYear(dateString: string): string {
      // If already in semester format (e.g., "Fall 2023"), return as is
      if (dateString.match(/^(Fall|Spring|Summer)\s+\d{4}$/)) {
        return dateString;
      }
      
      // Convert from YYYY-MM-DD format to "Season YYYY" format
      const [year, month] = dateString.split('-');
      const monthNum = parseInt(month);
      
      let season: string;
      if (monthNum >= 8 && monthNum <= 12) {
        season = 'Fall';
      } else if (monthNum >= 1 && monthNum <= 5) {
        season = 'Spring';
      } else {
        season = 'Summer';
      }
      
      return `${season} ${year}`;
    }

    if (startSemester && gradSemester) {
      try {
        console.log(`📅 Generating semesters from ${startSemester} to ${gradSemester}`);
        console.log('Plan settings available:', planSettings);
        plannerStore.generateSemesters(startSemester, gradSemester);
      } catch (error) {
        console.error('Error generating semesters:', error);
        console.log('Original data:', {
          startSemester,
          gradSemester,
          planSettings,
          profile: {
            startDate: profile.startDate,
            expectedGraduation: profile.expectedGraduation
          }
        });
      }
    } else {
      console.log('❌ Missing semester generation data:', {
        startSemester,
        gradSemester,
        planSettings,
        profileFields: {
          startDate: profile.startDate,
          expectedGraduation: profile.expectedGraduation
        }
      });
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
export function watchProfileChanges(callback?: (profile: any) => void) {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) return null;

  const subscription = supabase
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `auth_id=eq.${user.id}`
      },
      async (payload) => {
        console.log('Profile changed:', payload);
        
        // Sync the profile
        const result = await syncUserProfile();
        
        if (result.success && callback) {
          callback(result.profile);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}