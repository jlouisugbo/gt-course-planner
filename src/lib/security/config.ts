/**
 * PRODUCTION SECURITY CONFIGURATION
 * 
 * This module provides environment-specific security configurations
 * for production deployment with proper FERPA compliance.
 */

// Environment detection
export const ENV = {
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test'
};

// Security headers for production
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy for privacy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy (basic - should be customized)
  'Content-Security-Policy': ENV.isProd 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.supabase.co; connect-src 'self' *.supabase.co wss://*.supabase.co;"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval' *;",
  
  // Strict Transport Security (HTTPS only)
  ...(ENV.isProd && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// CORS configuration
export const CORS_CONFIG = {
  origin: ENV.isProd 
    ? ['https://your-domain.com'] // Replace with actual production domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Rate limiting configuration
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: ENV.isProd ? 5 : 100, // 5 attempts per 15 min in prod
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // API endpoints
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: ENV.isProd ? 100 : 1000, // 100 requests per minute in prod
    message: 'Rate limit exceeded. Please wait before making more requests.'
  },
  
  // Academic data endpoints (more restrictive)
  ACADEMIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: ENV.isProd ? 50 : 500, // 50 requests per minute in prod
    message: 'Academic data rate limit exceeded. Please wait before accessing more data.'
  },
  
  // Admin endpoints
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: ENV.isProd ? 20 : 100, // 20 requests per minute in prod
    message: 'Admin rate limit exceeded. Please wait before making more requests.'
  }
};

// Logging configuration
export const LOGGING_CONFIG = {
  // Minimum log level by environment
  minLevel: ENV.isProd ? 'WARN' : ENV.isTest ? 'ERROR' : 'DEBUG',
  
  // Whether to include stack traces
  includeStackTrace: !ENV.isProd,
  
  // Whether to sanitize sensitive data
  sanitizeSensitiveData: true,
  
  // Maximum log message length
  maxMessageLength: ENV.isProd ? 500 : 2000,
  
  // Academic data logging (FERPA compliance)
  academic: {
    logAccess: true,
    logDataChanges: true,
    logQueries: false, // Never log actual queries with data
    maxRetentionDays: 2555 // 7 years for FERPA compliance
  },
  
  // Error reporting
  errorReporting: {
    enabled: ENV.isProd,
    includeSensitiveData: false,
    includeUserData: false,
    includeStackTraces: false
  }
};

// Database security configuration
export const DATABASE_CONFIG = {
  // Connection settings
  connection: {
    maxConnections: ENV.isProd ? 10 : 5,
    connectionTimeout: 10000, // 10 seconds
    idleTimeout: 300000, // 5 minutes
    ssl: ENV.isProd
  },
  
  // Query security
  query: {
    maxQueryTime: 30000, // 30 seconds
    sanitizeInputs: true,
    validateSchemas: true,
    logSlowQueries: ENV.isProd
  },
  
  // Row Level Security
  rls: {
    enforceRLS: true,
    validatePolicies: ENV.isProd,
    logViolations: true
  }
};

// Session management
export const SESSION_CONFIG = {
  // Session timeouts
  maxAge: ENV.isProd ? 24 * 60 * 60 : 7 * 24 * 60 * 60, // 1 day prod, 1 week dev
  inactivityTimeout: ENV.isProd ? 2 * 60 * 60 : 8 * 60 * 60, // 2 hours prod, 8 hours dev
  
  // Session security
  secure: ENV.isProd, // HTTPS only in production
  httpOnly: true, // Prevent XSS
  sameSite: 'strict' as const, // CSRF protection
  
  // Session validation
  validateIP: ENV.isProd,
  validateUserAgent: ENV.isProd,
  rotateTokens: ENV.isProd
};

// Error handling configuration
export const ERROR_CONFIG = {
  // Error response format
  response: {
    includeStackTrace: !ENV.isProd,
    includeInternalDetails: !ENV.isProd,
    sanitizeErrorMessages: ENV.isProd,
    maxErrorMessageLength: ENV.isProd ? 200 : 1000
  },
  
  // Error monitoring
  monitoring: {
    enabled: ENV.isProd,
    sampleRate: ENV.isProd ? 0.1 : 1.0, // 10% sampling in prod
    ignoreErrors: [
      'Network Error',
      'ChunkLoadError',
      'Loading chunk failed'
    ]
  },
  
  // Error recovery
  recovery: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    enableErrorBoundaries: true
  }
};

// Security monitoring
export const MONITORING_CONFIG = {
  // Suspicious activity detection
  suspicious: {
    enabled: ENV.isProd,
    maxFailedLogins: 5,
    maxRequestsPerMinute: 200,
    trackUserAgents: true,
    trackIPAddresses: true
  },
  
  // Alerting thresholds
  alerts: {
    criticalErrors: 10, // per hour
    authFailures: 20, // per hour
    rateLimitHits: 50, // per hour
    databaseErrors: 5 // per hour
  },
  
  // Audit logging
  audit: {
    logAllAuthentication: true,
    logDataAccess: true,
    logPrivilegedOperations: true,
    logFailedAttempts: true,
    retentionPeriod: 2555 // days (7 years for FERPA)
  }
};

// FERPA compliance settings
export const FERPA_CONFIG = {
  // Data classification
  sensitiveFields: [
    'email', 'full_name', 'gt_username', 'phone', 'address',
    'grade', 'gpa', 'credits', 'transcript', 'academic_standing',
    'disciplinary_records', 'financial_aid', 'parent_info'
  ],
  
  // Access logging
  accessLogging: {
    enabled: true,
    logLevel: 'INFO',
    includeTimestamp: true,
    includeUserAgent: false, // Don't log user agents for privacy
    includeIPAddress: false, // Don't log IP addresses for privacy
    retentionPeriod: 2555 // days
  },
  
  // Data handling
  dataHandling: {
    encryptSensitiveData: ENV.isProd,
    maskDataInLogs: true,
    requireConsentForCollection: true,
    requireJustificationForAccess: ENV.isProd
  },
  
  // Directory information (can be disclosed without consent)
  directoryInfo: [
    'full_name', 'major', 'degree_program', 'graduation_year',
    'academic_honors', 'enrollment_status'
  ]
};

// Export utility functions
export const getSecurityHeaders = (): Record<string, string> => {
  return { ...SECURITY_HEADERS };
};

export const isProductionEnvironment = (): boolean => {
  return ENV.isProd;
};

export const shouldLogSensitiveData = (): boolean => {
  return !ENV.isProd && process.env.LOG_SENSITIVE_DATA === 'true';
};

export const getMaxRetries = (): number => {
  return ERROR_CONFIG.recovery.maxRetries;
};

export const getFERPARetentionPeriod = (): number => {
  return FERPA_CONFIG.accessLogging.retentionPeriod;
};