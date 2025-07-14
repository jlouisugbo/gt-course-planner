// lib/auth.ts - authService (CORRECTED)
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const authService = {
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) throw error;
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // FIX: Return the full response object, not just the session
    async getSession() {
        return await supabase.auth.getSession();
    },

    async getUser() {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    onAuthStateChange(
        callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) {
        return supabase.auth.onAuthStateChange(callback);
    },
};