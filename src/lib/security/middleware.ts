// Security middleware for API routes with proper Supabase authentication

import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export const SECURITY_CONFIGS = {
  COURSES_ALL: {
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
  USER_PROFILE: {
    rateLimit: { maxRequests: 50, windowMs: 60000 },
  },
  MEDIUM_SECURITY: {
    rateLimit: { maxRequests: 100, windowMs: 60000 },
  },
  HIGH_SECURITY: {
    rateLimit: { maxRequests: 50, windowMs: 60000 },
  },
};

export interface SecureRouteContext {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  } | null;
  validatedData?: {
    body?: any;
    query?: any;
  } | null;
}

export function createSecureRoute(
  handler: (request: Request, context: SecureRouteContext) => Promise<Response>,
  config?: any
) {
  return async (request: Request) => {
    try {
      // Create Supabase server client to check authentication
      const supabase = await createClient(); // ← AWAIT THIS!

      // Get the authenticated user from the session
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Debug logging to see what's in the user object
      if (user) {
        console.log('[Security Middleware] Authenticated user:', {
          id: user.id,
          email: user.email,
          hasEmail: !!user.email,
          userKeys: Object.keys(user)
        });
      } else if (authError) {
        console.log('[Security Middleware] Auth error:', authError);
      }

      // Validate request body if schema provided
      let validatedData: any = null;
      if (config?.validationSchema?.body && request.method !== 'GET') {
        try {
          const body = await request.json();
          validatedData = {
            body: config.validationSchema.body.parse(body)
          };
        } catch (validationError) {
          return NextResponse.json(
            { error: 'Validation failed', details: validationError },
            { status: 400 }
          );
        }
      }

      // Create context with authenticated user and validated data
      const context: SecureRouteContext = {
        user: user || null,
        validatedData
      };

      // Call the actual handler with the context
      return await handler(request, context);

    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
