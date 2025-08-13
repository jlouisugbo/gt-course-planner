'use client';

import { toast } from 'sonner';

export interface ErrorInfo {
  type: 'network' | 'auth' | 'validation' | 'api' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldRetry: boolean;
  shouldLogout: boolean;
  userMessage: string;
  code?: string;
}

export interface ErrorHandlerOptions {
  context: string;
  showToast?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  userId?: string;
  fallbackMessage?: string;
  userMessage?: string;
}

/**
 * Centralized error categorization and handling utility
 */
export function categorizeError(error: any): ErrorInfo {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status || 0;
  const code = error?.code || error?.response?.data?.code;

  // Network and connectivity errors
  if (
    message.includes('fetch') || 
    message.includes('network') || 
    message.includes('timeout') ||
    message.includes('connection') ||
    code === 'NETWORK_ERROR'
  ) {
    return {
      type: 'network',
      severity: 'medium',
      shouldRetry: true,
      shouldLogout: false,
      userMessage: 'Connection issue. Please check your internet and try again.',
      code
    };
  }

  // Authentication and authorization errors
  if (
    status === 401 || 
    status === 403 ||
    message.includes('unauthorized') || 
    message.includes('invalid token') ||
    message.includes('session expired') ||
    code === 'AUTH_ERROR'
  ) {
    return {
      type: 'auth',
      severity: 'high',
      shouldRetry: false,
      shouldLogout: status === 401, // Only logout for 401, not 403 (forbidden)
      userMessage: status === 403 
        ? 'You don\'t have permission to perform this action.'
        : 'Your session has expired. Please log in again.',
      code
    };
  }

  // Validation and client errors (4xx except auth)
  if (status >= 400 && status < 500 && status !== 401 && status !== 403) {
    return {
      type: 'validation',
      severity: status === 404 ? 'medium' : 'low',
      shouldRetry: false,
      shouldLogout: false,
      userMessage: status === 404
        ? 'The requested information was not found.'
        : 'Please check your input and try again.',
      code
    };
  }

  // Server errors (5xx)
  if (status >= 500) {
    return {
      type: 'api',
      severity: status >= 503 ? 'high' : 'medium',
      shouldRetry: true,
      shouldLogout: false,
      userMessage: 'GT servers are experiencing issues. Please try again in a moment.',
      code
    };
  }

  // Database/Supabase specific errors
  if (error?.code && typeof error.code === 'string') {
    if (error.code.includes('PGRST')) {
      return {
        type: 'api',
        severity: 'medium',
        shouldRetry: true,
        shouldLogout: false,
        userMessage: 'Database error. Please try again.',
        code: error.code
      };
    }
  }

  // React errors (component rendering)
  if (error?.stack && message.includes('react')) {
    return {
      type: 'client',
      severity: 'high',
      shouldRetry: true,
      shouldLogout: false,
      userMessage: 'Something went wrong with the page. Try refreshing.',
      code
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    severity: 'medium',
    shouldRetry: true,
    shouldLogout: false,
    userMessage: 'An unexpected error occurred. Please try again.',
    code
  };
}

/**
 * Enhanced error handler with multiple output options
 */
export function handleError(
  error: unknown, 
  options: ErrorHandlerOptions = { context: 'unknown' }
): ErrorInfo {
  const {
    context,
    showToast = true,
    logToConsole = true,
    reportToService = process.env.NODE_ENV === 'production',
    userId
  } = options;

  const errorInfo = categorizeError(error);
  const errorId = generateErrorId();

  // Console logging
  if (logToConsole) {
    const logMethod = errorInfo.severity === 'critical' ? 'error' : 
                     errorInfo.severity === 'high' ? 'error' :
                     errorInfo.severity === 'medium' ? 'warn' : 'info';
    
    console[logMethod](`[${context.toUpperCase()}] Error:`, {
      error,
      errorInfo,
      errorId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Toast notification
  if (showToast) {
    switch (errorInfo.severity) {
      case 'critical':
        toast.error(errorInfo.userMessage, {
          description: 'Critical error - please contact support',
          duration: 10000,
        });
        break;
      case 'high':
        toast.error(errorInfo.userMessage, {
          duration: 8000,
        });
        break;
      case 'medium':
        toast.warning(errorInfo.userMessage, {
          duration: 5000,
        });
        break;
      default:
        toast.info(errorInfo.userMessage, {
          duration: 3000,
        });
    }
  }

  // Report to monitoring service
  if (reportToService && errorInfo.severity !== 'low') {
    reportToMonitoringService(error, {
      context,
      errorInfo,
      errorId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle logout if needed
  if (errorInfo.shouldLogout) {
    handleAuthError();
  }

  return errorInfo;
}

/**
 * Generate unique error ID for tracking
 */
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle authentication errors globally
 */
function handleAuthError() {
  // Clear any stored auth data
  try {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
  } catch {
    // Ignore localStorage errors
  }

  // Dispatch custom event for auth providers to handle
  window.dispatchEvent(new CustomEvent('auth-logout-required', {
    detail: { reason: 'session-expired' }
  }));

  // Show auth error toast
  toast.error('Session expired. Redirecting to login...', {
    duration: 3000
  });

  // Redirect after a brief delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}

/**
 * Report errors to monitoring service (placeholder)
 */
async function reportToMonitoringService(
  error: unknown, 
  metadata: Record<string, any>
) {
  // In production, this would send to Sentry, LogRocket, etc.
  try {
    // Example Sentry integration:
    // Sentry.captureException(error, {
    //   tags: {
    //     context: metadata.context,
    //     severity: metadata.errorInfo?.severity
    //   },
    //   extra: metadata
    // });

    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Report (would send to monitoring service)');
      console.error('Error:', error);
      console.info('Metadata:', metadata);
      console.groupEnd();
    }
  } catch (reportingError) {
    console.error('Failed to report error to monitoring service:', reportingError);
  }
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    context?: string;
    shouldRetry?: (error: any, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    context = 'operation',
    shouldRetry
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorInfo = categorizeError(error);
      const shouldRetryOperation = shouldRetry 
        ? shouldRetry(error, attempt)
        : errorInfo.shouldRetry && attempt < maxRetries;

      if (!shouldRetryOperation) {
        throw error;
      }

      console.warn(`[${context}] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Hook factory for creating context-specific error handlers
 */
export function createErrorHandler(context: string, userId?: string) {
  return (error: unknown, customOptions: Partial<ErrorHandlerOptions> = {}) => {
    return handleError(error, {
      context,
      userId,
      ...customOptions
    });
  };
}