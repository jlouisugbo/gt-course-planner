import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { authenticateRequest } from '@/lib/auth-server';
import { createAPILogger } from './logger';
import { createSecureErrorHandler } from './errorHandler';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface SecurityConfig {
    requireAuth?: boolean;
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
    validationSchema?: {
        body?: ZodSchema<any>;
        query?: ZodSchema<any>;
        params?: ZodSchema<any>;
    };
    allowedMethods?: string[];
    corsEnabled?: boolean;
}

interface SecureRequestContext {
    user?: any;
    validatedData?: {
        body?: any;
        query?: any;
        params?: any;
    };
}

export class SecurityError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400,
        public code?: string
    ) {
        super(message);
        this.name = 'SecurityError';
    }
}

/**
 * Comprehensive security middleware for API routes
 */
export async function securityMiddleware(
    request: NextRequest,
    config: SecurityConfig = {}
): Promise<{ context: SecureRequestContext; error?: NextResponse }> {
    try {
        const context: SecureRequestContext = {};

        // Check HTTP method
        if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
            return {
                context,
                error: NextResponse.json(
                    { error: `Method ${request.method} not allowed` },
                    { status: 405 }
                )
            };
        }

        // Rate limiting
        if (config.rateLimit) {
            const rateLimitError = await checkRateLimit(request, config.rateLimit);
            if (rateLimitError) {
                return { context, error: rateLimitError };
            }
        }

        // Authentication
        if (config.requireAuth !== false) { // Default to requiring auth
            const { user, error: authError } = await authenticateRequest(request);
            
            if (!user || authError) {
                const logger = createAPILogger(request.url, request.method);
                logger.warn('Authentication failed', { error: authError });
                return {
                    context,
                    error: NextResponse.json(
                        { error: 'Authentication required' },
                        { status: 401 }
                    )
                };
            }
            context.user = user;
        }

        // Input validation
        if (config.validationSchema) {
            const validationResult = await validateRequest(request, config.validationSchema);
            if (validationResult.error) {
                return { context, error: validationResult.error };
            }
            context.validatedData = validationResult.data;
        }

        return { context };

    } catch (error) {
        const logger = createAPILogger(request.url, request.method);
        logger.error('Security middleware error', error);
        return {
            context: {},
            error: NextResponse.json(
                { error: 'Security validation failed' },
                { status: 500 }
            )
        };
    }
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
    request: NextRequest,
    config: { windowMs: number; maxRequests: number }
): Promise<NextResponse | null> {
    const identifier = getClientIdentifier(request);
    const now = Date.now();

    // Clean up old entries
    for (const [key, data] of rateLimitStore.entries()) {
        if (data.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }

    const current = rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < now) {
        // First request in window or window expired
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return null;
    }

    if (current.count >= config.maxRequests) {
        const logger = createAPILogger(request.url, request.method);
        logger.warn('Rate limit exceeded', { 
            identifier: identifier.substring(0, 8) + '***', // Partially hide IP
            attempts: current.count,
            limit: config.maxRequests
        });
        return NextResponse.json(
            { 
                error: 'Too many requests',
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            },
            { 
                status: 429,
                headers: {
                    'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, config.maxRequests - current.count).toString(),
                    'X-RateLimit-Reset': current.resetTime.toString()
                }
            }
        );
    }

    // Increment counter
    current.count++;
    return null;
}

/**
 * Request validation using Zod schemas
 */
async function validateRequest(
    request: NextRequest,
    schemas: { body?: ZodSchema<any>; query?: ZodSchema<any>; params?: ZodSchema<any> }
): Promise<{ data?: any; error?: NextResponse }> {
    const validatedData: any = {};

    try {
        // Validate request body
        if (schemas.body) {
            let body;
            try {
                body = await request.json();
            } catch {
                return {
                    error: NextResponse.json(
                        { error: 'Invalid JSON in request body' },
                        { status: 400 }
                    )
                };
            }
            validatedData.body = schemas.body.parse(body);
        }

        // Validate query parameters
        if (schemas.query) {
            const url = new URL(request.url);
            const queryObject = Object.fromEntries(url.searchParams.entries());
            validatedData.query = schemas.query.parse(queryObject);
        }

        // Validate route parameters
        if (schemas.params) {
            // Extract params from URL path - this would need specific implementation
            // based on your routing structure
            validatedData.params = schemas.params.parse({});
        }

        return { data: validatedData };

    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            }));

            const logger = createAPILogger(request.url, request.method);
            logger.warn('Request validation failed', { errors: formattedErrors });
            
            return {
                error: NextResponse.json(
                    {
                        error: 'Validation failed',
                        details: formattedErrors
                    },
                    { status: 400 }
                )
            };
        }

        const logger = createAPILogger(request.url, request.method);
        logger.error('Unexpected validation error', error);
        return {
            error: NextResponse.json(
                { error: 'Validation failed' },
                { status: 400 }
            )
        };
    }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
    // Try to get user ID from auth headers first
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        // This would need to be implemented to extract user ID from token
        // For now, we'll use IP as fallback
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    return ip;
}

