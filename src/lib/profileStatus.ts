/**
 * Profile Status Management
 * Centralized service to check and manage profile completion status
 */

import { api } from '@/lib/api/client';

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
    const userRecord = await api.users.getProfile();
    if (!userRecord) {
      return {
        isComplete: false,
        hasRequiredFields: false,
        completedAt: null,
        missingFields: ['user_record']
      };
    }

    const missingFields: string[] = [];

  const fullName = userRecord.fullName;
    const major = userRecord.major;
  const graduationYear = userRecord.graduationYear;

    if (!fullName?.trim()) missingFields.push('full_name');
    if (!major?.trim()) missingFields.push('major');
    if (!graduationYear) missingFields.push('graduation_year');

  const hasRequiredFields = missingFields.length === 0;
  const isComplete = hasRequiredFields;
  const completedAt = isComplete ? (userRecord.updatedAt || null) : null;

    return { isComplete, hasRequiredFields, completedAt, missingFields };
  } catch (error: any) {
    // Silently handle authentication errors (user not logged in)
    if (error?.status === 401) {
      return {
        isComplete: false,
        hasRequiredFields: false,
        completedAt: null,
        missingFields: ['not_authenticated']
      };
    }

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
    const userRecord = await api.users.getProfile();
    return userRecord || null;
  } catch (error: any) {
    // Silently handle authentication errors (user not logged in)
    if (error?.status === 401) {
      return null;
    }

    console.error('Error in loadUserProfile:', error);
    return null;
  }
}