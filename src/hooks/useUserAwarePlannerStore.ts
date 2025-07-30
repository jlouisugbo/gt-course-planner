import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useCallback } from "react";
import { usePlannerStore } from "./usePlannerStore";
import { supabase } from "@/lib/supabaseClient";

/**
 * SECURE User-aware wrapper for the planner store that handles user isolation
 * SECURITY FIX: This replaces vulnerable localStorage-based user identification
 * with proper server-side authentication and data isolation
 */
export const useUserAwarePlannerStore = () => {
    const { user } = useAuth();
    const store = usePlannerStore();

    /**
     * SECURITY FIX: Secure API call wrapper with proper authentication
     * Replaces direct API calls that don't verify user identity
     */
    const makeAuthenticatedRequest = useCallback(async (
        endpoint: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
            throw new Error('No valid authentication token available');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            ...options.headers
        };

        return fetch(endpoint, {
            ...options,
            headers
        });
    }, []);

    /**
     * SECURITY FIX: Verify user can only access their own data
     */
    const verifyUserAccess = useCallback(async (requestedUserId?: string): Promise<boolean> => {
        if (!user?.id) {
            return false;
        }

        // If no specific user ID requested, allow access to own data
        if (!requestedUserId) {
            return true;
        }

        // Verify user can only access their own data
        return user.id === requestedUserId;
    }, [user?.id]);

    /**
     * SECURITY FIX: Enhanced user change detection with complete data clearing
     */
    useEffect(() => {
        if (user?.id) {
            // Check if the current store data belongs to this user
            const currentUserId = store.getCurrentStorageUserId();
            const newUserId = user.id;

            // If user has changed, completely clear the store to prevent data leakage
            if (currentUserId && currentUserId !== newUserId) {
                console.log('SECURITY: User changed, clearing all store data for data isolation');
                console.log(`Previous user: ${currentUserId}, New user: ${newUserId}`);
                
                // Use the enhanced clearUserData method
                store.clearUserData();
                
                // Also clear localStorage for the previous user
                clearUserPlanningData(currentUserId);
            }
        }
    }, [user?.id, store]);

    // SECURITY FIX: Monitor auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('SECURITY: Auth state changed:', event);
                
                if (event === 'SIGNED_OUT') {
                    console.log('SECURITY: User signed out, clearing all data');
                    store.clearUserData();
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log('SECURITY: Token refreshed, verifying user identity');
                    // Verify the user identity hasn't changed
                    if (session?.user?.id && session.user.id !== user?.id) {
                        console.log('SECURITY: User identity changed during token refresh, clearing data');
                        store.clearUserData();
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [store, user?.id]);

    return {
        ...store,
        // SECURITY: Add secure methods for authenticated operations
        makeAuthenticatedRequest,
        verifyUserAccess,
        // Override potentially unsafe methods with secure versions
        secureUserId: user?.id || null,
        isAuthenticated: !!user?.id
    };
};

/**
 * Hook to get user-scoped storage key
 * This ensures each user gets their own localStorage namespace
 */
export const useUserStorageKey = (): string => {
    const { user } = useAuth();
    
    if (user?.id) {
        return `gt-planner-storage-${user.id}`;
    }
    
    return 'gt-planner-storage-anonymous';
};

/**
 * Clear all planning data for the current user
 * Useful for logout or switching users
 */
export const clearUserPlanningData = (userId: string) => {
    const storageKey = `gt-planner-storage-${userId}`;
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
        console.log(`Cleared planning data for user: ${userId}`);
    }
};

/**
 * Check if there's persisted data for a specific user
 */
export const hasUserPlanningData = (userId: string): boolean => {
    const storageKey = `gt-planner-storage-${userId}`;
    
    if (typeof window !== 'undefined') {
        return localStorage.getItem(storageKey) !== null;
    }
    
    return false;
};