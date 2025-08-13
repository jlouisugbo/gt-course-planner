import { NextRequest, NextResponse } from 'next/server';
import { generateErrorId } from './errorHandlingUtils';

export interface ApiErrorContext {
  endpoint: string;
  method: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  errorId: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  context: ApiErrorContext;
  stack?: string;
}

/**
 * Enhanced API error handler with monitoring and tracking
 */
export function createApiErrorHandler(endpoint: string) {
  return (request: NextRequest) => {
    const errorId = generateErrorId();
    const timestamp = new Date().toISOString();
    
    const context: ApiErrorContext = {
      endpoint,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') as string || undefined,
      timestamp,
      errorId
    };

    return {
      /**
       * Handle API errors with proper logging and response formatting
       */
      handleError: (error: unknown, customMessage?: string, statusCode = 500): NextResponse => {
        const apiError: ApiError = {
          message: customMessage || (error instanceof Error ? error.message : 'Internal server error'),
          code: error && typeof error === 'object' && 'code' in error ? error.code as string : undefined,
          statusCode,
          context,
          stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
        };

        // Log error with full context
        console.error(`[API ERROR] ${endpoint}:`, {
          error,
          apiError,
          request: {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries())
          }
        });

        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          reportApiError(apiError, error);
        }

        // Return structured error response
        const response = {
          error: apiError.message,
          code: apiError.code,
          errorId: apiError.context.errorId,
          timestamp: apiError.context.timestamp,
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              stack: apiError.stack,
              endpoint: apiError.context.endpoint
            }
          })
        };

        return NextResponse.json(response, { status: statusCode });
      },

      /**
       * Handle validation errors
       */
      handleValidationError: (message: string, details?: any): NextResponse => {
        const validationError = {
          error: message,
          code: 'VALIDATION_ERROR',
          details,
          errorId: context.errorId,
          timestamp: context.timestamp
        };

        console.warn(`[VALIDATION ERROR] ${endpoint}:`, validationError);

        return NextResponse.json(validationError, { status: 400 });
      },

      /**
       * Handle authentication errors
       */
      handleAuthError: (message = 'Authentication required'): NextResponse => {
        const authError = {
          error: message,
          code: 'AUTH_ERROR',
          errorId: context.errorId,
          timestamp: context.timestamp
        };

        console.warn(`[AUTH ERROR] ${endpoint}:`, authError);

        return NextResponse.json(authError, { status: 401 });
      },

      /**
       * Handle not found errors
       */
      handleNotFoundError: (resource = 'Resource'): NextResponse => {
        const notFoundError = {
          error: `${resource} not found`,
          code: 'NOT_FOUND',
          errorId: context.errorId,
          timestamp: context.timestamp
        };

        console.info(`[NOT FOUND] ${endpoint}:`, notFoundError);

        return NextResponse.json(notFoundError, { status: 404 });
      },

      /**
       * Handle rate limiting errors
       */
      handleRateLimitError: (message = 'Too many requests'): NextResponse => {
        const rateLimitError = {
          error: message,
          code: 'RATE_LIMIT',
          errorId: context.errorId,
          timestamp: context.timestamp
        };

        console.warn(`[RATE LIMIT] ${endpoint}:`, rateLimitError);

        return NextResponse.json(rateLimitError, { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        });
      },

      /**
       * Success response with optional metadata
       */
      success: <T = any>(data: T, statusCode = 200, metadata?: any): NextResponse => {
        const response = {
          data,
          ...(metadata && { metadata }),
          timestamp: context.timestamp
        };

        // Log successful request (info level)
        console.info(`[API SUCCESS] ${endpoint}:`, {
          method: request.method,
          statusCode,
          errorId: context.errorId
        });

        return NextResponse.json(response, { status: statusCode });
      },

      // Expose context for custom handling
      context
    };
  };
}

/**
 * Report API errors to monitoring service
 */
async function reportApiError(apiError: ApiError, originalError: unknown) {
  try {
    // In production, this would integrate with your monitoring service
    // Example integrations:

    // Sentry
    // Sentry.captureException(originalError, {
    //   tags: {
    //     endpoint: apiError.context.endpoint,
    //     method: apiError.context.method,
    //     errorId: apiError.context.errorId
    //   },
    //   extra: {
    //     apiError,
    //     context: apiError.context
    //   }
    // });

    // DataDog
    // datadogLogger.error('API Error', {
    //   error: apiError,
    //   context: apiError.context,
    //   tags: [`endpoint:${apiError.context.endpoint}`, `method:${apiError.context.method}`]
    // });

    // LogRocket (for user session replay)
    // LogRocket.captureException(originalError);

    // Custom logging service
    // await fetch('/api/internal/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: 'api-error',
    //     error: apiError,
    //     originalError: originalError instanceof Error ? {
    //       name: originalError.name,
    //       message: originalError.message,
    //       stack: originalError.stack
    //     } : originalError
    //   })
    // });

    console.group('🚨 API Error Report (would send to monitoring service)');
    console.error('API Error:', apiError);
    console.error('Original Error:', originalError);
    console.error('Context:', apiError.context);
    console.groupEnd();
  } catch (reportingError) {
    console.error('Failed to report API error to monitoring service:', reportingError);
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withErrorHandling(
  handler: (
    request: NextRequest, 
    errorHandler: ReturnType<ReturnType<typeof createApiErrorHandler>>
  ) => Promise<NextResponse>,
  endpoint?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const actualEndpoint = endpoint || request.url.split('/api')[1] || 'unknown';
    const errorHandler = createApiErrorHandler(actualEndpoint)(request);

    try {
      return await handler(request, errorHandler);
    } catch (error) {
      // Catch any unhandled errors
      return errorHandler.handleError(error);
    }
  };
}

/**
 * Health check endpoint for network error detection
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}