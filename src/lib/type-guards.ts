/**
 * Type Guards and Type Safety Utilities
 * Provides safe type checking and validation functions
 */

// Type guard for checking if a value is a string
export const isString = (value: unknown): value is string => {
    return typeof value === 'string';
};

// Type guard for checking if a value is a number
export const isNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
};

// Type guard for checking if a value is a valid array
export const isArray = <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
    if (!Array.isArray(value)) return false;
    if (itemGuard) {
        return value.every(itemGuard);
    }
    return true;
};

// Type guard for checking if a value is a valid object
export const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Type guard for database record with id
export const isValidDatabaseRecord = (value: unknown): value is { id: number } => {
    return isObject(value) && isNumber(value.id);
};

// Type guard for user record
export const isValidUserRecord = (value: unknown): value is {
    id: number;
    auth_id: string;
    name?: string;
    email?: string;
} => {
    return (
        isObject(value) &&
        isNumber(value.id) &&
        isString(value.auth_id)
    );
};

// Type guard for course object
export const isValidCourse = (value: unknown): value is {
    id: number;
    code: string;
    title: string;
    credits: number;
} => {
    return (
        isObject(value) &&
        isNumber(value.id) &&
        isString(value.code) &&
        isString(value.title) &&
        isNumber(value.credits)
    );
};

// Type guard for semester object
export const isValidSemester = (value: unknown): value is {
    id: number;
    year: number;
    season: string;
    courses: unknown[];
} => {
    return (
        isObject(value) &&
        isNumber(value.id) &&
        isNumber(value.year) &&
        isString(value.season) &&
        Array.isArray(value.courses)
    );
};

// Safe type assertion with fallback
export const safeTypeAssertion = <T>(
    value: unknown,
    typeGuard: (value: unknown) => value is T,
    fallback: T
): T => {
    return typeGuard(value) ? value : fallback;
};

// Safe string extraction
export const safeString = (value: unknown, fallback = ''): string => {
    return safeTypeAssertion(value, isString, fallback);
};

// Safe number extraction
export const safeNumber = (value: unknown, fallback = 0): number => {
    return safeTypeAssertion(value, isNumber, fallback);
};

// Safe array extraction
export const safeArray = <T>(
    value: unknown, 
    itemGuard?: (item: unknown) => item is T,
    fallback: T[] = []
): T[] => {
    if (!Array.isArray(value)) return fallback;
    if (itemGuard) {
        return value.filter(itemGuard);
    }
    return value as T[];
};

// Safe object extraction
export const safeObject = <T extends Record<string, unknown>>(
    value: unknown,
    fallback: T
): T => {
    return safeTypeAssertion(value, (v): v is T => isObject(v), fallback);
};

// Error type guard
export const isError = (value: unknown): value is Error => {
    return value instanceof Error || (
        isObject(value) &&
        isString(value.message)
    );
};

// Safe error message extraction
export const safeErrorMessage = (error: unknown): string => {
    if (isError(error)) {
        return error.message;
    }
    if (isObject(error) && isString(error.message)) {
        return error.message;
    }
    if (isString(error)) {
        return error;
    }
    return 'Unknown error';
};

// API response type guards
export const isApiErrorResponse = (value: unknown): value is {
    error: string;
    details?: string;
    code?: string;
} => {
    return isObject(value) && isString(value.error);
};

export const isApiSuccessResponse = <T>(
    value: unknown,
    dataGuard?: (data: unknown) => data is T
): value is { data: T } => {
    if (!isObject(value) || !('data' in value)) return false;
    if (dataGuard) {
        return dataGuard(value.data);
    }
    return true;
};

// Supabase response type guards
export const isSupabaseError = (value: unknown): value is {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
} => {
    return isObject(value) && isString(value.message);
};

// Course completion type guard
export const isValidCourseCompletion = (value: unknown): value is {
    id: number;
    user_id: number;
    course_id: number;
    status: 'completed' | 'in-progress' | 'planned';
    grade?: string;
    semester_taken?: string;
} => {
    return (
        isObject(value) &&
        isNumber(value.id) &&
        isNumber(value.user_id) &&
        isNumber(value.course_id) &&
        isString(value.status) &&
        ['completed', 'in-progress', 'planned'].includes(value.status as string)
    );
};

// Degree program type guard
export const isValidDegreeProgram = (value: unknown): value is {
    id: number;
    name: string;
    degree_type: string;
    requirements?: unknown;
} => {
    return (
        isObject(value) &&
        isNumber(value.id) &&
        isString(value.name) &&
        isString(value.degree_type)
    );
};

// Analytics data type guards
export const isValidAnalyticsEvent = (value: unknown): value is {
    event_type: string;
    user_id?: number;
    properties?: Record<string, unknown>;
    timestamp?: string;
} => {
    return (
        isObject(value) &&
        isString(value.event_type)
    );
};

// Session data type guard
export const isValidSessionData = (value: unknown): value is {
    session_id: string;
    user_id?: number;
    start_time: string;
    is_active: boolean;
} => {
    return (
        isObject(value) &&
        isString(value.session_id) &&
        isString(value.start_time) &&
        typeof value.is_active === 'boolean'
    );
};