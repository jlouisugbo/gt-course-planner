'use client';

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Error categorization function (extracted from useErrorHandling)
function categorizeError(error: any): {
  type: 'network' | 'auth' | 'validation' | 'api' | 'client' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldRetry: boolean;
  shouldLogout: boolean;
  userMessage: string;
} {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status || error?.response?.status || 0;

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      type: 'network',
      severity: 'medium',
      shouldRetry: true,
      shouldLogout: false,
      userMessage: 'Unable to connect to GT servers. Please check your internet connection.'
    };
  }

  // Authentication errors
  if (status === 401 || message.includes('unauthorized') || message.includes('invalid token')) {
    return {
      type: 'auth',
      severity: 'high',
      shouldRetry: false,
      shouldLogout: true,
      userMessage: 'Your session has expired. Please log in again.'
    };
  }

  // Validation errors (4xx except 401)
  if (status >= 400 && status < 500 && status !== 401) {
    return {
      type: 'validation',
      severity: 'medium',
      shouldRetry: false,
      shouldLogout: false,
      userMessage: 'Please check your input and try again.'
    };
  }

  // Server errors (5xx)
  if (status >= 500) {
    return {
      type: 'api',
      severity: 'high',
      shouldRetry: true,
      shouldLogout: false,
      userMessage: 'GT servers are experiencing issues. Please try again in a moment.'
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    severity: 'medium',
    shouldRetry: true,
    shouldLogout: false,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
}

// Global error handler for queries
function handleQueryError(error: unknown, query?: any) {
  const errorInfo = categorizeError(error);
  
  console.error('Query Error:', {
    error,
    query: query?.queryKey,
    type: errorInfo.type,
    severity: errorInfo.severity
  });

  // In production, report to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // reportToMonitoringService(error, {
    //   type: 'query-error',
    //   queryKey: query?.queryKey,
    //   errorType: errorInfo.type,
    //   severity: errorInfo.severity
    // });
  }

  return errorInfo;
}

// Global error handler for mutations
function handleMutationError(error: unknown, variables?: any, context?: any) {
  const errorInfo = categorizeError(error);
  
  console.error('Mutation Error:', {
    error,
    variables,
    context,
    type: errorInfo.type,
    severity: errorInfo.severity
  });

  // In production, report to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // reportToMonitoringService(error, {
    //   type: 'mutation-error',
    //   variables,
    //   context,
    //   errorType: errorInfo.type,
    //   severity: errorInfo.severity
    // });
  }

  return errorInfo;
}

// Create QueryClient with enhanced error handling
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const errorInfo = handleQueryError(error, query);
      
      // Handle auth errors globally
      if (errorInfo.shouldLogout) {
        // Trigger logout - this could be done via event dispatch or store
        window.dispatchEvent(new CustomEvent('auth-error', { 
          detail: { error, errorInfo } 
        }));
      }
    },
  }),
  
  mutationCache: new MutationCache({
    onError: (error, variables, context) => {
      const errorInfo = handleMutationError(error, variables, context);
      
      // Handle auth errors globally
      if (errorInfo.shouldLogout) {
        window.dispatchEvent(new CustomEvent('auth-error', { 
          detail: { error, errorInfo } 
        }));
      }
    },
  }),
  
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error) => {
        const errorInfo = categorizeError(error);
        
        // Don't retry auth errors or validation errors
        if (!errorInfo.shouldRetry) {
          return false;
        }
        
        // Retry network and server errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        const errorInfo = categorizeError(error);
        
        // Only retry network errors for mutations
        if (errorInfo.type !== 'network') {
          return false;
        }
        
        return failureCount < 2; // Fewer retries for mutations
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Utility functions for components to use
export function createErrorHandler(context: string) {
  return (error: unknown) => {
    const errorInfo = categorizeError(error);
    
    console.error(`Error in ${context}:`, {
      error,
      type: errorInfo.type,
      severity: errorInfo.severity,
      userMessage: errorInfo.userMessage
    });

    return errorInfo;
  };
}

// Hook for handling React Query errors in components
export function useQueryErrorHandler(context: string) {
  return {
    onError: createErrorHandler(context),
    retry: (failureCount: number, error: unknown) => {
      const errorInfo = categorizeError(error);
      return errorInfo.shouldRetry && failureCount < 3;
    }
  };
}