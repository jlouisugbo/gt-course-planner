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
        console.log('authService.signOut called');
        const { error } = await supabase.auth.signOut({
            scope: 'global'  // Clear all sessions across all tabs
        });
        
        if (error) {
            console.error('Error in authService.signOut:', error);
            throw error;
        }
        
        console.log('authService.signOut completed successfully');
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