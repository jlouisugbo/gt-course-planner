/**
 * Utility functions for user name handling and display
 */

import { UserProfile } from '@/types/user';

/**
 * Extract first name from user profile, trying multiple sources
 */
export function getFirstName(userProfile?: UserProfile | null, userEmail?: string | null): string {
  // First try explicit first_name field
  if (userProfile?.first_name) {
    return userProfile.first_name;
  }
  
  // Try extracting from full_name
  if (userProfile?.full_name) {
    const nameParts = userProfile.full_name.trim().split(/\s+/);
    if (nameParts.length > 0) {
      return nameParts[0];
    }
  }
  
  // Fallback to email username
  if (userEmail) {
    const emailUser = userEmail.split('@')[0];
    // Capitalize first letter if it's all lowercase
    return emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
  }
  
  return 'Student';
}

/**
 * Get full display name for user
 */
export function getFullDisplayName(userProfile?: UserProfile | null, userEmail?: string | null): string {
  // Try explicit first + last name
  if (userProfile?.first_name && userProfile?.last_name) {
    return `${userProfile.first_name} ${userProfile.last_name}`;
  }
  
  // Try full_name field
  if (userProfile?.full_name) {
    return userProfile.full_name;
  }
  
  // Fallback to email-based name
  if (userEmail) {
    const emailUser = userEmail.split('@')[0];
    return emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
  }
  
  return 'Student';
}

/**
 * Extract last name from user profile
 */
export function getLastName(userProfile?: UserProfile | null): string | null {
  // First try explicit last_name field
  if (userProfile?.last_name) {
    return userProfile.last_name;
  }
  
  // Try extracting from full_name
  if (userProfile?.full_name) {
    const nameParts = userProfile.full_name.trim().split(/\s+/);
    if (nameParts.length > 1) {
      return nameParts.slice(1).join(' '); // Handle middle names too
    }
  }
  return null;
}

/**
 * Split full name into first and last name components
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 0) {
    return { firstName: 'Student', lastName: null };
  }
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: null };
  }
  
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ')
  };
}