"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRecord: any | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRecord: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRecord, setUserRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // 🔧 Track initialization
  const signOutRef = useRef(false);

  // 🔧 Memoize fetchUserRecord to prevent recreating on every render
  const fetchUserRecord = useCallback(async (authId: string) => {
    try {
      console.log('Fetching user record for:', authId);
      const { data: userRecord, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user record:", error);
        return null;
      }

      console.log('User record fetched:', userRecord);
      return userRecord;
    } catch (error) {
      console.error("Error in fetchUserRecord:", error);
      return null;
    }
  }, []);

  // 🔧 Memoize ensureUserExists to prevent recreating on every render
  const ensureUserExists = useCallback(async (user: User) => {
    try {
      console.log('AuthProvider - Checking if user exists:', user.id);
      
      // First check if user exists
      let userRecord = await fetchUserRecord(user.id);

      // If user doesn't exist, create them
      if (!userRecord) {
        console.log('AuthProvider - Creating new user record');
        
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
          console.error("AuthProvider - Error creating user:", insertError);
          return null;
        } else {
          console.log("AuthProvider - User created successfully:", newUser);
          userRecord = newUser;
        }
      } else {
        console.log("AuthProvider - User already exists");
      }

      // Update local state with the user record
      setUserRecord(userRecord);
      return userRecord;
    } catch (error) {
      console.error("AuthProvider - Error in ensureUserExists:", error);
      return null;
    }
  }, [fetchUserRecord]);

  // 🔧 Memoize refreshUserRecord
  const refreshUserRecord = useCallback(async () => {
    if (user?.id) {
      const record = await fetchUserRecord(user.id);
      setUserRecord(record);
    }
  }, [user?.id, fetchUserRecord]);

  // 🔧 MAIN FIX: Add proper dependency array and prevent multiple initializations
  useEffect(() => {
    if (isInitialized) return; // 🔧 Prevent multiple initializations

    const initializeAuth = async () => {
      try {
        setIsInitialized(true); // 🔧 Mark as initialized immediately
        
        // Get initial session
        const { data: { session }, error } = await authService.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }

        console.log('AuthProvider - Initial session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // If we have a session, ensure user exists and fetch their record
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

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider - Auth state change:', event, session?.user?.id);
      
      // Don't process events if we're signing out
      if (signOutRef.current && event === 'SIGNED_OUT') {
        console.log('Ignoring SIGNED_OUT event during signOut process');
        return;
      }

      setUser(session?.user ?? null);
      setSession(session);

      if (event === "SIGNED_IN" && session?.user) {
        await ensureUserExists(session.user);
      } else if (event === "SIGNED_OUT") {
        setUserRecord(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, ensureUserExists]); // 🔧 ADD DEPENDENCY ARRAY!

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (signOutRef.current) {
      console.log('Sign out already in progress, ignoring');
      return;
    }

    signOutRef.current = true;
    console.log('SignOut function called');
    
    try {
      console.log('Clearing local state...');
      setUser(null);
      setSession(null);
      setUserRecord(null);
      
      console.log('Calling supabase signOut...');
      await authService.signOut();
      console.log('Supabase signOut successful');
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Redirecting to landing page...');
      window.location.replace('/landing');
      
    } catch (error) {
      console.error("Error signing out:", error);
      // Force redirect even on error
      window.location.replace('/landing');
    } finally {
      // Reset the ref after a delay to handle any race conditions
      setTimeout(() => {
        signOutRef.current = false;
      }, 1000);
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        session, 
        userRecord,
        loading, 
        signInWithGoogle, 
        signOut,
        refreshUserRecord
      }}
    >
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