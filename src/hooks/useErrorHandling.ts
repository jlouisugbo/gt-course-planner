'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type ErrorContext = 'courses' | 'requirements' | 'planner' | 'dashboard' | 'auth' | 'profile';

interface ErrorMetadata {
  context: ErrorContext;
  action?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

interface ErrorHandlingOptions {
  context: ErrorContext;
  fallbackMessage?: string;
  retry?: () => void | Promise<void>;
  reportToService?: boolean;
}

export function useErrorHandling() {
  const queryClient = useQueryClient();

  // Enhanced error categorization
  const categorizeError = useCallback((_error: Error): {
    type: 'network' | 'auth' | 'validation' | 'api' | 'client' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userMessage: string;
  } => {
    const message = _error.message.toLowerCase();
    const stack = _error.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        type: 'network',
        severity: 'medium',
        userMessage: 'Unable to connect to GT servers. Please check your internet connection.'
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('403') || message.includes('401')) {
      return {
        type: 'auth',
        severity: 'high',
        userMessage: 'Your session has expired. Please log in again.'
      };
    }

    // API/Server errors
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return {
        type: 'api',
        severity: 'high',
        userMessage: 'GT Course Planner servers are temporarily unavailable. Please try again later.'
      };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'validation',
        severity: 'low',
        userMessage: 'Please check your input and try again.'
      };
    }

    // Client-side errors
    if (stack.includes('react') || stack.includes('component')) {
      return {
        type: 'client',
        severity: 'medium',
        userMessage: 'There was an issue with the page. Try refreshing or return to the dashboard.'
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      severity: 'medium',
      userMessage: 'An unexpected error occurred. Please try again or contact support.'
    };
  }, []);

  // Create error metadata for reporting
  const createErrorMetadata = useCallback((context: ErrorContext, error: Error): ErrorMetadata => {
    return {
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      // Note: In a real app, get userId from auth context
      userId: 'current-user-id'
    };
  }, []);

  // Report error to monitoring service
  const reportError = useCallback((error: Error, metadata: ErrorMetadata) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, send to error reporting service
      console.log('Would report error:', { error, metadata });
      // Example: Sentry.captureException(error, { extra: metadata });
    } else {
      // In development, just log
      console.error('Error Report:', { error, metadata });
    }
  }, []);

  // Handle GT-specific course data errors
  const handleCourseDataError = useCallback((error: Error, action?: string) => {
    const { type, severity, userMessage } = categorizeError(error);
    const metadata = createErrorMetadata('courses', error);
    
    // Clear related queries on certain errors
    if (type === 'api' || type === 'network') {
      queryClient.removeQueries({ queryKey: ['courses'] });
      queryClient.removeQueries({ queryKey: ['course-search'] });
    }

    reportError(error, { ...metadata, action });

    return {
      type,
      severity,
      userMessage: userMessage || 'Unable to load course information. Please try again.',
      shouldRetry: type === 'network' || type === 'api',
      shouldReload: type === 'client',
      shouldLogout: type === 'auth'
    };
  }, [categorizeError, createErrorMetadata, reportError, queryClient]);

  // Handle requirements/degree program errors
  const handleRequirementsError = useCallback((error: Error, action?: string) => {
    const { type, severity, userMessage } = categorizeError(error);
    const metadata = createErrorMetadata('requirements', error);

    // Clear requirements cache on error
    queryClient.removeQueries({ queryKey: ['degree-program'] });
    queryClient.removeQueries({ queryKey: ['requirements'] });

    reportError(error, { ...metadata, action });

    return {
      type,
      severity,
      userMessage: userMessage || 'Unable to load degree requirements. Please verify your profile setup.',
      shouldRetry: type === 'network' || type === 'api',
      shouldCheckProfile: true,
      shouldLogout: type === 'auth'
    };
  }, [categorizeError, createErrorMetadata, reportError, queryClient]);

  // Handle academic planner errors
  const handlePlannerError = useCallback((error: Error, action?: string) => {
    const { type, severity, userMessage } = categorizeError(error);
    const metadata = createErrorMetadata('planner', error);

    // Don't clear planner data immediately - user might lose work
    if (type === 'auth') {
      queryClient.removeQueries({ queryKey: ['planner'] });
    }

    reportError(error, { ...metadata, action });

    return {
      type,
      severity,
      userMessage: userMessage || 'Issue with academic planner. Your data should be safe, but try refreshing.',
      shouldRetry: type === 'network' || type === 'api',
      shouldBackup: true, // Suggest backing up current plan
      shouldLogout: type === 'auth'
    };
  }, [categorizeError, createErrorMetadata, reportError, queryClient]);

  // Handle authentication/profile errors
  const handleAuthError = useCallback((error: Error, action?: string) => {
    const { type, severity, userMessage } = categorizeError(error);
    const metadata = createErrorMetadata('auth', error);

    // Clear all user data on auth errors
    queryClient.clear();

    reportError(error, { ...metadata, action });

    return {
      type,
      severity,
      userMessage: userMessage || 'Authentication issue. Please log in again.',
      shouldLogout: true,
      shouldRedirect: '/auth/login'
    };
  }, [categorizeError, createErrorMetadata, reportError, queryClient]);

  // Generic error handler with context awareness
  const handleError = useCallback((
    error: Error, 
    options: ErrorHandlingOptions
  ) => {
    const { context, fallbackMessage, retry, reportToService = true } = options;

    let result;
    switch (context) {
      case 'courses':
        result = handleCourseDataError(error);
        break;
      case 'requirements':
        result = handleRequirementsError(error);
        break;
      case 'planner':
        result = handlePlannerError(error);
        break;
      case 'auth':
      case 'profile':
        result = handleAuthError(error);
        break;
      default:
        const { type, severity, userMessage } = categorizeError(error);
        const metadata = createErrorMetadata(context, error);
        if (reportToService) {
          reportError(error, metadata);
        }
        result = {
          type,
          severity,
          userMessage: fallbackMessage || userMessage,
          shouldRetry: type === 'network' || type === 'api'
        };
    }

    // Add retry function if provided
    const finalResult = { ...result } as typeof result & { retry?: () => void | Promise<void> };
    if (retry) {
      finalResult.retry = retry;
    }

    return finalResult;
  }, [handleCourseDataError, handleRequirementsError, handlePlannerError, handleAuthError, categorizeError, createErrorMetadata, reportError]);

  return {
    handleError,
    handleCourseDataError,
    handleRequirementsError,
    handlePlannerError,
    handleAuthError,
    categorizeError,
    reportError
  };
}