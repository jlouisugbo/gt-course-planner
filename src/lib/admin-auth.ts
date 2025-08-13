import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';

export interface AdminAuthResult {
    user: any;
    isAdmin: boolean;
    error?: string;
}

/**
 * Authenticates request and verifies admin status
 */
export async function authenticateAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
    try {
        // First authenticate the user
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return {
                user: null,
                isAdmin: false,
                error: 'Authentication required'
            };
        }

        // Check if user is admin
        const { data: userRecord, error: userError } = await supabaseAdmin()
            .from('users')
            .select('admin')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userRecord) {
            return {
                user,
                isAdmin: false,
                error: 'User profile not found'
            };
        }

        return {
            user,
            isAdmin: userRecord.admin === true,
            error: undefined
        };
    } catch (error) {
        console.error('Admin auth error:', error);
        return {
            user: null,
            isAdmin: false,
            error: 'Authentication error'
        };
    }
}

/**
 * Hook for checking admin status in components
 */
export async function checkAdminStatus(userId: string): Promise<boolean> {
    try {
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('admin')
            .eq('auth_id', userId)
            .single();

        return userRecord?.admin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}