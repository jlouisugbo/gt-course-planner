"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { isDemoMode, getDemoUser, getDemoAuthUser } from "@/lib/demo-mode";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

/**
 * Ultra-simplified AuthProvider
 * ONE JOB: Manage Supabase authentication state
 * - No profile fetching
 * - No migrations
 * - No retries
 * - Just auth state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for demo mode FIRST
        if (isDemoMode()) {
          console.log('[Demo Mode] Using demo user');
          setUser(getDemoAuthUser());
          setSession({
            access_token: 'demo-access-token',
            refresh_token: 'demo-refresh-token',
            expires_in: 999999,
            token_type: 'bearer',
            user: getDemoAuthUser()
          } as Session);
          setLoading(false);
          return;
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event);
      setUser(session?.user ?? null);
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google
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

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      window.location.replace('/');
    } catch (error) {
      console.error("Error signing out:", error);
      // Clear state even on error
      setUser(null);
      setSession(null);
      window.location.replace('/');
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signInWithGoogle,
    signOut,
  }), [user, session, loading, signInWithGoogle, signOut]);

  // Show loading spinner while initializing
  if (loading) {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
