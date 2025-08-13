'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AsyncErrorBoundary } from './AsyncErrorBoundary';

interface FormErrorBoundaryProps {
  children: ReactNode;
  context: 'profile-setup' | 'course-planning' | 'requirements' | 'general-form';
  onError?: (error: Error) => void;
  onRetry?: () => void;
  onSavePartial?: () => void;
  formData?: any;
  fallback?: ReactNode;
}

/**
 * Specialized error boundary for form components with recovery options
 */
export function FormErrorBoundary({
  children,
  context,
  onError,
  onRetry,
  onSavePartial,
  formData,
  fallback
}: FormErrorBoundaryProps) {
  
  const getFormContextInfo = () => {
    switch (context) {
      case 'profile-setup':
        return {
          title: 'Profile Setup Error',
          description: 'There was an issue with your profile setup. Your progress may have been saved.',
          suggestions: [
            'Try continuing with the next step',
            'Refresh the page to reload your progress',
            'Save your current progress before retrying',
            'Contact support if you lose important data'
          ],
          showSavePartial: true
        };
        
      case 'course-planning':
        return {
          title: 'Course Planning Error',
          description: 'An error occurred while planning your courses. Your semester data should be preserved.',
          suggestions: [
            'Try refreshing the page',
            'Check if your courses are still saved',
            'Try planning one course at a time',
            'Switch to a different semester and back'
          ],
          showSavePartial: true
        };
        
      case 'requirements':
        return {
          title: 'Requirements Error',
          description: 'There was a problem loading or updating your degree requirements.',
          suggestions: [
            'Verify your major is correctly set',
            'Try refreshing the requirements data',
            'Check your course completion status',
            'Contact your advisor if requirements look incorrect'
          ],
          showSavePartial: false
        };
        
      default:
        return {
          title: 'Form Error',
          description: 'There was an error with this form. Your data may have been partially saved.',
          suggestions: [
            'Try refreshing the page',
            'Check if your data was saved',
            'Try submitting again',
            'Contact support if the issue persists'
          ],
          showSavePartial: true
        };
    }
  };

  const handleFormError = (error: Error) => {
    console.error(`FormErrorBoundary [${context}]:`, error);
    
    // Log form-specific error data
    if (formData) {
      console.error('Form data at error:', formData);
    }
    
    // Call custom error handler
    if (onError) {
      onError(error);
    }

    // In production, report form errors with context
    if (process.env.NODE_ENV === 'production') {
      // reportToMonitoringService(error, {
      //   type: 'form-error',
      //   context,
      //   formData: formData ? Object.keys(formData) : undefined
      // });
    }
  };

  const FormErrorFallback = ({ error, resetBoundary }: { error: Error; resetBoundary: () => void }) => {
    const { title, description, suggestions, showSavePartial } = getFormContextInfo();

    return (
      <div className="min-h-96 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </CardTitle>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Debug:</strong> {error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Data Preservation Info */}
            {formData && Object.keys(formData).length > 0 && (
              <Alert>
                <Save className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your form data has been preserved and can be recovered.
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">What you can try:</h4>
              <ul className="space-y-1 text-xs text-blue-700">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 text-xs">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  resetBoundary();
                  if (onRetry) onRetry();
                }}
                className="flex-1 bg-[#003057] hover:bg-[#002041] text-white text-sm"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Try Again
              </Button>
              
              {showSavePartial && onSavePartial && (
                <Button
                  onClick={onSavePartial}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <Save className="h-3 w-3 mr-2" />
                  Save Progress
                </Button>
              )}
            </div>

            {/* Data Recovery Info */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you continue to have issues, try refreshing the page or contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (fallback) {
    return (
      <AsyncErrorBoundary 
        context={context as any} 
        onError={handleFormError}
        fallback={fallback}
      >
        {children}
      </AsyncErrorBoundary>
    );
  }

  return (
    <AsyncErrorBoundary 
      context={context as any} 
      onError={handleFormError}
      fallback={<FormErrorFallback error={new Error('Form error')} resetBoundary={() => {}} />}
    >
      {children}
    </AsyncErrorBoundary>
  );
}

// Hook for form error handling
export function useFormErrorHandler(context: string, formData?: any) {
  const handleFormError = (error: unknown) => {
    console.error(`Form error in ${context}:`, error);
    
    if (formData) {
      console.error('Form state at error:', formData);
      
      // Save form data to localStorage for recovery
      try {
        localStorage.setItem(`form-recovery-${context}`, JSON.stringify({
          data: formData,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        }));
      } catch (storageError) {
        console.error('Failed to save form recovery data:', storageError);
      }
    }
    
    return error;
  };

  const recoverFormData = () => {
    try {
      const recoveryData = localStorage.getItem(`form-recovery-${context}`);
      if (recoveryData) {
        const parsed = JSON.parse(recoveryData);
        const timestamp = new Date(parsed.timestamp);
        const now = new Date();
        
        // Only recover data from the last hour
        if (now.getTime() - timestamp.getTime() < 60 * 60 * 1000) {
          return parsed.data;
        } else {
          localStorage.removeItem(`form-recovery-${context}`);
        }
      }
    } catch (error) {
      console.error('Failed to recover form data:', error);
    }
    return null;
  };

  const clearRecoveryData = () => {
    try {
      localStorage.removeItem(`form-recovery-${context}`);
    } catch (error) {
      console.error('Failed to clear recovery data:', error);
    }
  };

  return {
    handleFormError,
    recoverFormData,
    clearRecoveryData
  };
}