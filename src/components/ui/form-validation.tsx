/**
 * Standardized Form Validation Components
 * Provides consistent error display and accessibility features
 */

"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn("flex items-center gap-1 text-red-600 text-sm", className)}
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span>{error}</span>
      </motion.div>
    </AnimatePresence>
  );
};

interface FormSuccessProps {
  message?: string | null;
  show?: boolean;
  className?: string;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({ message, show, className }) => {
  if (!show || !message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn("flex items-center gap-1 text-green-600 text-sm", className)}
        role="alert"
        aria-live="polite"
      >
        <CheckCircle className="h-3 w-3 flex-shrink-0" />
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
};

interface ValidatedInputWrapperProps {
  children: React.ReactNode;
  error?: string | null;
  touched?: boolean;
  success?: boolean;
  className?: string;
}

export const ValidatedInputWrapper: React.FC<ValidatedInputWrapperProps> = ({
  children,
  error,
  touched,
  success,
  className
}) => {
  const hasError = touched && error;
  const hasSuccess = touched && !error && success;

  return (
    <div className={cn("space-y-2", className)}>
      {children}
      <FormError error={hasError ? error : null} />
      <FormSuccess show={hasSuccess} message="Valid" />
    </div>
  );
};

interface FormLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FormLoadingSpinner: React.FC<FormLoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-b-2 border-[#B3A369]",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

interface FormSubmitStateProps {
  isSubmitting?: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const FormSubmitState: React.FC<FormSubmitStateProps> = ({
  isSubmitting,
  children,
  loadingText = "Please wait...",
  className
}) => {
  if (isSubmitting) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <FormLoadingSpinner size="sm" />
        <span className="text-muted-foreground">{loadingText}</span>
      </div>
    );
  }

  return <>{children}</>;
};

interface ValidationSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  className 
}) => {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-md border border-red-200 bg-red-50/50",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <h4 className="text-sm font-medium text-red-800">
          {errorCount === 1 ? 'Please fix this error:' : `Please fix these ${errorCount} errors:`}
        </h4>
      </div>
      <ul className="text-sm text-red-700 space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>• {error}</li>
        ))}
      </ul>
    </motion.div>
  );
};

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 h-4 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
};