/**
 * Sanitize database query inputs to prevent SQL injection
 */
export function sanitizeDbInput(input: any): any {
    if (typeof input === 'string') {
        // Remove potentially dangerous characters
        return input.replace(/['";\\]/g, '').trim();
    }
    
    if (Array.isArray(input)) {
        return input.map(sanitizeDbInput);
    }
    
    if (typeof input === 'object' && input !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[sanitizeDbInput(key)] = sanitizeDbInput(value);
        }
        return sanitized;
    }
    
    return input;
}

/**
 * Safe array for Supabase queries - prevents SQL injection in array operations
 */
export function createSafeArray(arr: any[]): number[] | string[] {
    if (!Array.isArray(arr) || arr.length === 0) {
        return [];
    }
    
    // Type check and sanitize array elements
    const sanitized = arr.map(item => {
        if (typeof item === 'number') {
            return Number.isFinite(item) ? item : 0;
        }
        if (typeof item === 'string') {
            return sanitizeDbInput(item);
        }
        return null;
    }).filter(item => item !== null);
    
    return sanitized;
}

/**
 * Helper function to create secured API routes
 */
export function createSecureRoute(
    handler: (request: NextRequest, context: SecureRequestContext) => Promise<NextResponse>,
    config: SecurityConfig = {}
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { context, error } = await securityMiddleware(request, config);
        
        if (error) {
            return error;
        }

        const errorHandler = createSecureErrorHandler(
            new URL(request.url).pathname,
            request.method,
            context.user?.id
        );

        try {
            const result = await handler(request, context);
            
            // Log successful API access for FERPA compliance if accessing academic data
            if (context.user && isAcademicEndpoint(new URL(request.url).pathname)) {
                errorHandler.logAcademicAccess('access', getDataTypeFromEndpoint(new URL(request.url).pathname));
            }
            
            return result;
        } catch (err) {
            return errorHandler.handleError(err);
        }
    };
}

// Common security configurations
export const SECURITY_CONFIGS = {
    // High-security endpoints (user data modification)
    HIGH_SECURITY: {
        requireAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    } as SecurityConfig,
    
    // Medium-security endpoints (data queries)
    MEDIUM_SECURITY: {
        requireAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
        allowedMethods: ['GET', 'POST']
    } as SecurityConfig,
    
    // Low-security endpoints (public data)
    LOW_SECURITY: {
        requireAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 300 }, // 300 requests per minute
        allowedMethods: ['GET']
    } as SecurityConfig,
    
    // Admin-only endpoints
    ADMIN_SECURITY: {
        requireAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 }, // 50 requests per minute
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
    } as SecurityConfig
};

/**
 * Helper function to determine if endpoint accesses academic data
 */
function isAcademicEndpoint(pathname: string): boolean {
    const academicEndpoints = [
        '/api/user-profile',
        '/api/course-completions',
        '/api/requirements',
        '/api/analytics',
        '/api/semesters'
    ];
    
    return academicEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Helper function to determine data type from endpoint
 */
function getDataTypeFromEndpoint(pathname: string): string {
    if (pathname.startsWith('/api/user-profile')) return 'user_profile';
    if (pathname.startsWith('/api/course-completions')) return 'course_completions';
    if (pathname.startsWith('/api/requirements')) return 'degree_requirements';
    if (pathname.startsWith('/api/analytics')) return 'usage_analytics';
    if (pathname.startsWith('/api/semesters')) return 'semester_planning';
    return 'academic_data';
}