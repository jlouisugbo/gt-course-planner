'use client';

import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void | Promise<void>;
  onFallback?: () => void;
  context?: string;
  fallbackComponent?: ReactNode;
  showAutoRetry?: boolean;
  maxAutoRetries?: number;
  autoRetryDelay?: number;
}

type RecoveryState = 'idle' | 'retrying' | 'success' | 'failed' | 'fallback';

/**
 * Component-level error recovery with automatic retry capabilities
 */
export function ErrorRecovery({
  error,
  onRetry,
  onFallback,
  context = 'Component',
  fallbackComponent,
  showAutoRetry = true,
  maxAutoRetries = 3,
  autoRetryDelay = 2000
}: ErrorRecoveryProps) {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle');
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const handleRetry = useCallback(async (isAutoRetry = false): Promise<void> => {
    setRecoveryState('retrying');
    setRetryCountdown(0);

    try {
      await onRetry();
      setRecoveryState('success');
      
      // Reset auto-retry count on successful recovery
      if (isAutoRetry) {
        setAutoRetryCount(0);
      }
      
      // Auto-hide success state after 2 seconds
      setTimeout(() => {
        setRecoveryState('idle');
      }, 2000);
      
    } catch (retryError) {
      console.error(`Retry failed for ${context}:`, retryError);
      setRecoveryState('failed');
      
      if (isAutoRetry) {
        setAutoRetryCount(prev => prev + 1);
        // Reset to idle for next auto-retry attempt
        setTimeout(() => {
          setRecoveryState('idle');
        }, 1000);
      }
    }
  }, [onRetry, context]);

  // Auto-retry logic
  useEffect(() => {
    if (showAutoRetry && autoRetryCount < maxAutoRetries && recoveryState === 'idle') {
      const timer = setTimeout(() => {
        handleRetry(true);
      }, autoRetryDelay);

      // Countdown display
      const countdownInterval = setInterval(() => {
        setRetryCountdown(() => {
          const remaining = Math.ceil((autoRetryDelay - (Date.now() % autoRetryDelay)) / 1000);
          return Math.max(0, remaining);
        });
      }, 1000);

      setRetryCountdown(Math.ceil(autoRetryDelay / 1000));

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
    // Return empty cleanup function for non-matching conditions
    return undefined;
  }, [showAutoRetry, autoRetryCount, maxAutoRetries, autoRetryDelay, recoveryState, handleRetry]);

  const handleFallback = useCallback(() => {
    setRecoveryState('fallback');
    if (onFallback) {
      onFallback();
    }
  }, [onFallback]);

  const getErrorSeverity = () => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) return 'medium';
    if (message.includes('unauthorized') || message.includes('forbidden')) return 'high';
    if (message.includes('server') || message.includes('500')) return 'high';
    return 'medium';
  };

  const severity = getErrorSeverity();

  if (recoveryState === 'fallback' && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <Card className="max-w-md mx-auto border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Error Status */}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              recoveryState === 'success' ? 'bg-green-100' : 
              recoveryState === 'retrying' ? 'bg-blue-100' : 
              'bg-red-100'
            }`}>
              {recoveryState === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : recoveryState === 'retrying' ? (
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {recoveryState === 'success' ? 'Recovered Successfully' :
                 recoveryState === 'retrying' ? 'Attempting Recovery...' :
                 `${context} Error`}
              </h3>
              <p className="text-sm text-gray-600">
                {recoveryState === 'success' ? 'The issue has been resolved' :
                 recoveryState === 'retrying' ? 'Please wait while we fix this' :
                 error.message}
              </p>
            </div>
            
            <Badge variant={severity === 'high' ? 'destructive' : 'secondary'}>
              {severity === 'high' ? 'Critical' : 'Recoverable'}
            </Badge>
          </div>

          {/* Auto-retry info */}
          {showAutoRetry && autoRetryCount < maxAutoRetries && recoveryState === 'idle' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Auto-retry in {retryCountdown} seconds... ({autoRetryCount + 1}/{maxAutoRetries})
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {recoveryState === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                Recovery successful! The component is working normally again.
              </AlertDescription>
            </Alert>
          )}

          {/* Max retries reached */}
          {autoRetryCount >= maxAutoRetries && recoveryState !== 'retrying' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Automatic recovery attempts have been exhausted. Please try manual recovery.
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleRetry(false)}
              disabled={recoveryState === 'retrying'}
              className="flex-1"
              variant={recoveryState === 'success' ? 'outline' : 'default'}
            >
              {recoveryState === 'retrying' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            {(onFallback || fallbackComponent) && (
              <Button
                onClick={handleFallback}
                variant="outline"
                className="flex-1"
                disabled={recoveryState === 'retrying'}
              >
                Use Fallback
              </Button>
            )}
          </div>

          {/* Debug info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify({
                  error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack?.split('\n').slice(0, 5).join('\n')
                  },
                  recoveryState,
                  autoRetryCount,
                  context
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Higher-order component for automatic error recovery
 */
export function withErrorRecovery<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    context?: string;
    fallbackComponent?: ReactNode;
    onError?: (error: Error) => void;
    showAutoRetry?: boolean;
    maxAutoRetries?: number;
  } = {}
) {
  const WrappedComponent = (props: P) => {
    const [error, setError] = useState<Error | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    const handleRetry = useCallback(() => {
      setError(null);
      setRetryKey(prev => prev + 1);
    }, []);

    // Error boundary logic
    useEffect(() => {
      const errorHandler = (event: ErrorEvent) => {
        setError(new Error(event.message));
        if (options.onError) {
          options.onError(new Error(event.message));
        }
      };

      window.addEventListener('error', errorHandler);
      return () => window.removeEventListener('error', errorHandler);
    }, []);

    if (error) {
      return (
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          context={options.context || Component.displayName || Component.name}
          fallbackComponent={options.fallbackComponent}
          showAutoRetry={options.showAutoRetry}
          maxAutoRetries={options.maxAutoRetries}
        />
      );
    }

    return <Component key={retryKey} {...props} />;
  };

  WrappedComponent.displayName = `withErrorRecovery(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for component-level error recovery
 */
export function useErrorRecovery(context?: string) {
  const [error, setError] = useState<Error | null>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('idle');

  const clearError = useCallback(() => {
    setError(null);
    setRecoveryState('idle');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error(`Error in ${context}:`, error);
    setError(error);
    setRecoveryState('idle');
  }, [context]);

  const retry = useCallback(async (retryFunction: () => Promise<void> | void) => {
    setRecoveryState('retrying');
    try {
      await retryFunction();
      setRecoveryState('success');
      setTimeout(() => {
        clearError();
      }, 2000);
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      setRecoveryState('failed');
      if (retryError instanceof Error) {
        setError(retryError);
      }
    }
  }, [clearError]);

  return {
    error,
    recoveryState,
    handleError,
    clearError,
    retry,
    isRetrying: recoveryState === 'retrying',
    hasError: !!error
  };
}