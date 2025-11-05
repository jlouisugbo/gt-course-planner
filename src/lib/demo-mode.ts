/**
 * Demo Mode Utilities
 * Provides demo mode detection, configuration, and sample user data
 */

import { User } from "@supabase/supabase-js";
import { UserData } from "@/types/user";

const DEMO_MODE_KEY = 'gt-planner-demo-mode';
const DEMO_SESSION_KEY = 'gt-planner-demo-session';

/**
 * Demo user data - realistic GT CS student profile
 */
export const DEMO_USER: UserData = {
  id: -1, // Negative ID to indicate demo user
  auth_id: 'demo-user-auth-id',
  email: 'alex.johnson@gatech.edu',
  full_name: 'Alex Johnson',
  gt_id: 'ajohnson3',
  gt_username: 'ajohnson3',
  major: 'Computer Science',
  selected_threads: ['Intelligence', 'Devices'],
  minors: ['Mathematics'],
  graduation_year: 2026,
  current_gpa: 3.75,
  total_credits_earned: 45,
  is_transfer_student: false,
  transfer_credits: 0,
  plan_settings: {
    plan_name: "Alex's GT Course Plan",
    starting_semester: 'Fall 2022',
    starting_year: 2022,
    graduation_year: 2026,
    expected_graduation: '2026-05-15',
    total_credits: 126,
    target_gpa: 3.5,
    is_transfer_student: false,
    transfer_credits: 0,
    current_gpa: 3.75,
    total_credits_earned: 45
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Demo Supabase User object for authentication bypass
 */
export const DEMO_AUTH_USER: User = {
  id: 'demo-user-auth-id',
  app_metadata: {},
  user_metadata: {
    full_name: 'Alex Johnson',
    email: 'alex.johnson@gatech.edu',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'alex.johnson@gatech.edu',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
};

/**
 * Check if demo mode is currently active
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check URL param first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      enableDemoMode();
      return true;
    }

    // Check localStorage
    const demoMode = localStorage.getItem(DEMO_MODE_KEY);
    return demoMode === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable demo mode
 */
export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(DEMO_MODE_KEY, 'true');

    // Set cookie so middleware can detect demo mode
    document.cookie = `${DEMO_MODE_KEY}=true; path=/; max-age=86400; SameSite=Lax`;

    // Generate a unique demo session ID
    const sessionId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(DEMO_SESSION_KEY, sessionId);

    console.log('[Demo Mode] Enabled (localStorage + cookie)');
  } catch (error) {
    console.error('[Demo Mode] Failed to enable:', error);
  }
}

/**
 * Disable demo mode and clear demo data
 */
export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(DEMO_MODE_KEY);
    sessionStorage.removeItem(DEMO_SESSION_KEY);

    // Remove cookie
    document.cookie = `${DEMO_MODE_KEY}=; path=/; max-age=0`;

    // Clear demo-related localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('demo')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('[Demo Mode] Disabled');
  } catch (error) {
    console.error('[Demo Mode] Failed to disable:', error);
  }
}

/**
 * Get demo session ID
 */
export function getDemoSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Reset demo mode (clear and re-enable with fresh data)
 */
export function resetDemoMode(): void {
  disableDemoMode();
  enableDemoMode();
}

/**
 * Get demo user data
 */
export function getDemoUser(): UserData {
  return { ...DEMO_USER };
}

/**
 * Get demo auth user
 */
export function getDemoAuthUser(): User {
  return { ...DEMO_AUTH_USER };
}

/**
 * Check if a user is the demo user
 */
export function isDemoUser(userId: string | undefined): boolean {
  return userId === DEMO_AUTH_USER.id;
}
