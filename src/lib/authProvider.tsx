"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getSession().then(async ({ data: { session } }) => {
      console.log('AuthProvider - Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      // If we have a session but haven't processed user creation yet
      if (session?.user) {
        await ensureUserExists(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider - Auth state change:', event, session?.user?.id);
      setUser(session?.user ?? null);
      setSession(session);

      if (event === "SIGNED_IN" && session?.user) {
        await ensureUserExists(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserExists = async (user: User) => {
    try {
      console.log('AuthProvider - Checking if user exists:', user.id);
      
      // First check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle(); // Use maybeSingle to avoid throwing on no results

      console.log('AuthProvider - Existing user check:', { existingUser, fetchError });

      // If user doesn't exist, create them
      if (!existingUser && !fetchError) {
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
        } else {
          console.log("AuthProvider - User created successfully:", newUser);
        }
      } else if (fetchError) {
        console.error("AuthProvider - Error checking user:", fetchError);
      } else {
        console.log("AuthProvider - User already exists");
      }
    } catch (error) {
      console.error("AuthProvider - Error in ensureUserExists:", error);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('SignOut function called');
    try {
      console.log('Clearing local state...');
      setUser(null);
      setSession(null);
      
      console.log('Calling supabase signOut...');
      authService.signOut();
      console.log('Supabase signOut successful');
      
      console.log('About to redirect...');
      window.location.replace('/landing');
      
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = '/landing';
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signOut }}
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