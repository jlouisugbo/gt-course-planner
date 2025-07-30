'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: 'courses' | 'requirements' | 'planner' | 'dashboard' | 'auth' | 'general';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private getContextualContent() {
    const { context } = this.props;
    
    switch (context) {
      case 'courses':
        return {
          title: 'Course Explorer Error',
          description: 'We encountered an issue while loading course information. This might be due to a connectivity problem or a temporary server issue.',
          icon: <BookOpen className="h-8 w-8 text-red-500" />,
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Clear your browser cache',
            'Go back to the dashboard and try again'
          ]
        };
      
      case 'requirements':
        return {
          title: 'Requirements Panel Error',
          description: 'There was a problem loading your degree requirements. This could be due to missing program data or a temporary issue.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          suggestions: [
            'Verify your major is set in profile settings',
            'Try refreshing the page',
            'Contact support if the issue persists',
            'Return to dashboard to continue planning'
          ]
        };
      
      case 'planner':
        return {
          title: 'Academic Planner Error',
          description: 'We encountered an issue with your academic planner. Your saved data should be intact, but the interface needs to reload.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          suggestions: [
            'Try refreshing the page',
            'Your planned courses should be saved',
            'Check if you can access other features',
            'Contact support if data appears lost'
          ]
        };
      
      case 'dashboard':
        return {
          title: 'Dashboard Error',
          description: 'There was an issue loading your dashboard. This might affect your progress tracking and overview.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          suggestions: [
            'Try refreshing the page',
            'Check your profile setup is complete',
            'Verify your internet connection',
            'Try logging out and back in'
          ]
        };
      
      case 'auth':
        return {
          title: 'Authentication Error',
          description: 'There was an issue with your authentication. You may need to log in again.',
          icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
          suggestions: [
            'Try logging out and back in',
            'Clear your browser cookies',
            'Check your internet connection',
            'Contact support if the issue persists'
          ]
        };
      
      default:
        return {
          title: 'Application Error',
          description: 'Something went wrong with the GT Course Planner. This is likely a temporary issue.',
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Return to the dashboard',
            'Contact support if the issue continues'
          ]
        };
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, icon, suggestions } = this.getContextualContent();

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {icon}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {title}
              </CardTitle>
              <p className="text-gray-600 text-base leading-relaxed">
                {description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Debug Information:</h4>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              {/* Suggestions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  What you can try:
                </h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-[#003057] hover:bg-[#002041] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Contact Support */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  If this problem continues, please contact GT support with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: Props['context']
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}