'use client';

import React from 'react';
import { createComponentLogger } from '@/lib/security/logger';
import { ENV } from '@/lib/security/config';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error handler for the GT Course Planner
 * This is the last line of defense for catching errors
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    const logger = createComponentLogger('GLOBAL_ERROR_HANDLER');
    
    // Log the error securely
    logger.critical('Global error boundary triggered', error, {
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
    
    // Report to monitoring service in production
    if (ENV.isProd) {
      // Monitoring service integration would go here
      // Example: reportCriticalError(error, { context: 'global', digest: error.digest });
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 text-center">
            {/* GT Branding */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#003057] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">GT</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Course Planner Unavailable
              </h1>
              <p className="text-gray-600 text-sm">
                We&apos;re experiencing technical difficulties with the GT Course Planner
              </p>
            </div>

            {/* Error Information */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
              <p className="text-sm text-red-700">
                A critical error occurred that prevented the application from loading properly. 
                Our technical team has been automatically notified.
              </p>
            </div>

            {/* Action Steps */}
            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full bg-[#003057] hover:bg-[#002041] text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Try to Reload Application
              </button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>If the problem persists:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Clear your browser cache and cookies</li>
                  <li>Try using a different browser</li>
                  <li>Check if your internet connection is stable</li>
                  <li>Contact GT IT support for assistance</li>
                </ul>
              </div>

              {/* Emergency Actions */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-400 mb-2">Emergency Options:</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
                  >
                    Home Page
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
                  >
                    Force Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Development Information */}
            {!ENV.isProd && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs font-medium text-gray-600">
                  Developer Information
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                  <pre className="whitespace-pre-wrap text-gray-800">
                    {error.toString()}
                  </pre>
                  {error.digest && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <strong>Error ID:</strong> {error.digest}
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}