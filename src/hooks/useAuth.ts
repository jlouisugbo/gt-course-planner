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

        if (error) {
            console.error('Error in signInWithGoogle:', error);
            throw error;
        }
        return data;
    },

    async signOut() {
        console.log('authService.signOut called');
        const { error } = await supabase.auth.signOut({
            scope: 'local'
        });
        
        if (error) {
            console.error('Error in authService.signOut:', error);
            throw error;
        }
        
        console.log('authService.signOut completed successfully');
    },

    async getSession() {
        try {
            const response = await supabase.auth.getSession();
            console.log('authService.getSession response:', response.data.session?.user?.id);
            return response;
        } catch (error) {
            console.error('Error in getSession:', error);
            throw error;
        }
    },

    async getUser() {
        try {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();
            
            if (error) {
                console.error('Error in getUser:', error);
                throw error;
            }
            
            return user;
        } catch (error) {
            console.error('Error in getUser:', error);
            throw error;
        }
    },

    onAuthStateChange(
        callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) {
        return supabase.auth.onAuthStateChange((event, session) => {
            console.log('authService - Auth state change:', event, session?.user?.id);
            callback(event, session);
        });
    },
};