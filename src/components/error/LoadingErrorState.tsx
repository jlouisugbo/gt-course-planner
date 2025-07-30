'use client';

import React from 'react';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingErrorStateProps {
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorMessage?: string;
  context?: 'courses' | 'requirements' | 'planner' | 'dashboard';
  compact?: boolean;
}

export function LoadingErrorState({
  isLoading = false,
  error = null,
  onRetry,
  loadingMessage,
  errorMessage,
  context = 'courses',
  compact = false
}: LoadingErrorStateProps) {
  const getContextualContent = () => {
    switch (context) {
      case 'courses':
        return {
          loadingDefault: 'Loading courses...',
          errorDefault: 'Unable to load course information',
          icon: '📚'
        };
      case 'requirements':
        return {
          loadingDefault: 'Loading degree requirements...',
          errorDefault: 'Unable to load requirements',
          icon: '🎓'
        };
      case 'planner':
        return {
          loadingDefault: 'Loading your academic plan...',
          errorDefault: 'Unable to load planner data',
          icon: '📅'
        };
      case 'dashboard':
        return {
          loadingDefault: 'Loading dashboard...',
          errorDefault: 'Unable to load dashboard',
          icon: '📊'
        };
      default:
        return {
          loadingDefault: 'Loading...',
          errorDefault: 'Unable to load data',
          icon: '⏳'
        };
    }
  };

  const { loadingDefault, errorDefault, icon } = getContextualContent();

  // Loading state
  if (isLoading) {
    if (compact) {
      return (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#003057]" />
          <span className="text-sm text-gray-600">
            {loadingMessage || loadingDefault}
          </span>
        </div>
      );
    }

    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center space-x-3 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
            <span className="text-2xl">{icon}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {loadingMessage || loadingDefault}
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Please wait while we fetch the latest information from GT systems
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    const isNetworkError = error.message?.toLowerCase().includes('fetch') ||
                          error.message?.toLowerCase().includes('network');

    if (compact) {
      return (
        <div className="flex flex-col items-center space-y-3 py-4">
          <div className="flex items-center space-x-2 text-red-600">
            {isNetworkError ? (
              <WifiOff className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">
              {errorMessage || errorDefault}
            </span>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return (
      <Card className="w-full border-red-200 bg-red-50/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center space-x-3 mb-4">
            {isNetworkError ? (
              <WifiOff className="h-8 w-8 text-red-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
            <span className="text-2xl opacity-60">{icon}</span>
          </div>
          
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {errorMessage || errorDefault}
          </h3>
          
          <p className="text-sm text-red-600 text-center max-w-sm mb-4">
            {isNetworkError 
              ? 'Please check your internet connection and try again'
              : 'There was a problem loading this information'
            }
          </p>

          {/* Connection status */}
          <div className="flex items-center space-x-2 text-xs mb-4">
            {navigator.onLine ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-[#003057] hover:bg-[#002041] text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 w-full max-w-md">
              <summary className="cursor-pointer text-xs text-gray-600 mb-2">
                Debug Info
              </summary>
              <div className="bg-white border rounded p-2 text-xs text-gray-800 overflow-auto max-h-32">
                <pre>{error.toString()}</pre>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  // Neither loading nor error - render nothing
  return null;
}

// Simplified hook for common loading/error patterns
export function useLoadingErrorState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const executeWithLoadingState = React.useCallback(async (
    asyncFn: () => Promise<void>,
    errorContext?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      await asyncFn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error in ${errorContext}:`, error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const retry = React.useCallback((asyncFn: () => Promise<void>) => {
    if (!isLoading) {
      executeWithLoadingState(asyncFn);
    }
  }, [isLoading, executeWithLoadingState]);

  return {
    isLoading,
    error,
    executeWithLoadingState,
    clearError,
    retry: (asyncFn: () => Promise<void>) => retry(asyncFn),
    LoadingErrorComponent: (props: Omit<LoadingErrorStateProps, 'isLoading' | 'error'>) => (
      <LoadingErrorState
        {...props}
        isLoading={isLoading}
        error={error}
        onRetry={() => props.onRetry?.()}
      />
    )
  };
}