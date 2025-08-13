/**
 * SECURE ERROR HANDLER FOR API ROUTES
 * 
 * This module provides production-safe error handling that:
 * - Sanitizes error responses to prevent information disclosure
 * - Provides consistent error response format
 * - Logs security events appropriately
 * - Maintains FERPA compliance
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createAPILogger } from './logger';

// Environment detection
const isProd = process.env.NODE_ENV === 'production';

// Error types for consistent handling
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
  SECURITY = 'SECURITY_ERROR',
  FERPA = 'FERPA_COMPLIANCE_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standard error response format
interface ErrorResponse {
  error: string;
  type: ErrorType;
  code?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Internal error details (never sent to client in production)
interface InternalErrorDetails {
  originalError: any;
  stack?: string;
  context: any;
  severity: ErrorSeverity;
}

/**
 * Main error handler class
 */
export class SecureAPIErrorHandler {
  private logger;
  private endpoint: string;
  private method: string;
  private userId?: string;
  private requestId?: string;

  constructor(
    endpoint: string,
    method: string,
    userId?: string,
    requestId?: string
  ) {
    this.endpoint = endpoint;
    this.method = method;
    this.userId = userId;
    this.requestId = requestId;
    this.logger = createAPILogger(endpoint, method, userId);
  }

  /**
   * Handle and respond to errors with appropriate sanitization
   */
  handleError(error: any, customMessage?: string): NextResponse {
    const errorAnalysis = this.analyzeError(error);
    const sanitizedResponse = this.createSanitizedResponse(errorAnalysis, customMessage);
    
    this.logError(errorAnalysis);
    
    return NextResponse.json(
      sanitizedResponse.body,
      { 
        status: sanitizedResponse.status,
        headers: sanitizedResponse.headers
      }
    );
  }

  /**
   * Analyze error to determine type, severity, and handling strategy
   */
  private analyzeError(error: any): {
    type: ErrorType;
    severity: ErrorSeverity;
    status: number;
    userMessage: string;
    internalDetails: InternalErrorDetails;
  } {
    // Zod validation errors
    if (error instanceof ZodError) {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        status: 400,
        userMessage: 'Invalid request data. Please check your input.',
        internalDetails: {
          originalError: error,
          context: { zodErrors: error.errors },
          severity: ErrorSeverity.LOW
        }
      };
    }

