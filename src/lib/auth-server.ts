// lib/auth-server.ts - Simplified server-side authentication for MVP
import { createClient } from "@/lib/supabaseServer";
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  gtUserId?: string;
}

/**
 * Simplified server-side authentication for API routes (MVP version)
 * Removed: Security logging, FERPA access logging, monitoring
 * Uses: Supabase server client with cookie-based sessions
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Authentication failed:', authError?.message);
      return {
        user: null,
        error: 'Invalid or expired session'
      };
    }

    // Verify user exists in GT system
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, full_name, email')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (userError || !userRecord) {
      console.warn('GT user verification failed:', userError?.message);
      return {
        user: null,
        error: 'User not authorized for GT Course Planner'
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        gtUserId: userRecord.auth_id
      },
      error: null
    };

  } catch (error) {
    console.error('Authentication service error:', error);
    return {
      user: null,
      error: 'Authentication service unavailable'
    };
  }
}

/**
 * Middleware wrapper for API routes requiring authentication
 */
export function withAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);

    if (!user || error) {
      return Response.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

/**
 * Get authenticated user ID from request
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const { user } = await authenticateRequest(request);
  return user?.id || null;
}
