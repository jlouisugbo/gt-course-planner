// lib/auth.ts - Client-side authService with enhanced error handling and consistency
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  gtUserId?: string;
}

// Authentication service with comprehensive error handling and state consistency
export const authService = {
    async signInWithGoogle() {
        try {
            console.log('authService: Initiating Google sign-in');
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
                console.error('authService: Google sign-in error:', error);
                throw new Error(`Google sign-in failed: ${error.message}`);
            }

            console.log('authService: Google sign-in initiated successfully');
            return data;
        } catch (error) {
            console.error('authService: signInWithGoogle exception:', error);
            throw error;
        }
    },

    async signOut() {
        try {
            console.log('authService: Initiating sign-out');
            const { error } = await supabase.auth.signOut({
                scope: 'global'  // Clear all sessions across all tabs for better security
            });
            
            if (error) {
                console.error('authService: Sign-out error:', error);
                throw new Error(`Sign-out failed: ${error.message}`);
            }
            
            console.log('authService: Sign-out completed successfully');
        } catch (error) {
            console.error('authService: signOut exception:', error);
            throw error;
        }
    },

    async getSession() {
        try {
            console.log('authService: Getting current session');
            const response = await supabase.auth.getSession();
            
            if (response.error) {
                console.error('authService: Session retrieval error:', response.error);
                throw new Error(`Session retrieval failed: ${response.error.message}`);
            }

            console.log('authService: Session retrieved:', response.data.session?.user?.id ? 'authenticated' : 'not authenticated');
            return response;
        } catch (error) {
            console.error('authService: getSession exception:', error);
            throw error;
        }
    },

    async getUser() {
        try {
            console.log('authService: Getting current user');
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) {
                console.error('authService: User retrieval error:', error);
                throw new Error(`User retrieval failed: ${error.message}`);
            }
            
            console.log('authService: User retrieved:', user?.id ? 'found' : 'not found');
            return user;
        } catch (error) {
            console.error('authService: getUser exception:', error);
            throw error;
        }
    },

    onAuthStateChange(
        callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) {
        console.log('authService: Setting up auth state change listener');
        return supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            console.log('authService: Auth state change detected:', event, session?.user?.id);
            
            // Add basic validation to prevent invalid state changes
            if (event === 'SIGNED_IN' && !session) {
                console.error('authService: Invalid state - SIGNED_IN event without session');
                return;
            }
            
            if (event === 'SIGNED_OUT' && session) {
                console.error('authService: Invalid state - SIGNED_OUT event with session');
                return;
            }
            
            callback(event, session);
        });
    },
};

// Server-side functions are in auth-server.ts to prevent client-side execution