    // Database/Supabase errors
    if (error?.code && typeof error.code === 'string') {
      if (error.code.startsWith('PGRST') || error.code.includes('postgres')) {
        return {
          type: ErrorType.DATABASE,
          severity: ErrorSeverity.HIGH,
          status: 500,
          userMessage: 'A database error occurred. Please try again.',
          internalDetails: {
            originalError: error,
            context: { dbCode: error.code, dbMessage: error.message },
            severity: ErrorSeverity.HIGH
          }
        };
      }

      // Row Level Security violations (potential FERPA issue)
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return {
          type: ErrorType.FERPA,
          severity: ErrorSeverity.CRITICAL,
          status: 403,
          userMessage: 'Access denied. You do not have permission to access this data.',
          internalDetails: {
            originalError: error,
            context: { 
              securityViolation: true,
              userId: this.userId,
              endpoint: this.endpoint
            },
            severity: ErrorSeverity.CRITICAL
          }
        };
      }
    }

    // HTTP status based errors
    const status = error?.status || error?.statusCode || 0;
    
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.MEDIUM,
        status: 401,
        userMessage: 'Authentication required. Please log in again.',
        internalDetails: {
          originalError: error,
          context: { authFailure: true },
          severity: ErrorSeverity.MEDIUM
        }
      };
    }

    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        status: 403,
        userMessage: 'Access denied. You do not have permission to perform this action.',
        internalDetails: {
          originalError: error,
          context: { 
            authorizationFailure: true,
            userId: this.userId,
            endpoint: this.endpoint
          },
          severity: ErrorSeverity.HIGH
        }
      };
    }

    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        status: 404,
        userMessage: 'The requested resource was not found.',
        internalDetails: {
          originalError: error,
          context: { notFound: true },
          severity: ErrorSeverity.LOW
        }
      };
    }

    if (status === 429) {
      return {
        type: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        status: 429,
        userMessage: 'Too many requests. Please wait before trying again.',
        internalDetails: {
          originalError: error,
          context: { rateLimited: true },
          severity: ErrorSeverity.MEDIUM
        }
      };
    }

    // Security-related errors
    if (error.name === 'SecurityError' || error.message?.includes('security')) {
      return {
        type: ErrorType.SECURITY,
        severity: ErrorSeverity.CRITICAL,
        status: 400,
        userMessage: 'Security validation failed. Request blocked.',
        internalDetails: {
          originalError: error,
          context: { 
            securityEvent: true,
            endpoint: this.endpoint,
            userId: this.userId
          },
          severity: ErrorSeverity.CRITICAL
        }
      };
    }

    // Default to internal server error
    return {
      type: ErrorType.INTERNAL,
      severity: ErrorSeverity.HIGH,
      status: 500,
      userMessage: 'An internal server error occurred. Please try again later.',
      internalDetails: {
        originalError: error,
        stack: error?.stack,
        context: {
          errorName: error?.name,
          errorMessage: error?.message
        },
        severity: ErrorSeverity.HIGH
      }
    };
  }

  /**
   * Create sanitized response safe for client consumption
   */
  private createSanitizedResponse(
    errorAnalysis: any,
    customMessage?: string
  ): {
    body: ErrorResponse;
    status: number;
    headers: Record<string, string>;
  } {
    const response: ErrorResponse = {
      error: customMessage || errorAnalysis.userMessage,
      type: errorAnalysis.type,
      timestamp: new Date().toISOString(),
      requestId: this.requestId
    };

    // Only include error details in development
    if (!isProd && errorAnalysis.type === ErrorType.VALIDATION) {
      if (errorAnalysis.internalDetails.context.zodErrors) {
        response.details = errorAnalysis.internalDetails.context.zodErrors.map((err: any) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
          code: err.code
        }));
      }
    }

    // Add error code for specific types (safe for production)
    if (errorAnalysis.type === ErrorType.VALIDATION) {
      response.code = 'VALIDATION_FAILED';
    } else if (errorAnalysis.type === ErrorType.RATE_LIMIT) {
      response.code = 'RATE_LIMITED';
    } else if (errorAnalysis.type === ErrorType.NOT_FOUND) {
      response.code = 'NOT_FOUND';
    }

    // Security headers
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };

    // Add rate limit headers if applicable
    if (errorAnalysis.type === ErrorType.RATE_LIMIT) {
      headers['Retry-After'] = '60'; // Default retry after 60 seconds
    }

    return {
      body: response,
      status: errorAnalysis.status,
      headers
    };
  }

  /**
   * Log error with appropriate security and privacy considerations
   */
  private logError(errorAnalysis: any): void {
    const { type, severity, internalDetails } = errorAnalysis;

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.critical(
          `${type} occurred`,
          internalDetails.originalError,
          {
            context: internalDetails.context,
            endpoint: this.endpoint,
            method: this.method
          }
        );
        break;

      case ErrorSeverity.HIGH:
        this.logger.error(
          `${type} occurred`,
          internalDetails.originalError,
          {
            context: internalDetails.context,
            endpoint: this.endpoint,
            method: this.method
          }
        );
        break;

      case ErrorSeverity.MEDIUM:
        this.logger.warn(
          `${type} occurred`,
          {
            context: internalDetails.context,
            endpoint: this.endpoint,
            method: this.method
          }
        );
        break;

      case ErrorSeverity.LOW:
        this.logger.info(
          `${type} occurred`,
          {
            context: internalDetails.context,
            endpoint: this.endpoint,
            method: this.method
          }
        );
        break;
    }

    // Log security events separately
    if (type === ErrorType.SECURITY || type === ErrorType.FERPA) {
      this.logger.security(
        `Security event: ${type}`,
        {
          endpoint: this.endpoint,
          method: this.method,
          severity,
          context: internalDetails.context
        }
      );
    }
  }

  /**
   * Handle successful response with security headers
   */
  handleSuccess<T>(data: T, status = 200): NextResponse {
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };

    return NextResponse.json(data, { status, headers });
  }

  /**
   * Log FERPA-compliant academic data access
   */
  logAcademicAccess(action: string, dataType: string): void {
    this.logger.academicAccess(action, this.userId || 'unknown', dataType);
  }
}

/**
 * Factory function to create error handler for API routes
 */
export function createSecureErrorHandler(
  endpoint: string,
  method: string,
  userId?: string,
  requestId?: string
): SecureAPIErrorHandler {
  return new SecureAPIErrorHandler(endpoint, method, userId, requestId);
}

/**
 * Middleware wrapper that provides automatic error handling
 */
export function withSecureErrorHandling(
  handler: (request: Request, errorHandler: SecureAPIErrorHandler) => Promise<NextResponse>,
  endpoint?: string
) {
  return async (request: Request): Promise<NextResponse> => {
    const url = new URL(request.url);
    const endpointPath = endpoint || url.pathname;
    const method = request.method;
    
    // Generate request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorHandler = createSecureErrorHandler(
      endpointPath,
      method,
      undefined, // userId will be set by auth middleware
      requestId
    );

    try {
      return await handler(request, errorHandler);
    } catch (error) {
      return errorHandler.handleError(error);
    }
  };
}

// Export types for external usage
export type { ErrorResponse };