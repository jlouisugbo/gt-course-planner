/**
 * Profile Status Management
 * Centralized service to check and manage profile completion status
 */

import { supabase } from '@/lib/supabaseClient';

export interface ProfileStatus {
  isComplete: boolean;
  hasRequiredFields: boolean;
  completedAt: string | null;
  missingFields: string[];
}

/**
 * Check if user profile is complete and should skip setup
 */
export async function checkProfileStatus(): Promise<ProfileStatus> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        isComplete: false,
        hasRequiredFields: false,
        completedAt: null,
        missingFields: ['authentication']
      };
    }

    // Get user's profile data
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select(`
        full_name,
        major,
        graduation_year,
        plan_settings,
        updated_at
      `)
      .eq('auth_id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking profile status:', userError);
      return {
        isComplete: false,
        hasRequiredFields: false,
        completedAt: null,
        missingFields: ['database_error']
      };
    }

    // If no user record exists, profile is definitely incomplete
    if (!userRecord) {
      return {
        isComplete: false,
        hasRequiredFields: false,
        completedAt: null,
        missingFields: ['user_record']
      };
    }

    // Check required fields
    const missingFields: string[] = [];
    
    if (!userRecord.full_name?.trim()) {
      missingFields.push('full_name');
    }
    
    if (!userRecord.major?.trim()) {
      missingFields.push('major');
    }
    
    if (!userRecord.graduation_year) {
      missingFields.push('graduation_year');
    }

    const hasRequiredFields = missingFields.length === 0;

    // Profile is complete if all required fields are present
    // We'll use updated_at as the completion timestamp if profile is complete
    const isComplete = hasRequiredFields;
    const completedAt = isComplete ? userRecord.updated_at : null;

    return {
      isComplete,
      hasRequiredFields,
      completedAt,
      missingFields
    };

  } catch (error) {
    console.error('Error in checkProfileStatus:', error);
    return {
      isComplete: false,
      hasRequiredFields: false,
      completedAt: null,
      missingFields: ['unknown_error']
    };
  }
}

/**
 * Load complete user profile data
 */
export async function loadUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userRecord, error } = await supabase
      .from('users')
      .select(`
        full_name,
        email,
        major,
        selected_threads,
        minors,
        graduation_year,
        degree_program_id,
        plan_settings,
        updated_at
      `)
      .eq('auth_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading user profile:', error);
      return null;
    }

    return userRecord;
  } catch (error) {
    console.error('Error in loadUserProfile:', error);
    return null;
  }
}