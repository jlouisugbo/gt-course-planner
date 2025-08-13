'use client';

import React, { ReactNode, Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  onAuthError?: (error: Error) => void;
  onForceSignOut?: () => Promise<void>;
}

/**
 * Specialized error boundary for authentication-related errors
 * Provides state corruption protection and recovery mechanisms
 */
export class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  private readonly maxRetries = 2;

  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary: Authentication error caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report authentication errors
    if (this.props.onAuthError) {
      this.props.onAuthError(error);
    }

    // Check if this is a critical auth state corruption
    const isCriticalAuthError = this.isCriticalAuthError(error);
    
    if (isCriticalAuthError) {
      console.error('AuthErrorBoundary: Critical authentication error detected, may need forced logout');
      
      // In production, report to monitoring
      if (process.env.NODE_ENV === 'production') {
        // Example: reportCriticalAuthError(error, errorInfo);
      }
    }
  }

  private isCriticalAuthError(error: Error): boolean {
    const criticalPatterns = [
      /auth.*state.*corruption/i,
      /token.*expired/i,
      /session.*invalid/i,
      /user.*mismatch/i,
      /authentication.*bypass/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`AuthErrorBoundary: Retry attempt ${this.state.retryCount + 1}`);
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  private handleForceSignOut = async () => {
    try {
      console.log('AuthErrorBoundary: Force sign-out initiated');
      if (this.props.onForceSignOut) {
        await this.props.onForceSignOut();
      } else {
        // Fallback: Force page reload to clear all state
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/');
        }
      }
    } catch (error) {
      console.error('AuthErrorBoundary: Force sign-out failed:', error);
      // Ultimate fallback: hard reload
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const canRetry = this.state.retryCount < this.maxRetries;
      const isCritical = this.isCriticalAuthError(this.state.error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {isCritical ? 'Authentication Security Error' : 'Authentication Error'}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {isCritical 
                  ? 'A critical authentication security issue was detected. Please sign out and sign back in.' 
                  : 'An error occurred while managing your authentication. Please try again.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="text-left mb-4 p-3 bg-gray-50 rounded text-sm">
                  <summary className="cursor-pointer text-gray-700 font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              <div className="space-y-3">
                {isCritical ? (
                  <Button
                    onClick={this.handleForceSignOut}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Force Sign Out & Reload
                  </Button>
                ) : (
                  <>
                    {canRetry && (
                      <Button
                        onClick={this.handleRetry}
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again ({this.maxRetries - this.state.retryCount} left)
                      </Button>
                    )}
                    
                    <Button
                      onClick={this.handleForceSignOut}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out & Start Fresh
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={this.handleReset}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Reset Error State
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for components that need auth error protection
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onAuthError?: (error: Error) => void
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary onAuthError={onAuthError}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}