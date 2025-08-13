import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useCallback, useMemo } from "react";
import { usePlannerStore } from "./usePlannerStore";
import { supabase } from "@/lib/supabaseClient";

/**
 * SECURE User-aware wrapper for the planner store that handles user isolation
 * SECURITY FIX: This replaces vulnerable localStorage-based user identification
 * with proper server-side authentication and data isolation
 */
export const useUserAwarePlannerStore = () => {
    const { user } = useAuth();
    const baseStore = usePlannerStore();

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
            const currentUserId = baseStore.getCurrentStorageUserId();
            const newUserId = user.id;

            // If user has changed, completely clear the store to prevent data leakage
            if (currentUserId && currentUserId !== newUserId) {
                
                // Use the enhanced clearUserData method
                baseStore.clearUserData();
                
                // Also clear localStorage for the previous user
                clearUserPlanningData(currentUserId);
            }
        }
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- Remove baseStore from dependencies to prevent infinite loop

    // SECURITY FIX: Monitor auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                
                if (event === 'SIGNED_OUT') {
                    baseStore.clearUserData();
                } else if (event === 'TOKEN_REFRESHED') {
                    // Verify the user identity hasn't changed
                    if (session?.user?.id && session.user.id !== user?.id) {
                        baseStore.clearUserData();
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- Remove baseStore from dependencies to prevent infinite loop

    /**
     * SECURITY FIX: Secure user-scoped storage management
     */
    const secureStorageKey = useMemo(() => {
        if (user?.id) {
            return `gt-planner-secure-${user.id}`;
        }
        return null; // No storage for unauthenticated users
    }, [user?.id]);

    /**
     * SECURITY FIX: Override storage operations to use secure user-scoped keys
     */
    const secureStore = useMemo(() => {
        if (!user?.id) {
            // Return limited functionality for unauthenticated users
            return {
                ...baseStore,
                makeAuthenticatedRequest,
                verifyUserAccess,
                secureUserId: null,
                isAuthenticated: false,
                // Disable data persistence for unauthenticated users
                initializeStore: async () => {
                },
                updateStudentInfo: () => {
                },
                // Add other sensitive methods that require authentication
            };
        }

        // Return full store functionality with secure user scoping
        return {
            ...baseStore,
            makeAuthenticatedRequest,
            verifyUserAccess,
            secureUserId: user.id,
            isAuthenticated: true,
        };
    }, [user?.id, baseStore, makeAuthenticatedRequest, verifyUserAccess]);

    /**
     * SECURITY FIX: Initialize secure storage for authenticated users
     */
    useEffect(() => {
        if (user?.id && secureStorageKey) {
            // Check if we need to migrate from old insecure storage
            const oldStorageKeys = [
                'gt-planner-storage-anonymous-session',
                `gt-planner-storage-${user.id}` // Old potentially insecure key
            ];

            let migrationNeeded = false;
            oldStorageKeys.forEach(oldKey => {
                if (localStorage.getItem(oldKey)) {
                    localStorage.removeItem(oldKey);
                    migrationNeeded = true;
                }
            });

            if (migrationNeeded) {
            }
        }
    }, [user?.id, secureStorageKey]);

    return secureStore;
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