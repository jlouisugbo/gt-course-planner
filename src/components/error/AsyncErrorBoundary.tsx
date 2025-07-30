'use client';

import React, { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  context?: 'courses' | 'requirements' | 'planner' | 'dashboard' | 'auth' | 'general';
  onError?: (error: Error) => void;
  fallback?: ReactNode;
}

/**
 * Enhanced error boundary specifically designed for async operations
 * Integrates with React Query for better error handling and reset capabilities
 */
export function AsyncErrorBoundary({
  children,
  context,
  onError,
  fallback
}: AsyncErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  useEffect(() => {
    // Reset query errors when component unmounts or resets
    return () => {
      reset();
    };
  }, [reset]);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log the error for monitoring
    console.error(`AsyncErrorBoundary [${context}]:`, error, errorInfo);
    
    // Reset any failed queries
    reset();
    
    // Call custom error handler
    if (onError) {
      onError(error);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, { context, errorInfo });
    }
  };

  return (
    <ErrorBoundary
      context={context}
      onError={handleError}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling async errors in components
export function useAsyncErrorHandler(context?: string) {
  const { reset } = useQueryErrorResetBoundary();

  const handleAsyncError = (error: Error) => {
    console.error(`Async error in ${context}:`, error);
    
    // Reset queries on error
    reset();
    
    // Re-throw to be caught by error boundary
    throw error;
  };

  return { handleAsyncError, resetQueries: reset };
}