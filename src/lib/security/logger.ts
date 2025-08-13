/**
 * PRODUCTION-SAFE LOGGING SYSTEM
 * 
 * This module provides FERPA-compliant, security-focused logging that:
 * - Never logs sensitive data in production
 * - Sanitizes academic information
 * - Provides structured logging with appropriate levels
 * - Implements secure error reporting
 */

// Environment detection
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Sensitive data patterns that should never be logged
const SENSITIVE_PATTERNS = [
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // GT usernames (format: gburdell3, username followed by numbers)
  /\b[a-z]+\d+@gatech\.edu\b/g,
  // Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Student IDs (9 digit format common in universities)
  /\b\d{9}\b/g,
  // Authorization tokens
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
  // API keys
  /api[_-]?key[:\s=]+[a-zA-Z0-9\-._~+/=]+/gi,
  // Database connection strings
  /postgresql:\/\/[^@]+@[^\/]+\/\w+/gi
];

// Academic data that requires special handling for FERPA compliance
const ACADEMIC_DATA_KEYS = [
  'grade', 'grades', 'gpa', 'credits', 'transcript', 'semester_gpa', 'overall_gpa',
  'completed_courses', 'course_completions', 'academic_standing', 'degree_progress',
  'transfer_credits', 'current_gpa', 'total_credits_earned'
];

// User identification that should be sanitized
const USER_IDENTIFICATION_KEYS = [
  'email', 'full_name', 'gt_username', 'phone', 'address', 'emergency_contact',
  'parent_email', 'guardian_info', 'personal_info'
];

interface LogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  userAgent?: string;
  timestamp?: string;
  component?: string;
  action?: string;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: any;
  timestamp: string;
  environment: string;
  sanitized: boolean;
}

/**
 * Sanitize sensitive data from any input
 */
function sanitizeSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    let sanitized = data;
    
    // Replace sensitive patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeSensitiveData);
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Check if this is academic data that needs special handling
      if (ACADEMIC_DATA_KEYS.some(acadKey => lowerKey.includes(acadKey))) {
        if (isProd) {
          sanitized[key] = '[ACADEMIC_DATA_REDACTED_FOR_FERPA]';
        } else {
          sanitized[key] = sanitizeSensitiveData(value);
        }
        continue;
      }
      
      // Check if this is user identification data
      if (USER_IDENTIFICATION_KEYS.some(userKey => lowerKey.includes(userKey))) {
        if (isProd) {
          sanitized[key] = '[USER_DATA_REDACTED]';
        } else {
          // Even in dev, partially sanitize emails and names
          sanitized[key] = partialSanitize(value);
        }
        continue;
      }
      
      // Standard sanitization for nested objects
      sanitized[key] = sanitizeSensitiveData(value);
    }
    
    return sanitized;
  }

  return data;
}

/**
 * Partial sanitization for development environments
 */
