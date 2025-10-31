/**
 * DIRECT PROFILE SAVE - Phase 1 Fix
 * Simple, direct database operations without complex fallbacks
 */

import { supabase } from '@/lib/supabaseClient';

export interface DirectProfileData {
  full_name?: string;
  email?: string;
  gt_username?: string;
  major?: string;
  selected_threads?: string[];
  minors?: string[];
  graduation_year?: number;
  degree_program_id?: number;
  plan_settings?: any;
  // Additional fields from form
  start_date?: string;
  expected_graduation?: string;
  is_transfer_student?: boolean;
  transfer_credits?: number;
  current_gpa?: number;
  total_credits_earned?: number;
}

/**
 * Direct database save - no complex fallbacks
 */
export async function saveProfileDirect(profileData: DirectProfileData): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { success: false, error: 'Not authenticated' };
    }

    console.log('Saving profile for user:', user.id);
    console.log('Profile data:', profileData);

    // First, check if user record exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking existing user:', fetchError);
      return { success: false, error: 'Database error: ' + fetchError.message };
    }

    // Prepare data for database
    const dbData: any = {
      email: profileData.email || user.email || '',
      full_name: profileData.full_name || '',
      gt_username: profileData.gt_username || '',
      major: profileData.major || '',
      selected_threads: profileData.selected_threads || [],
      minors: profileData.minors || [],
      graduation_year: profileData.graduation_year || null,
      degree_program_id: profileData.degree_program_id || null,
      updated_at: new Date().toISOString()
    };

    // Handle plan_settings with all the additional fields including GPA and credits
    dbData.plan_settings = {
      ...(profileData.plan_settings || {}),
      start_date: profileData.start_date || '',
      expected_graduation: profileData.expected_graduation || '',
      is_transfer_student: profileData.is_transfer_student || false,
      transfer_credits: profileData.transfer_credits || 0,
      current_gpa: profileData.current_gpa || null,
      total_credits_earned: profileData.total_credits_earned || 0
    };

    // Note: current_gpa and total_credits_earned are stored in plan_settings
    // Top-level columns would require database schema changes

    let result;

    if (existingUser) {
      // Update existing user
      console.log('Updating existing user:', existingUser.id);
      
      const { data, error: updateError } = await supabase
        .from('users')
        .update(dbData)
        .eq('auth_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return { success: false, error: 'Failed to update profile: ' + updateError.message };
      }

      result = data;
      console.log('Profile updated successfully');
    } else {
      // Create new user
      console.log('Creating new user profile');
      
      const createData = {
        ...dbData,
        auth_id: user.id,
        created_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('users')
        .insert(createData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, error: 'Failed to create profile: ' + insertError.message };
      }

      result = data;
      console.log('Profile created successfully');
    }

    return { success: true, data: result };

  } catch (error) {
    console.error('Unexpected error in saveProfileDirect:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Load user profile directly from database
 */
export async function loadProfileDirect(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows
        return { success: true, data: null }; // User doesn't exist yet
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };

  } catch (error) {
    console.error('Error loading profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}