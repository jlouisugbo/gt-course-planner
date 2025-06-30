"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/lib/auth";

import { supabase } from "./supabaseClient";
import { ca } from "date-fns/locale";

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
    authService.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user) {
        await handleUserSignIn(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSignIn = async (user: User) => {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!.split("@")[0],
          avatar_url: user.user_metadata?.avatar_url || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          plan_settings: {
            plan_name: "My 4 Year Plan",
            plan_description:
              "A personalized 4 year plan for degree completion",
          },
        });

        if (insertError) {
          console.error("Error inserting new user:", insertError);
        }
      }
    } catch (error) {
      console.error("Error handling user sign-in:", error);
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
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
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
