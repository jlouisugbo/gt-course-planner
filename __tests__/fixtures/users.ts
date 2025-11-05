/**
 * Test Fixtures - Users
 * Mock data for testing
 */

import type { UserProfile } from '@/types';
import type { DBUserProfileResponse } from '@/types/api-responses';

export const mockUser: UserProfile = {
  id: 1,
  authId: 'test-auth-id-123',
  email: 'test@gatech.edu',
  fullName: 'Test Student',
  gtUsername: 'tstudent3',
  major: 'Computer Science',
  selectedThreads: ['Intelligence', 'Systems & Architecture'],
  minors: ['Mathematics'],
  graduationYear: 2026,
  currentGPA: 3.75,
  totalCreditsEarned: 60,
  isTransferStudent: false,
  admin: false,
};

export const mockDBUser: DBUserProfileResponse = {
  id: 1,
  auth_id: 'test-auth-id-123',
  email: 'test@gatech.edu',
  full_name: 'Test Student',
  gt_username: 'tstudent3',
  major: 'Computer Science',
  selected_threads: ['Intelligence', 'Systems & Architecture'],
  minors: ['Mathematics'],
  graduation_year: 2026,
  current_gpa: 3.75,
  total_credits_earned: 60,
  is_transfer_student: false,
  admin: false,
};

export const mockAnonymousUser = {
  id: 'anonymous-session-123',
  email: null,
  fullName: null,
};
