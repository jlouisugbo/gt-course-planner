"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { api } from "@/lib/api/client";
import { UserData } from "@/types/user";
import { Loader2 } from "lucide-react";
import { isDemoMode, getDemoUser, getDemoAuthUser } from "@/lib/demo-mode";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRecord: UserData | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRecord: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

/**
 * Ultra-simplified AuthProvider for MVP stability.
 * REMOVED: auth monitoring, retries, error states, session management complexity
 * FOCUS: Rock-solid auth state with Supabase - simple and reliable
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user record from database (simple, no error states)
  // Fetch user profile via server API. Falls back to direct DB insert only when creation is needed.
  const fetchUserRecord = useCallback(async (): Promise<UserData | null> => {
    try {
  const resp = await api.users.getProfile();
      // api.users.getProfile returns null/404-handled errors as thrown exceptions.
      if (!resp) return null;

      // Normalize server response fields to the local UserData shape used by the app
      const normalized: Partial<UserData> = {
        id: resp.id,
        auth_id: resp.auth_id,
        email: resp.email,
        full_name: resp.fullName ?? undefined,
        major: resp.major ?? undefined,
        minors: resp.minors ?? [],
        selected_threads: resp.selectedThreads ?? [],
        plan_settings: (resp.planSettings as any) ?? {},
        current_gpa: resp.overallGPA ?? undefined,
        gt_id: undefined, // not in profile; can be resolved elsewhere
        graduation_year: resp.graduationYear ?? undefined,
      };

      return normalized as UserData;
    } catch (error: any) {
      // Silently handle authentication errors - user not authenticated on server
      if (error?.status === 401) {
        return null;
      }
      // API route may return 404 if profile not created yet - return null so caller can create
      console.debug('api.users.getProfile() returned no profile or error', error);
      return null;
    }
  }, []);

  // Ensure user exists in database (create if needed) - simplified
  const ensureUserExists = useCallback(async (user: User): Promise<UserData | null> => {
    try {
      // Try server API first
  let userRecord = await fetchUserRecord();

      if (!userRecord) {
        // No server-side profile yet. Create or update via server API (upsert behavior).
        const createPayload: Partial<any> = {
          // matches UserProfileUpdate in api client (snake_case keys)
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          plan_settings: {
            plan_name: 'My 4-Year Plan',
            starting_semester: 'Fall 2024',
          }
        };

        try {
          const createResp = await api.users.updateProfile(createPayload as any);
          const newUser = createResp;
          userRecord = {
            id: newUser?.id,
            auth_id: newUser?.auth_id,
            email: newUser?.email,
            full_name: (newUser as any)?.full_name || (newUser as any)?.fullName,
            plan_settings: (newUser as any)?.plan_settings || createPayload.plan_settings,
          } as UserData;
        } catch (createError: any) {
          // If we get 401 when trying to create profile, session is invalid
          if (createError?.status === 401) {
            console.warn('[AuthProvider] Invalid session detected, signing out...');
            await supabase.auth.signOut();
            return null;
          }
          throw createError;
        }
      }

      if (userRecord) setUserRecord(userRecord);

      // After ensuring user exists, run semesters migration (idempotent)
      try {
        const { migrateSemestersToDB } = await import('@/lib/utils/semestersMigration');
        const migrated = await migrateSemestersToDB();
        if (migrated) {
          console.log('[AuthProvider] Semesters migrated to DB.');
        }
      } catch (e) {
        console.warn('[AuthProvider] Semesters migration skipped/failed:', e);
      }
      return userRecord;
    } catch (error: any) {
      // If we get 401, session is invalid - sign out immediately
      if (error?.status === 401) {
        console.warn('[AuthProvider] Invalid session detected, signing out...');
        await supabase.auth.signOut();
        return null;
      }
      console.error('Error in ensureUserExists:', error);
      return null;
    }
  }, [fetchUserRecord]);

  // Refresh user record from database - simplified
  const refreshUserRecord = useCallback(async () => {
    if (!user?.id) return;

  const record = await fetchUserRecord();

    if (record) {
      setUserRecord(record);

      // Sync with planner store
      const { usePlannerStore } = await import('@/hooks/usePlannerStore');
      const plannerStore = usePlannerStore.getState();

      if (record.full_name && record.major) {
        plannerStore.updateStudentInfo({
          id: record.id,
          name: record.full_name,
          email: record.email,
          major: record.major,
          threads: record.selected_threads || [],
          minors: record.minors || [],
          startYear: Number((record.plan_settings as any)?.year) || new Date().getFullYear(),
          expectedGraduation: (record.expected_graduation as any) || ((record.plan_settings as any)?.expected_graduation) || '',
          currentGPA: record.current_gpa || 0,
          majorRequirements: [],
          minorRequirements: [],
          threadRequirements: [],
          gtId: record.gt_id
        });
      }
    }
  }, [user?.id, fetchUserRecord]);

  // Initialize auth state on mount - ultra-simplified
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for demo mode FIRST
        if (isDemoMode()) {
          console.log('[Demo Mode] Bypassing authentication - using demo user');
          const demoUser = getDemoUser();
          const demoAuthUser = getDemoAuthUser();

          // Set demo auth state
          setUser(demoAuthUser);
          setSession({
            access_token: 'demo-access-token',
            refresh_token: 'demo-refresh-token',
            expires_in: 999999,
            token_type: 'bearer',
            user: demoAuthUser
          } as Session);
          setUserRecord(demoUser);
          setLoading(false);

          // Initialize planner store with demo data
          const { usePlannerStore } = await import('@/hooks/usePlannerStore');
          const plannerStore = usePlannerStore.getState();

          plannerStore.updateStudentInfo({
            id: demoUser.id,
            name: demoUser.full_name,
            email: demoUser.email,
            major: demoUser.major,
            threads: demoUser.selected_threads || [],
            minors: demoUser.minors || [],
            startYear: Number((demoUser.plan_settings as any)?.year) || 2022,
            expectedGraduation: (demoUser.expected_graduation as any) || ((demoUser.plan_settings as any)?.expected_graduation) || '',
            currentGPA: demoUser.current_gpa || 3.75,
            majorRequirements: [],
            minorRequirements: [],
            threadRequirements: [],
            gtId: demoUser.gt_id
          });

          return; // Exit early - skip real auth
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
        setSession(session);

        // If we have a session, ensure user exists
        if (session?.user) {
          await ensureUserExists(session.user);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes - simple subscription
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      setUser(session?.user ?? null);
      setSession(session);

          if (event === "SIGNED_IN" && session?.user) {
        setLoading(true);
        await ensureUserExists(session.user);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUserRecord(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ensureUserExists]);

  // Sign in with Google - simplified
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error("Error signing in with Google:", error);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }, []);

  // Sign out - simplified with cleanup
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();

      // Clear local state
      setUser(null);
      setSession(null);
      setUserRecord(null);

      // Clear planner store
      const { usePlannerStore } = await import('@/hooks/usePlannerStore');
      usePlannerStore.getState().clearUserData();

      // Redirect to home
      window.location.replace('/');
    } catch (error) {
      console.error("Error signing out:", error);
      // Clear state even on error
      setUser(null);
      setSession(null);
      setUserRecord(null);
      window.location.replace('/');
    }
  }, []);

  // Memoized context value to prevent re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    userRecord,
    loading,
    isAuthenticated: !!user && !!session,
    signInWithGoogle,
    signOut,
    refreshUserRecord
  }), [
    user,
    session,
    userRecord,
    loading,
    signInWithGoogle,
    signOut,
    refreshUserRecord
  ]);

  // Show loading spinner while initializing
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gt-gold" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
