'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NetworkErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  context?: string;
  title?: string;
  description?: string;
}

export function NetworkErrorFallback({
  error,
  resetError,
  context = 'application',
  title,
  description
}: NetworkErrorFallbackProps) {
  const isNetworkError = error?.message?.includes('fetch') || 
                        error?.message?.includes('network') ||
                        error?.message?.includes('Failed to load');

  const getErrorContent = () => {
    if (isNetworkError) {
      return {
        icon: <WifiOff className="h-12 w-12 text-orange-500" />,
        title: title || 'Connection Issue',
        description: description || `Unable to connect to GT Course Planner services. Please check your internet connection and try again.`,
        bgColor: 'from-orange-50 to-red-50',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Verify GT network access if on campus',
          'Contact IT support if the issue persists'
        ]
      };
    }

    return {
      icon: <AlertCircle className="h-12 w-12 text-red-500" />,
      title: title || `${context.charAt(0).toUpperCase() + context.slice(1)} Error`,
      description: description || `There was an issue loading ${context}. This might be a temporary problem with the GT Course Planner.`,
      bgColor: 'from-red-50 to-pink-50',
      suggestions: [
        'Try refreshing the page',
        'Check if other features are working',
        'Clear your browser cache',
        'Contact support if the problem continues'
      ]
    };
  };

  const { icon, title: errorTitle, description: errorDescription, bgColor, suggestions } = getErrorContent();

  return (
    <div className={`min-h-[400px] bg-gradient-to-br ${bgColor} flex items-center justify-center p-6`}>
      <Card className="max-w-md w-full shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
            {errorTitle}
          </CardTitle>
          <p className="text-gray-600 text-sm leading-relaxed">
            {errorDescription}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            {navigator.onLine ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Internet Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">No Internet Connection</span>
              </>
            )}
          </div>

          {/* Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">Try these steps:</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-700 mb-2">
                Technical Details
              </summary>
              <pre className="text-xs text-gray-600 overflow-auto max-h-24 whitespace-pre-wrap">
                {error.toString()}
              </pre>
            </details>
          )}

          {/* Action Button */}
          {resetError && (
            <Button
              onClick={resetError}
              className="w-full bg-[#003057] hover:bg-[#002041] text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component for inline network error display (smaller format)
export function InlineNetworkError({
  onRetry,
  message = "Unable to load data"
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <WifiOff className="h-8 w-8 text-gray-400 mb-3" />
      <h3 className="text-sm font-medium text-gray-700 mb-2">{message}</h3>
      <p className="text-xs text-gray-500 mb-4">
        Check your connection and try again
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}