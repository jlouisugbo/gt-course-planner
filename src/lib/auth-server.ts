// lib/auth-server.ts - Server-side authentication utilities for API routes
import { createClient } from "@/lib/supabaseServer";
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;  // Auth UUID
  email: string;
  gtUserId?: string;  // Deprecated: use internalUserId instead
  internalUserId?: number;  // Internal database ID (BIGINT) - USE THIS for FK queries
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
        id: user.id,  // Auth UUID
        email: user.email || '',
        gtUserId: userRecord.auth_id,  // Deprecated
        internalUserId: userRecord.id  // Internal database ID for FK queries
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
 * Get authenticated user auth UUID from request
 * @deprecated Use getInternalUserId() instead for database queries
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const { user } = await authenticateRequest(request);
  return user?.id || null;
}

/**
 * Get internal database user ID from request
 * **USE THIS** for all database foreign key queries
 *
 * @param request - Next.js request object
 * @returns Internal database user ID (BIGINT) or null
 *
 * @example
 * ```typescript
 * const userId = await getInternalUserId(request);
 * if (!userId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 *
 * // Safe to use in FK queries:
 * await supabase.from('user_courses').select('*').eq('user_id', userId);
 * ```
 */
export async function getInternalUserId(request: NextRequest): Promise<number | null> {
  const { user } = await authenticateRequest(request);
  return user?.internalUserId || null;
}

/**
 * Require authentication and return internal user ID
 * Returns NextResponse error if not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const result = await requireAuth(request);
 *   if ('error' in result) return result.error;
 *
 *   const { userId, user } = result;
 *   // userId is guaranteed to be non-null here
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<
  | { userId: number; user: AuthenticatedUser; error?: never }
  | { userId?: never; user?: never; error: Response }
> {
  const { user, error: authError } = await authenticateRequest(request);

  if (authError || !user || !user.internalUserId) {
    return {
      error: Response.json(
        { error: authError || 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }

  return { userId: user.internalUserId, user };
}
