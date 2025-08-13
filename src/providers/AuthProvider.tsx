"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { UserData } from "@/types/user";
import { sessionManager } from "@/lib/session-management";
import { authMonitor, validateAuthState, checkAuthRaceConditions } from "@/lib/auth-monitoring";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRecord: UserData | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRecord: () => Promise<void>;
  isAuthenticated: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

// Authentication state validation
interface AuthState {
  user: User | null;
  session: Session | null;
  userRecord: UserData | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const INITIAL_AUTH_STATE: AuthState = {
  user: null,
  session: null,
  userRecord: null,
  loading: true,
  initialized: false,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Consolidated state management with atomic updates
  const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE);
  
  // Synchronization controls
  const initializationRef = useRef<Promise<void> | null>(null);
  const signOutRef = useRef(false);
  const mountedRef = useRef(true);
  const stateVersionRef = useRef(0);

  // Cleanup effect for component unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Atomic state updater with validation
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if (!mountedRef.current) return;
    
    const currentVersion = ++stateVersionRef.current;
    
    setAuthState(prevState => {
      // Prevent stale updates
      if (stateVersionRef.current !== currentVersion) {
        return prevState;
      }
      
      const newState = { ...prevState, ...updates };
      
      // State validation
      if (newState.user && !newState.session) {
        return prevState;
      }
      
      if (newState.session && newState.session.user?.id !== newState.user?.id) {
        return prevState;
      }
      
      return newState;
    });
  }, []);

  // Safe async user record fetcher
  const fetchUserRecord = useCallback(async (authId: string, version: number): Promise<UserData | null> => {
    try {
      if (!mountedRef.current || stateVersionRef.current !== version) {
        return null;
      }
      
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      if (error) {
        console.error("AuthProvider: Error fetching user record:", error);
        updateAuthState({ error: `Failed to fetch user data: ${error.message}` });
        return null;
      }

      if (!mountedRef.current || stateVersionRef.current !== version) {
        return null;
      }

      return userRecord;
    } catch (error) {
      console.error("AuthProvider: Error in fetchUserRecord:", error);
      updateAuthState({ error: 'Network error while fetching user data' });
      return null;
    }
  }, [updateAuthState]);

  // Safe user creation/verification with race condition protection
  const ensureUserExists = useCallback(async (user: User, version: number): Promise<UserData | null> => {
    try {
      if (!mountedRef.current || stateVersionRef.current !== version) {
        return null;
      }
      
      
      // First check if user exists
      let userRecord = await fetchUserRecord(user.id, version);
      
      if (!mountedRef.current || stateVersionRef.current !== version) {
        return null;
      }

      // If user doesn't exist, create them
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

        if (!mountedRef.current || stateVersionRef.current !== version) {
          return null;
        }

        if (insertError) {
          console.error("AuthProvider: Error creating user:", insertError);
          updateAuthState({ error: `Failed to create user account: ${insertError.message}` });
          return null;
        } else {
          userRecord = newUser;
        }
      } else {
      }

      // Only update state if still mounted and version is current
      if (mountedRef.current && stateVersionRef.current === version) {
        updateAuthState({ userRecord, error: null });
      }
      
      return userRecord;
    } catch (error) {
      console.error("AuthProvider: Error in ensureUserExists:", error);
      updateAuthState({ error: 'Failed to initialize user account' });
      return null;
    }
  }, [fetchUserRecord, updateAuthState]);

  // Safe refresh function with race condition protection
  const refreshUserRecord = useCallback(async () => {
    if (!authState.user?.id || !mountedRef.current) return;
    
    const currentVersion = stateVersionRef.current;
    const record = await fetchUserRecord(authState.user.id, currentVersion);
    
    if (record && mountedRef.current && stateVersionRef.current === currentVersion) {
      updateAuthState({ userRecord: record, error: null });
    }
  }, [authState.user?.id, fetchUserRecord, updateAuthState]);

  // CRITICAL FIX: Prevent multiple initialization attempts with atomic synchronization
  useEffect(() => {
    // Check for race conditions
    checkAuthRaceConditions();
    
    // Prevent multiple initialization attempts
    if (initializationRef.current) {
      authMonitor.logEvent('race_condition_detected', {
        error: 'Multiple initialization attempts prevented'
      });
      return;
    }

    const initializeAuth = async (): Promise<void> => {
      try {
        if (!mountedRef.current) return;
        
        authMonitor.logEvent('initialization_start');
        
        const currentVersion = ++stateVersionRef.current;
        
        // Get initial session
        const { data: { session }, error } = await authService.getSession();
        
        if (!mountedRef.current || stateVersionRef.current !== currentVersion) {
          return;
        }
        
        if (error) {
          console.error('AuthProvider: Error getting initial session:', error);
          authMonitor.logEvent('initialization_failed', {
            error: (error as any)?.message || 'Unknown error',
            data: { version: currentVersion }
          });
          updateAuthState({ 
            loading: false, 
            initialized: true, 
            error: `Session initialization failed: ${(error as any)?.message || 'Unknown error'}` 
          });
          return;
        }

        
        authMonitor.logEvent('session_validated', {
          userId: session?.user?.id,
          sessionId: session?.access_token?.substring(0, 8) + '...',
          data: { hasSession: !!session }
        });
        
        // Update auth state atomically
        updateAuthState({
          user: session?.user ?? null,
          session,
          loading: !!session?.user, // Keep loading if we need to fetch user record
          initialized: true,
          error: null
        });
        
        // If we have a session, ensure user exists and fetch their record
        if (session?.user) {
          await ensureUserExists(session.user, currentVersion);
        }
        
        // Final loading state update and validation
        if (mountedRef.current && stateVersionRef.current === currentVersion) {
          updateAuthState({ loading: false });
          
          // Validate final auth state
          const validation = validateAuthState(
            session?.user ?? null,
            session,
            null, // userRecord will be set by ensureUserExists
            false
          );
          
          
          authMonitor.logEvent('initialization_complete', {
            userId: session?.user?.id,
            data: { 
              isValid: validation.isValid, 
              violations: validation.violations 
            }
          });
        }
        
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
        updateAuthState({ 
          loading: false, 
          initialized: true, 
          error: 'Authentication system unavailable' 
        });
      }
    };

    // Set the initialization promise and start
    initializationRef.current = initializeAuth();

    // Listen for auth changes with proper synchronization
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      
      
      // Don't process events if we're signing out
      if (signOutRef.current && event === 'SIGNED_OUT') {
        return;
      }

      const currentVersion = ++stateVersionRef.current;

      // Update auth state atomically
      updateAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null
      });

      if (event === "SIGNED_IN" && session?.user) {
        updateAuthState({ loading: true });
        await ensureUserExists(session.user, currentVersion);
        if (mountedRef.current && stateVersionRef.current === currentVersion) {
          updateAuthState({ loading: false });
        }
      } else if (event === "SIGNED_OUT") {
        updateAuthState({ 
          userRecord: null, 
          loading: false,
          error: null 
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      initializationRef.current = null;
    };
  }, [ensureUserExists, updateAuthState]); // Add required dependencies

  // Secure sign-in with proper state management
  const signInWithGoogle = useCallback(async () => {
    if (!mountedRef.current) return;
    
    authMonitor.logEvent('sign_in_start');
    updateAuthState({ loading: true, error: null });
    
    try {
      await authService.signInWithGoogle();
      authMonitor.logEvent('sign_in_complete');
      // Don't update loading here - the auth state change listener will handle it
    } catch (error) {
      console.error("AuthProvider: Error signing in with Google:", error);
      authMonitor.logEvent('sign_in_failed', {
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      });
      updateAuthState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Google sign-in failed' 
      });
    }
  }, [updateAuthState]);

  // Secure sign-out with comprehensive cleanup
  const signOut = useCallback(async () => {
    // Prevent concurrent sign-out attempts
    if (signOutRef.current) {
      authMonitor.logEvent('race_condition_detected', {
        error: 'Multiple sign-out attempts prevented'
      });
      return;
    }

    signOutRef.current = true;
    authMonitor.logEvent('sign_out_start', {
      userId: authState.user?.id
    });
    
    try {
      // Update state to show sign-out in progress
      updateAuthState({ loading: true, error: null });
      
      await authService.signOut();
      
      // Clear session manager state
      await sessionManager.clearSession();
      
      // Increment version to invalidate any pending operations
      ++stateVersionRef.current;
      
      // Clear local state atomically
      updateAuthState({
        user: null,
        session: null,
        userRecord: null,
        loading: false,
        error: null,
        initialized: true
      });
      
      // Clear any cached data from localStorage/sessionStorage
      if (typeof window !== 'undefined') {
        try {
          // Clear auth-related localStorage items
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        } catch {
        }
      }
      
      
      authMonitor.logEvent('sign_out_complete', {
        userId: authState.user?.id
      });
      
      // Use a more forceful redirect approach
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
      
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
      
      authMonitor.logEvent('sign_out_failed', {
        userId: authState.user?.id,
        error: error instanceof Error ? error.message : 'Sign out failed'
      });
      
      // Clear state even on error to prevent stuck states
      updateAuthState({
        user: null,
        session: null,
        userRecord: null,
        loading: false,
        error: 'Sign out failed, but local state has been cleared',
        initialized: true
      });
      
      // Force redirect even on error with fallback
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } finally {
      // Reset the ref after a delay to handle any race conditions
      setTimeout(() => {
        signOutRef.current = false;
      }, 1000);
    }
  }, [updateAuthState, authState.user?.id]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: authState.user,
    session: authState.session,
    userRecord: authState.userRecord,
    loading: authState.loading,
    isAuthenticated: !!authState.user && !!authState.session,
    authError: authState.error,
    signInWithGoogle,
    signOut,
    refreshUserRecord
  }), [
    authState.user,
    authState.session,
    authState.userRecord,
    authState.loading,
    authState.error,
    signInWithGoogle,
    signOut,
    refreshUserRecord
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Enhanced useAuth hook with better error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};