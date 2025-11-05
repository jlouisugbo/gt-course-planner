"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, Calendar, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileIncompleteErrorProps {
  missingFields?: string[];
  error?: Error | null;
}

/**
 * ProfileIncompleteError Component
 *
 * Displays a user-friendly error message when the dashboard cannot load
 * due to incomplete profile information, especially missing or invalid dates.
 */
export function ProfileIncompleteError({
  missingFields = [],
  error
}: ProfileIncompleteErrorProps) {
  const router = useRouter();

  // Check if this is a date-related error
  const isDateError = error?.message.includes('date') ||
                      error?.message.includes('Season YYYY') ||
                      missingFields.some(f => f.includes('date') || f.includes('graduation'));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full border-2 border-gt-gold shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl text-gt-navy">
            Profile Setup Required
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main message */}
          <div className="text-center">
            <p className="text-gray-700 text-lg">
              We need a bit more information to set up your dashboard.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {isDateError
                ? "Your profile is missing valid start and graduation dates."
                : "Please complete your profile to access all features."}
            </p>
          </div>

          {/* Missing fields */}
          {missingFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Required Information:
              </h3>
              <ul className="space-y-2">
                {missingFields.map((field, index) => (
                  <li key={index} className="text-yellow-800 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                    {formatFieldName(field)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Date format requirements */}
          {isDateError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Format Requirements:
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>Start Date:</strong> The semester you began at Georgia Tech
                  <br />
                  <span className="text-xs text-blue-600">Example: Fall 2020, Spring 2021</span>
                </p>
                <p>
                  <strong>Graduation Date:</strong> Your expected graduation semester
                  <br />
                  <span className="text-xs text-blue-600">Example: Spring 2024, Fall 2025</span>
                </p>
              </div>
            </div>
          )}

          {/* What's missing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <User className="h-5 w-5 text-gt-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-gray-900">Basic Info</h4>
                <p className="text-xs text-gray-600 mt-1">Name, email, major</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <Calendar className="h-5 w-5 text-gt-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-gray-900">Important Dates</h4>
                <p className="text-xs text-gray-600 mt-1">Start & graduation</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <GraduationCap className="h-5 w-5 text-gt-gold flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-gray-900">Academic Plan</h4>
                <p className="text-xs text-gray-600 mt-1">Threads, minors</p>
              </div>
            </div>
          </div>

          {/* Error details (in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="bg-gray-100 rounded-lg p-3">
              <summary className="text-xs font-mono text-gray-600 cursor-pointer">
                Error Details (dev only)
              </summary>
              <pre className="text-xs text-gray-700 mt-2 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => router.push('/profile')}
              className="flex-1 bg-gt-navy hover:bg-gt-navy-700 text-white"
              size="lg"
            >
              <User className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Go to Home
            </Button>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-gray-500 pt-2">
            Need help? Contact your academic advisor or visit the{' '}
            <a href="/help" className="text-gt-gold hover:underline">
              help center
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Format field names to be user-friendly
 */
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    'startDate': 'Start Date (e.g., Fall 2020)',
    'expectedGraduation': 'Expected Graduation (e.g., Spring 2024)',
    'graduationDate': 'Graduation Date',
    'major': 'Major',
    'full_name': 'Full Name',
    'name': 'Name',
    'email': 'Email Address',
    'threads': 'Threads/Specializations',
    'minors': 'Minor Programs'
  };

  return fieldMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
