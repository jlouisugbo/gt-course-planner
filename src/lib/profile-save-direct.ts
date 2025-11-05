/**
 * DIRECT PROFILE SAVE - Phase 1 Fix
 * Simple, direct database operations without complex fallbacks
 */

import { api } from '@/lib/api/client';

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
    // Use the server-side user-profile API which handles authentication and upsert logic
    try {
      const res = await api.users.updateProfile(profileData);
      return { success: true, data: res };
    } catch (err: any) {
      console.error('Error saving profile via API:', err);
      return { success: false, error: err?.message || 'Failed to save profile' };
    }

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
    try {
      const res = await api.users.getProfile();
      return { success: true, data: res };
    } catch (err: any) {
      console.error('Error loading profile via API:', err);
      return { success: false, error: err?.message || 'Failed to load profile' };
    }

  } catch (error) {
    console.error('Error loading profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}