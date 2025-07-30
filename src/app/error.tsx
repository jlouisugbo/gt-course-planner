'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error page for the GT Course Planner
 * This catches any unhandled errors at the app level
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <ErrorBoundary
        context="general"
        onError={(err, errorInfo) => {
          console.error('App-level error:', err, errorInfo);
          // In production, report to error monitoring service
        }}
        fallback={
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-6xl mb-4">🏫</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                GT Course Planner Error
              </h1>
              <p className="text-gray-600 mb-4">
                We&apos;re experiencing technical difficulties. Our team has been notified.
              </p>
              <button
                onClick={reset}
                className="bg-[#003057] hover:bg-[#002041] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        }
      >
        {/* This should never render, but provides fallback structure */}
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Application Error</h1>
            <p className="text-gray-600 mb-4">Something went wrong.</p>
            <button
              onClick={reset}
              className="bg-[#003057] text-white px-4 py-2 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}