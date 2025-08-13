/**
 * SECURE ERROR BOUNDARY
 * 
 * Production-safe error boundary that:
 * - Never exposes sensitive information to users
 * - Logs errors securely without FERPA violations
 * - Provides meaningful user feedback without technical details
 * - Implements proper error recovery mechanisms
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { createComponentLogger } from '@/lib/security/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  context?: string;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  errorBoundaryLevel: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class SecureErrorBoundary extends Component<Props, State> {
  private logger = createComponentLogger('ERROR_BOUNDARY');
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      errorBoundaryLevel: props.level || 'component'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate secure error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const { onError, context = 'Unknown' } = this.props;
    const { errorId, errorBoundaryLevel } = this.state;

    // Log error securely without sensitive data
    this.logger.error('Error boundary caught error', error, {
      errorId,
      context,
      level: errorBoundaryLevel,
      componentStack: this.sanitizeComponentStack(errorInfo.componentStack),
      retryCount: this.state.retryCount
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, { ...errorInfo, errorId, context });
      } catch (handlerError) {
        this.logger.error('Error in custom error handler', handlerError);
      }
    }

    // Report critical errors to monitoring
    if (errorBoundaryLevel === 'critical') {
      this.logger.critical('Critical error boundary triggered', error, {
        errorId,
        context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
    }
  }

  /**
   * Sanitize component stack to remove sensitive information
   */
  private sanitizeComponentStack(componentStack: string): string {
    if (!componentStack) return 'Not available';

    // Remove file paths and sensitive information
    return componentStack
      .replace(/\s+at\s+.*\((.*)\)/g, '  at [COMPONENT_PATH_REDACTED]')
      .replace(/http:\/\/[^\s]+/g, '[URL_REDACTED]')
      .replace(/https:\/\/[^\s]+/g, '[URL_REDACTED]')
      .replace(/\/.*\/src\//g, '/src/')
      .split('\n')
      .slice(0, 5) // Limit stack depth
      .join('\n');
  }

  /**
   * Retry the component rendering
   */
  private handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      this.logger.warn('Maximum retry attempts reached', {
        errorId: this.state.errorId,
        context: this.props.context
      });
      return;
    }

    this.logger.info('Attempting error recovery', {
      errorId: this.state.errorId,
      attempt: this.state.retryCount + 1,
      maxRetries: MAX_RETRIES
    });

    // Clear the error state after a brief delay
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }, RETRY_DELAY);
  };

  /**
   * Navigate to safe page (home)
   */
  private handleNavigateHome = () => {
    this.logger.info('User navigating to safe page', {
      errorId: this.state.errorId,
      context: this.props.context
    });

    window.location.href = '/dashboard';
  };

  /**
   * Reload the entire page
   */
  private handleReload = () => {
    this.logger.info('User reloading page', {
      errorId: this.state.errorId,
      context: this.props.context
    });

    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    const { hasError, errorId, retryCount, errorBoundaryLevel } = this.state;
    const { fallback, children, context } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Determine error severity and appropriate response
      const isCritical = errorBoundaryLevel === 'critical';
      const canRetry = retryCount < MAX_RETRIES;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md w-full space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className={`rounded-full p-4 ${
                isCritical ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                <AlertTriangle size={32} />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-gray-900">
              {isCritical ? 'Critical Error' : 'Something went wrong'}
            </h2>

            {/* Error Message */}
            <div className="space-y-2">
              <p className="text-gray-600">
                {isCritical 
                  ? 'A critical error occurred that prevented the application from working properly.'
                  : 'We encountered an unexpected error. This is usually temporary and can be resolved by trying again.'
                }
              </p>
              
              {context && (
                <p className="text-sm text-gray-500">
                  Error in: {context}
                </p>
              )}
              
              {errorId && (
                <p className="text-xs text-gray-400 font-mono">
                  Reference ID: {errorId}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {canRetry && !isCritical && (
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </Button>
              )}

              <Button 
                variant="outline" 
                onClick={this.handleNavigateHome}
                className="flex items-center justify-center space-x-2"
              >
                <Home size={16} />
                <span>Go to Dashboard</span>
              </Button>

              {isCritical && (
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Reload Page</span>
                </Button>
              )}
            </div>

            {/* Help Information */}
            <div className="text-sm text-gray-500 border-t pt-4">
              <p>
                If this problem persists, please contact support and provide the reference ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withSecureErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    context?: string;
    level?: 'page' | 'component' | 'critical';
    fallback?: ReactNode;
  } = {}
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithErrorBoundary = (props: P) => (
    <SecureErrorBoundary
      context={options.context || displayName}
      level={options.level}
      fallback={options.fallback}
    >
      <WrappedComponent {...props} />
    </SecureErrorBoundary>
  );

  WithErrorBoundary.displayName = `withSecureErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

/**
 * Hook to trigger error boundary from child components
 */
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    const logger = createComponentLogger('ERROR_HANDLER');
    logger.error('Error triggered by useErrorHandler', error, { context });
    
    // This will trigger the nearest error boundary
    throw error;
  };
}

export default SecureErrorBoundary;