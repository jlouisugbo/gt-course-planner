/**
 * SIMPLIFIED PROFILE SAVE SYSTEM - Phase 1 Fix
 * 
 * This module provides direct profile saving without complex fallbacks.
 * Updated to use direct database operations for reliability.
 */

import { saveProfileDirect } from '@/lib/profile-save-direct';

export interface ProfileData {
  full_name: string;
  major: string;
  selected_threads?: string[];
  minors?: string[];
  graduation_year?: number;
  degree_program_id?: number;
  start_date?: string;
  expected_graduation?: string;
  is_transfer_student?: boolean;
  transfer_credits?: number;
  plan_settings?: any;
  gt_username?: string;
}

export interface ProfileSaveResult {
  success: boolean;
  data?: any;
  error?: string;
  errorType?: string;
  attempts: number;
  fallbackUsed?: string;
  warnings?: string[];
}

/**
 * Direct profile save using database client
 */
export async function saveProfileRobust(profileData: ProfileData): Promise<ProfileSaveResult> {
  console.log('saveProfileRobust called with:', profileData);
  
  try {
    // Use direct database save instead of complex API fallbacks
    const result = await saveProfileDirect({
      full_name: profileData.full_name,
      email: profileData.gt_username ? `${profileData.gt_username}@gatech.edu` : undefined,
      gt_username: profileData.gt_username,
      major: profileData.major,
      selected_threads: profileData.selected_threads,
      minors: profileData.minors,
      graduation_year: profileData.graduation_year,
      degree_program_id: profileData.degree_program_id,
      plan_settings: profileData.plan_settings,
      start_date: profileData.start_date,
      expected_graduation: profileData.expected_graduation,
      is_transfer_student: profileData.is_transfer_student,
      transfer_credits: profileData.transfer_credits
    });

    if (result.success) {
      console.log('Profile saved successfully via direct database');
      return {
        success: true,
        data: result.data,
        attempts: 1,
        fallbackUsed: 'direct_database'
      };
    } else {
      console.error('Direct database save failed:', result.error);
      return {
        success: false,
        error: result.error || 'Unknown error',
        errorType: 'DATABASE_ERROR',
        attempts: 1
      };
    }
  } catch (error) {
    console.error('Unexpected error in saveProfileRobust:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'UNEXPECTED_ERROR',
      attempts: 1
    };
  }
}