function partialSanitize(value: any): any {
  if (typeof value === 'string') {
    // Partially hide emails: j***@gatech.edu
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local.charAt(0)}***@${domain}`;
    }
    
    // Partially hide names: John D***
    if (value.includes(' ')) {
      const parts = value.split(' ');
      return `${parts[0]} ${parts[1]?.charAt(0)}***`;
    }
    
    // Partially hide single names: J***
    if (value.length > 2) {
      return `${value.charAt(0)}***`;
    }
  }
  
  return value;
}

/**
 * Get current minimum log level based on environment
 */
function getMinLogLevel(): LogLevel {
  if (isProd) return LogLevel.WARN;
  if (isTest) return LogLevel.ERROR;
  return LogLevel.DEBUG;
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  data?: any,
  error?: any
): LogEntry {
  const sanitizedData = sanitizeSensitiveData(data);
  const sanitizedContext = sanitizeSensitiveData(context);
  
  return {
    level,
    message: sanitizeSensitiveData(message),
    context: sanitizedContext,
    data: sanitizedData,
    error: error ? sanitizeError(error) : undefined,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    sanitized: true
  };
}

/**
 * Sanitize error objects to prevent information disclosure
 */
function sanitizeError(error: any): any {
  if (!error) return error;
  
  const sanitized: any = {
    name: error.name,
    message: sanitizeSensitiveData(error.message)
  };
  
  // In production, never include stack traces
  if (!isProd && error.stack) {
    sanitized.stack = error.stack;
  }
  
  // Include error code if available
  if (error.code) {
    sanitized.code = error.code;
  }
  
  // Include status code for HTTP errors
  if (error.status || error.statusCode) {
    sanitized.status = error.status || error.statusCode;
  }
  
  return sanitized;
}

/**
 * Output log entry to appropriate destination
 */
function outputLog(entry: LogEntry): void {
  const minLevel = getMinLogLevel();
  
  if (entry.level < minLevel) {
    return; // Skip logs below minimum level
  }
  
  const logMethod = getLogMethod(entry.level);
  
  if (isProd) {
    // In production, use structured logging
    logMethod(JSON.stringify({
      level: LogLevel[entry.level],
      message: entry.message,
      timestamp: entry.timestamp,
      context: entry.context,
      ...(entry.error && { error: entry.error })
    }));
  } else {
    // In development, use readable logging
    const prefix = `[${LogLevel[entry.level]}] ${entry.timestamp}`;
    const contextInfo = entry.context ? ` [${entry.context.component || 'UNKNOWN'}]` : '';
    
    logMethod(`${prefix}${contextInfo} ${entry.message}`);
    
    if (entry.data) {
      console.log('Data:', entry.data);
    }
    
    if (entry.error) {
      console.error('Error details:', entry.error);
    }
  }
}

/**
 * Get appropriate console method for log level
 */
function getLogMethod(level: LogLevel): (message: string, ...args: any[]) => void {
  switch (level) {
    case LogLevel.DEBUG:
    case LogLevel.INFO:
      return console.log;
    case LogLevel.WARN:
      return console.warn;
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      return console.error;
    default:
      return console.log;
  }
}

/**
 * Main logger class
 */
export class SecureLogger {
  private context: LogContext;
  
  constructor(context: Partial<LogContext> = {}) {
    this.context = {
      timestamp: new Date().toISOString(),
      ...context
    };
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): SecureLogger {
    return new SecureLogger({
      ...this.context,
      ...additionalContext
    });
  }
  
  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: any): void {
    const entry = createLogEntry(LogLevel.DEBUG, message, this.context, data);
    outputLog(entry);
  }
  
  /**
   * Log informational messages
   */
  info(message: string, data?: any): void {
    const entry = createLogEntry(LogLevel.INFO, message, this.context, data);
    outputLog(entry);
  }
  
  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    const entry = createLogEntry(LogLevel.WARN, message, this.context, data);
    outputLog(entry);
  }
  
  /**
   * Log error messages
   */
  error(message: string, error?: any, data?: any): void {
    const entry = createLogEntry(LogLevel.ERROR, message, this.context, data, error);
    outputLog(entry);
    
    // In production, also report to monitoring service
    if (isProd) {
      this.reportToMonitoring(entry);
    }
  }
  
  /**
   * Log critical errors
   */
  critical(message: string, error?: any, data?: any): void {
    const entry = createLogEntry(LogLevel.CRITICAL, message, this.context, data, error);
    outputLog(entry);
    
    // Always report critical errors to monitoring
    this.reportToMonitoring(entry);
  }
  
  /**
   * Log FERPA-compliant academic data access
   */
  academicAccess(action: string, userId: string, dataType: string): void {
    const message = `Academic data access: ${action} - ${dataType}`;
    const context = {
      ...this.context,
      userId: isProd ? '[USER_ID_REDACTED]' : partialSanitize(userId),
      action,
      dataType
    };
    
    const entry = createLogEntry(LogLevel.INFO, message, context);
    outputLog(entry);
  }
  
  /**
   * Log security events
   */
  security(event: string, details?: any): void {
    const message = `Security event: ${event}`;
    const sanitizedDetails = sanitizeSensitiveData(details);
    
    const entry = createLogEntry(LogLevel.WARN, message, this.context, sanitizedDetails);
    outputLog(entry);
    
    // Always report security events to monitoring
    this.reportToMonitoring(entry);
  }
  
  /**
   * Report to monitoring service (placeholder for production integration)
   */
  private reportToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
    if (isDev) {
      console.group('🔒 Would report to monitoring service:');
      console.log('Entry:', entry);
      console.groupEnd();
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new SecureLogger({
  component: 'GT_COURSE_PLANNER'
});

/**
 * Create a logger for a specific component
 */
export function createComponentLogger(component: string, additionalContext?: Partial<LogContext>): SecureLogger {
  return new SecureLogger({
    component,
    ...additionalContext
  });
}

/**
 * Create a logger for API routes
 */
export function createAPILogger(endpoint: string, method: string, userId?: string): SecureLogger {
  return new SecureLogger({
    component: 'API',
    endpoint,
    method,
    userId: isProd ? '[USER_REDACTED]' : userId
  });
}

/**
 * Legacy console replacement for gradual migration
 */
export const secureConsole = {
  log: (message: string, ...args: any[]) => {
    if (!isProd) {
      console.log(message, ...args.map(sanitizeSensitiveData));
    }
  },
  
  error: (message: string, ...args: any[]) => {
    logger.error(message, args.length > 0 ? args[0] : undefined, args.slice(1));
  },
  
  warn: (message: string, ...args: any[]) => {
    logger.warn(message, args);
  },
  
  info: (message: string, ...args: any[]) => {
    logger.info(message, args);
  }
};

// Export utilities for testing and advanced usage
export {
  sanitizeSensitiveData,
  sanitizeError
};