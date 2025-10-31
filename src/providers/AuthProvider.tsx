"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
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
  const fetchUserRecord = useCallback(async (authId: string): Promise<UserData | null> => {
    try {
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user record:", error);
        return null;
      }

      return userRecord;
    } catch (error) {
      console.error("Error in fetchUserRecord:", error);
      return null;
    }
  }, []);

  // Ensure user exists in database (create if needed) - simplified
  const ensureUserExists = useCallback(async (user: User): Promise<UserData | null> => {
    try {
      let userRecord = await fetchUserRecord(user.id);

      if (!userRecord) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            auth_id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.email!.split("@")[0],
            plan_settings: {
              plan_name: "My 4-Year Plan",
              starting_semester: "Fall 2024",
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user:", insertError);
          return null;
        }
        userRecord = newUser;
      }

      setUserRecord(userRecord);
      return userRecord;
    } catch (error) {
      console.error("Error in ensureUserExists:", error);
      return null;
    }
  }, [fetchUserRecord]);

  // Refresh user record from database - simplified
  const refreshUserRecord = useCallback(async () => {
    if (!user?.id) return;

    const record = await fetchUserRecord(user.id);

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
          startYear: record.plan_settings?.starting_year || new Date().getFullYear(),
          expectedGraduation: record.plan_settings?.expected_graduation || '',
          currentGPA: record.current_gpa || 0,
          majorRequirements: [],
          minorRequirements: [],
          threadRequirements: [],
          full_name: record.full_name,
          auth_id: record.auth_id,
          gtId: record.gt_id,
          graduation_year: record.graduation_year,
          plan_settings: record.plan_settings
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
            startYear: demoUser.plan_settings?.starting_year || 2022,
            expectedGraduation: demoUser.plan_settings?.expected_graduation || '',
            currentGPA: demoUser.current_gpa || 3.75,
            majorRequirements: [],
            minorRequirements: [],
            threadRequirements: [],
            full_name: demoUser.full_name,
            auth_id: demoUser.auth_id,
            gtId: demoUser.gt_id,
            graduation_year: demoUser.graduation_year,
            plan_settings: demoUser.plan_settings
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
