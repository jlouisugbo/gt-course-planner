// lib/auth-server.ts - Server-side ONLY authentication functions
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from 'next/server';
import { ensureUserInitialized } from './user-initialization';
import { createAPILogger } from './security/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  gtUserId?: string;
}

/**
 * SECURE SERVER-SIDE AUTHENTICATION FUNCTIONS
 * These replace the vulnerable client-side getUserId() function
 */

/**
 * Secure server-side authentication for API routes
 * Replaces the vulnerable client-side getUserId() function
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error: string | null;
}> {
  try {
    // Extract authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token);
    
    if (authError || !user) {
      const logger = createAPILogger('auth', 'authenticate');
      logger.warn('Authentication failed', { errorCode: authError?.message });
      return {
        user: null,
        error: 'Invalid or expired token'
      };
    }

    // Verify user exists in GT system
    const { data: userRecord, error: userError } = await supabaseAdmin()
      .from('users')
      .select('id, auth_id, full_name, email')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userRecord) {
      const logger = createAPILogger('auth', 'verify_user');
      logger.warn('GT user verification failed', { errorCode: userError?.message });
      return {
        user: null,
        error: 'User not authorized for GT Course Planner'
      };
    }

    // Log access for FERPA compliance
    await logAcademicDataAccess(user.id, request.url, request.method);

    // Auto-initialize user in required tables if needed
    try {
      const userId = typeof userRecord.id === 'number' ? userRecord.id : parseInt(String(userRecord.id));
      await ensureUserInitialized(userId);
    } catch (initError) {
      const logger = createAPILogger('auth', 'user_init');
      logger.warn('User initialization failed (non-critical)', initError);
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        gtUserId: typeof userRecord.auth_id === 'string' ? userRecord.auth_id : String(userRecord.auth_id)
      },
      error: null
    };

  } catch (error) {
    const logger = createAPILogger('auth', 'authenticate');
    logger.error('Authentication service error', error);
    return {
      user: null,
      error: 'Authentication service unavailable'
    };
  }
}

/**
 * FERPA-compliant access logging for academic data
 */
async function logAcademicDataAccess(userId: string, endpoint: string, method: string) {
  try {
    await supabaseAdmin()
      .from('access_logs')
      .insert({
        user_id: userId,
        endpoint,
        method,
        accessed_at: new Date().toISOString(),
        access_type: 'academic_data'
      });
  } catch (error) {
    const logger = createAPILogger('auth', 'access_log');
    logger.error('FERPA access logging failed', error, {
      critical: true,
      userId,
      endpoint
    });
    // Don't fail the request if logging fails, but alert monitoring
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
 * Secure replacement for client-side getUserId()
 * This should only be used server-side
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const { user } = await authenticateRequest(request);
  return user?.id || null;
}