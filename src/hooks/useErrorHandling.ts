'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createErrorHandler, 
  withRetry, 
  ErrorInfo,
  ErrorHandlerOptions
} from '@/lib/errorHandlingUtils';

type ErrorContext = 'courses' | 'requirements' | 'planner' | 'dashboard' | 'auth' | 'profile';

interface UseErrorHandlingOptions {
  context: ErrorContext;
  userId?: string;
  showToasts?: boolean;
}

export function useErrorHandling(options: UseErrorHandlingOptions = { context: 'general' as any }) {
  const queryClient = useQueryClient();
  const { context, userId, showToasts = true } = options;

  // Create a context-specific error handler
  const contextErrorHandler = useMemo(() => {
    return createErrorHandler(context, userId);
  }, [context, userId]);

  // Handle errors with optional custom options
  const handleErrorWithOptions = useCallback((
    error: unknown, 
    customOptions: Partial<ErrorHandlerOptions> = {}
  ): ErrorInfo => {
    return contextErrorHandler(error, {
      showToast: showToasts,
      ...customOptions
    });
  }, [contextErrorHandler, showToasts]);

  // Quick error handler for common use cases
  const handleError = useCallback((error: unknown): ErrorInfo => {
    return handleErrorWithOptions(error);
  }, [handleErrorWithOptions]);

  // Handle async operation with retry logic
  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    retryOptions: {
      maxRetries?: number;
      delay?: number;
      shouldRetry?: (error: any, attempt: number) => boolean;
    } = {}
  ): Promise<T> => {
    try {
      return await withRetry(operation, {
        context,
        ...retryOptions
      });
    } catch (error) {
      handleError(error);
      throw error; // Re-throw after handling
    }
  }, [context, handleError]);

  // Clear related queries on error (useful for cache invalidation)
  const clearQueriesOnError = useCallback((queryKeys: string[]) => {
    return (error: unknown) => {
      const errorInfo = handleError(error);
      
      // Clear relevant queries based on error type
      if (errorInfo.type === 'auth') {
        queryClient.clear(); // Clear all queries on auth error
      } else if (errorInfo.type === 'api' && errorInfo.severity === 'high') {
        // Clear specific queries for API errors
        queryKeys.forEach(key => {
          queryClient.removeQueries({ queryKey: [key] });
        });
      }
      
      return errorInfo;
    };
  }, [handleError, queryClient]);

  // Optimistic update rollback handler
  const handleOptimisticError = useCallback((
    error: unknown,
    rollbackData: any,
    queryKey: string[]
  ) => {
    const errorInfo = handleError(error);
    
    // Rollback optimistic update
    queryClient.setQueryData(queryKey, rollbackData);
    
    // Optionally refetch the data
    if (errorInfo.shouldRetry) {
      queryClient.invalidateQueries({ queryKey });
    }
    
    return errorInfo;
  }, [handleError, queryClient]);

  // Form-specific error handler
  const handleFormError = useCallback((
    error: unknown, 
    formData?: any,
    onPartialSave?: (data: any) => void
  ) => {
    const errorInfo = handleErrorWithOptions(error, {
      logToConsole: true,
      showToast: showToasts
    });

    // Save form data for recovery if provided
    if (formData && onPartialSave) {
      try {
        onPartialSave(formData);
      } catch (saveError) {
        console.error('Failed to save form data for recovery:', saveError);
      }
    }

    return errorInfo;
  }, [handleErrorWithOptions, showToasts]);

  // Network-specific error handler with connectivity check
  const handleNetworkError = useCallback(async (error: unknown) => {
    const errorInfo = handleError(error);
    
    if (errorInfo.type === 'network') {
      // Check if it's actually a network issue
      try {
        const response = await fetch('/api/health', { method: 'HEAD' });
        if (response.ok) {
          // Network is fine, might be a CORS or other issue
          return handleErrorWithOptions(error, {
            showToast: true,
            userMessage: 'There was a connection issue. Please try again.'
          });
        }
      } catch {
        // Definitely a network issue
        return handleErrorWithOptions(error, {
          showToast: true,
          userMessage: 'You appear to be offline. Please check your connection.'
        });
      }
    }
    
    return errorInfo;
  }, [handleError, handleErrorWithOptions]);

  // Context-specific error handlers
  const contextSpecificHandlers = useMemo(() => {
    const baseHandler = handleErrorWithOptions;
    
    switch (context) {
      case 'courses':
        return {
          handleCourseLoadError: (error: unknown) => baseHandler(error, {
            fallbackMessage: 'Unable to load course information. Please try refreshing the page.'
          }),
          handleCourseSearchError: (error: unknown) => baseHandler(error, {
            fallbackMessage: 'Course search is temporarily unavailable. Please try again.'
          })
        };
        
      case 'planner':
        return {
          handlePlannerSaveError: (error: unknown, planData?: any) => {
            const errorInfo = baseHandler(error, {
              fallbackMessage: 'Failed to save your academic plan. Your data may have been preserved.'
            });
            
            // Try to save to localStorage as backup
            if (planData && errorInfo.shouldRetry) {
              try {
                localStorage.setItem('planner-backup', JSON.stringify({
                  data: planData,
                  timestamp: new Date().toISOString()
                }));
              } catch (e) {
                console.error('Failed to create backup:', e);
              }
            }
            
            return errorInfo;
          }
        };
        
      case 'requirements':
        return {
          handleRequirementError: (error: unknown) => baseHandler(error, {
            fallbackMessage: 'Unable to load degree requirements. Please check your profile setup.'
          })
        };
        
      case 'auth':
        return {
          handleAuthError: (error: unknown) => baseHandler(error, {
            fallbackMessage: 'Authentication issue. You may need to log in again.',
            reportToService: true
          })
        };
        
      default:
        return {};
    }
  }, [context, handleErrorWithOptions]);

  return {
    // Core handlers
    handleError,
    handleErrorWithOptions,
    handleAsyncOperation,
    
    // Specialized handlers  
    handleFormError,
    handleNetworkError,
    clearQueriesOnError,
    handleOptimisticError,
    
    // Context-specific handlers
    ...contextSpecificHandlers,
    
    // Utility functions
    withRetry: (operation: () => Promise<any>, options = {}) => 
      withRetry(operation, { context, ...options }),
      
    // Query utilities
    invalidateQueries: (queryKey: string[]) => queryClient.invalidateQueries({ queryKey }),
    clearQueries: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
    clearAllQueries: () => queryClient.clear()
  };
}

// Specialized hooks for different contexts
export const useCourseErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'courses', userId });

export const usePlannerErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'planner', userId });

export const useRequirementsErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'requirements', userId });

export const useAuthErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'auth', userId });

export const useProfileErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'profile', userId });

export const useDashboardErrorHandling = (userId?: string) => 
  useErrorHandling({ context: 'dashboard', userId });