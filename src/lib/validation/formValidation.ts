/**
 * Standardized Form Validation Utility
 * Provides consistent validation patterns and error handling across the application
 */

import { useCallback, useRef } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  [key: string]: FieldState;
}

/**
 * Validates a single field value against its rule
 */
export const validateField = (value: any, rule: ValidationRule, fieldName: string): string | null => {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} must be no more than ${rule.maxLength} characters`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldName} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `${fieldName} must be no more than ${rule.max}`;
    }
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
};

/**
 * Validates multiple fields against a schema
 */
export const validateForm = (data: Record<string, any>, schema: ValidationSchema): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(schema).forEach(fieldName => {
    const value = data[fieldName];
    const rule = schema[fieldName];
    const error = validateField(value, rule, fieldName);
    
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

/**
 * Standard GT ID validation
 */
export const validateGTID = (value: any): string | null => {
  if (!value) return null;
  const gtId = value.toString();
  if (!/^\d{9}$/.test(gtId)) {
    return 'GT ID must be exactly 9 digits';
  }
  if (!gtId.startsWith('90')) {
    return 'GT ID must start with 90';
  }
  return null;
};

/**
 * Standard email validation (Georgia Tech specific)
 */
export const validateGTEmail = (value: string): string | null => {
  if (!value) return null;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(value)) {
    return 'Please enter a valid email address';
  }
  if (!value.toLowerCase().includes('gatech.edu')) {
    return 'Please use your Georgia Tech email address';
  }
  return null;
};

/**
 * GPA validation
 */
export const validateGPA = (value: number): string | null => {
  if (value < 0) return 'GPA cannot be negative';
  if (value > 4.0) return 'GPA cannot be greater than 4.0';
  return null;
};

/**
 * Profile Setup Validation Schemas
 */
export const profileValidationSchemas = {
  info: {
    name: { 
      required: true, 
      minLength: 2, 
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]+$/
    },
    email: { 
      required: true, 
      custom: validateGTEmail 
    },
    gtId: { 
      required: true, 
      custom: validateGTID 
    }
  },
  academic: {
    major: { 
      required: true 
    },
    startDate: { 
      required: true 
    },
    expectedGraduation: { 
      required: true 
    }
  },
  record: {
    startDate: { 
      required: true 
    },
    expectedGraduation: { 
      required: true 
    },
    currentGPA: { 
      min: 0, 
      max: 4.0, 
      custom: validateGPA 
    },
    totalCreditsEarned: { 
      min: 0, 
      max: 200 
    },
    transferCredits: { 
      min: 0, 
      max: 126 
    }
  }
};

/**
 * Form error announcement for screen readers
 */
export const announceFormErrors = (errors: ValidationErrors) => {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) return;

  const message = errorCount === 1 
    ? 'There is 1 error in the form' 
    : `There are ${errorCount} errors in the form`;

  // Use ARIA live region for screen reader announcement
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};

/**
 * Hook for real-time field validation
 */
export const useFieldValidation = (initialValue: any, rule: ValidationRule, fieldName: string) => {
  const valueRef = useRef(initialValue);
  const errorRef = useRef<string | null>(null);
  const touchedRef = useRef(false);

  const validate = useCallback((value: any) => {
    valueRef.current = value;
    errorRef.current = validateField(value, rule, fieldName);
    return errorRef.current;
  }, [rule, fieldName]);

  const markTouched = useCallback(() => {
    touchedRef.current = true;
  }, []);

  return {
    value: valueRef.current,
    error: errorRef.current,
    touched: touchedRef.current,
    validate,
    markTouched
  };
};

/**
 * Debounced validation for real-time feedback
 */
export const useDebounceValidation = (
  value: any,
  rule: ValidationRule,
  fieldName: string,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorRef = useRef<string | null>(null);

  const debouncedValidate = useCallback((currentValue: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      errorRef.current = validateField(currentValue, rule, fieldName);
    }, delay);

    return errorRef.current;
  }, [rule, fieldName, delay]);

  return {
    error: errorRef.current,
    debouncedValidate
  };
};