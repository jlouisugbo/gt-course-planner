// lib/auth-server.ts - Server-side ONLY authentication functions
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest } from 'next/server';

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
      console.error('Authentication failed:', authError);
      return {
        user: null,
        error: 'Invalid or expired token'
      };
    }

    // Verify user exists in GT system
    const { data: userRecord, error: userError } = await supabaseAdmin()
      .from('users')
      .select('auth_id, full_name, email')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userRecord) {
      console.error('GT user verification failed:', userError);
      return {
        user: null,
        error: 'User not authorized for GT Course Planner'
      };
    }

    // Log access for FERPA compliance
    await logAcademicDataAccess(user.id, request.url, request.method);

    return {
      user: {
        id: user.id,
        email: user.email || '',
        gtUserId: userRecord.auth_id
      },
      error: null
    };

  } catch (error) {
    console.error('Authentication error:', error);
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
    console.error('Failed to log access:', error);
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