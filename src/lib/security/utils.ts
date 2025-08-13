import { NextRequest } from 'next/server';

/**
 * Security utility functions
 */

// HTML sanitization - removes script tags and dangerous attributes
export function sanitizeHtml(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/<meta[^>]*>/gi, '');
}

// Basic string sanitization - removes potentially dangerous characters
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>'"&]/g, '')
        .replace(/\x00/g, ''); // Remove null bytes
}

// SQL injection protection - validates and escapes input
export function sanitizeSqlInput(input: string): string {
    return input
        .replace(/['";\\]/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .replace(/xp_/gi, '')
        .replace(/sp_/gi, '')
        .trim();
}

// Course code validation and normalization
export function normalizeCourseCode(code: string): string {
    return code
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/[^A-Z0-9\s]/g, ''); // Remove special characters
}

// Email validation and normalization
export function normalizeEmail(email: string): string {
    return email
        .trim()
        .toLowerCase()
        .replace(/[<>'"]/g, '');
}

// GT username validation
export function validateGTUsername(username: string): boolean {
    const gtUsernamePattern = /^[a-zA-Z][a-zA-Z0-9]*\d+$/;
    return gtUsernamePattern.test(username.trim());
}

// Semester validation
export function validateSemester(semester: string): boolean {
    const semesterPattern = /^(Fall|Spring|Summer)\s\d{4}$/;
    return semesterPattern.test(semester.trim());
}

// Grade validation
export function validateGrade(grade: string): boolean {
    const gradePattern = /^[ABCDF]$|^[WSUIP]$/;
    return gradePattern.test(grade.toUpperCase().trim());
}

// Safe array creation for database queries
export function createSafeNumberArray(input: any[]): number[] {
    if (!Array.isArray(input)) return [];
    
    return input
        .filter(item => typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item)))
        .map(item => typeof item === 'string' ? parseInt(item, 10) : item)
        .filter(num => Number.isFinite(num) && num > 0 && num <= 2147483647)
        .slice(0, 1000); // Limit array size to prevent memory issues
}

export function createSafeStringArray(input: any[]): string[] {
    if (!Array.isArray(input)) return [];
    
    return input
        .filter(item => typeof item === 'string')
        .map(item => sanitizeString(item))
        .filter(str => str.length > 0 && str.length <= 100)
        .slice(0, 100); // Limit array size
}

// Input size validation
export function validateInputSize(input: string, maxSize: number = 10000): boolean {
    return typeof input === 'string' && input.length <= maxSize;
}

// JSON size validation
export function validateJsonSize(obj: any, maxSize: number = 50000): boolean {
    try {
        const jsonString = JSON.stringify(obj);
        return jsonString.length <= maxSize;
    } catch {
        return false;
    }
}

// Rate limiting helpers
export interface RateLimitInfo {
    count: number;
    resetTime: number;
    blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

export function checkRateLimit(
    identifier: string, 
    windowMs: number, 
    maxRequests: number
): RateLimitInfo {
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, info] of rateLimitStore.entries()) {
        if (info.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
    
    let info = rateLimitStore.get(identifier);
    
    if (!info || info.resetTime < now) {
        // First request or window expired
        info = {
            count: 1,
            resetTime: now + windowMs,
            blocked: false
        };
    } else {
        info.count++;
    }
    
    info.blocked = info.count > maxRequests;
    rateLimitStore.set(identifier, info);
    
    return info;
}

export function getRateLimitIdentifier(request: NextRequest): string {
    // Try to get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    // Optionally include user agent for more specific limiting
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const shortUA = userAgent.substring(0, 50); // Truncate user agent
    
    return `${ip}:${shortUA}`;
}

// Security headers helper
export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
}

// Content Security Policy header
export function getCSPHeader(): string {
    return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.supabase.co https://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; ');
}

// Log security events
export interface SecurityEvent {
    type: 'rate_limit' | 'validation_error' | 'auth_failure' | 'suspicious_input';
    identifier: string;
    details?: any;
    timestamp: string;
    userAgent?: string;
    ip?: string;
}

const securityEventStore: SecurityEvent[] = [];

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString()
    };
    
    securityEventStore.push(securityEvent);
    
    // Keep only last 1000 events
    if (securityEventStore.length > 1000) {
        securityEventStore.shift();
    }
    
    // Log critical events
    if (event.type === 'suspicious_input' || event.type === 'auth_failure') {
        console.warn('Security Event:', securityEvent);
    }
}

export function getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return securityEventStore.slice(-limit);
}

// Password strength validation (for future use)
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
} {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score++;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Password should contain lowercase letters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Password should contain uppercase letters');
    
    if (/\d/.test(password)) score++;
    else feedback.push('Password should contain numbers');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('Password should contain special characters');
    
    return {
        isValid: score >= 4,
        score,
        feedback
    };
}

// Data encryption helpers (for sensitive data)
export function hashSensitiveData(data: string): string {
    // Simple hash for client-side data (not for passwords!)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

// Validate file uploads (for future use)
export function validateFileUpload(
    file: File,
    maxSize: number = 5 * 1024 * 1024, // 5MB
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf']
): { isValid: boolean; error?: string } {
    if (file.size > maxSize) {
        return { isValid: false, error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
    }
    
    return { isValid: true };
}

// Memory usage monitoring
export function getMemoryUsage(): NodeJS.MemoryUsage {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage();
    }
    // Fallback for client-side
    return {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0
    };
}