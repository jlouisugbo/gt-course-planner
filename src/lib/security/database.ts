import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Safe database query utilities to prevent SQL injection
 */

export class DatabaseSecurityError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'DatabaseSecurityError';
    }
}

/**
 * Validates and sanitizes course code before database queries
 */
export function validateCourseCode(code: string): string {
    if (!code || typeof code !== 'string') {
        throw new DatabaseSecurityError('Invalid course code', 'INVALID_COURSE_CODE');
    }
    
    const sanitized = code.trim().toUpperCase();
    
    // Validate format: 2-4 letters followed by 4 digits, optional letter
    const courseCodeRegex = /^[A-Z]{2,4}\s*\d{4}[A-Z]?$/;
    if (!courseCodeRegex.test(sanitized)) {
        throw new DatabaseSecurityError('Invalid course code format', 'INVALID_FORMAT');
    }
    
    return sanitized.replace(/\s+/g, ' '); // Normalize spacing
}

/**
 * Validates array of course codes for safe database queries
 */
export function validateCourseCodeArray(codes: any[]): string[] {
    if (!Array.isArray(codes)) {
        throw new DatabaseSecurityError('Course codes must be an array', 'INVALID_ARRAY');
    }
    
    if (codes.length === 0) {
        return [];
    }
    
    if (codes.length > 100) {
        throw new DatabaseSecurityError('Too many course codes in query', 'ARRAY_TOO_LARGE');
    }
    
    return codes.map(validateCourseCode);
}

/**
 * Validates numeric IDs for database queries
 */
export function validateId(id: any, fieldName = 'id'): number {
    const numId = Number(id);
    
    if (!Number.isFinite(numId) || numId <= 0 || numId > 2147483647) {
        throw new DatabaseSecurityError(`Invalid ${fieldName}`, 'INVALID_ID');
    }
    
    return Math.floor(numId); // Ensure integer
}

/**
 * Validates array of IDs for safe database queries
 */
export function validateIdArray(ids: any[], fieldName = 'id'): number[] {
    if (!Array.isArray(ids)) {
        throw new DatabaseSecurityError(`${fieldName}s must be an array`, 'INVALID_ARRAY');
    }
    
    if (ids.length === 0) {
        return [];
    }
    
    if (ids.length > 1000) {
        throw new DatabaseSecurityError(`Too many ${fieldName}s in query`, 'ARRAY_TOO_LARGE');
    }
    
    return ids.map(id => validateId(id, fieldName));
}

/**
 * Safe course search that prevents SQL injection
 */
export async function safeSearchCourses(
    searchQuery: string,
    options: {
        excludeIds?: number[];
        limit?: number;
        searchType?: 'code' | 'title' | 'description';
    } = {}
) {
    // Sanitize search query
    const sanitizedQuery = searchQuery
        .trim()
        .replace(/[<>'"&;]/g, '') // Remove potentially dangerous characters
        .substring(0, 100); // Limit length
    
    if (!sanitizedQuery) {
        return [];
    }
    
    const { excludeIds = [], limit = 50, searchType = 'code' } = options;
    
    // Validate exclude IDs
    const safeExcludeIds = validateIdArray(excludeIds, 'exclude_id');
    
    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 100);
    
    let query = supabaseAdmin()
        .from('courses_enhanced')
        .select(`
            id,
            code,
            title,
            credits,
            description,
            course_type,
            department,
            college_id,
            college,
            offerings,
            prerequisites,
            postrequisites
        `)
        .order('code', { ascending: true })
        .limit(safeLimit);
    
    // Apply search filter based on type
    switch (searchType) {
        case 'code':
            query = query.ilike('code', `%${sanitizedQuery}%`);
            break;
        case 'title':
            query = query.ilike('title', `%${sanitizedQuery}%`);
            break;
        case 'description':
            query = query.ilike('description', `%${sanitizedQuery}%`);
            break;
        default:
            throw new DatabaseSecurityError('Invalid search type', 'INVALID_SEARCH_TYPE');
    }
    
    // Exclude IDs if provided - use safe parameterized approach
    if (safeExcludeIds.length > 0) {
        // Use Supabase's safe .not() method with individual ID checks
        for (const excludeId of safeExcludeIds) {
            query = query.neq('id', excludeId);
        }
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Database query error:', error);
        throw new DatabaseSecurityError('Database query failed', 'QUERY_ERROR');
    }
    
    return data || [];
}

/**
 * Safe user course completions query
 */
export async function safeGetUserCompletions(userId: number, courseCode?: string) {
    const safeUserId = validateId(userId, 'user_id');
    
    let query = supabaseAdmin()
        .from('user_course_completions')
        .select(`
            course_code,
            grade,
            semester,
            credits,
            status,
            completed_at,
            courses (
                code,
                title,
                description
            )
        `)
        .eq('user_id', safeUserId)
        .order('semester', { ascending: true });
    
    // Add course code filter if provided
    if (courseCode) {
        const safeCourseCode = validateCourseCode(courseCode);
        query = query.eq('course_code', safeCourseCode);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Database query error:', error);
        throw new DatabaseSecurityError('Failed to fetch completions', 'QUERY_ERROR');
    }
    
    return data || [];
}

/**
 * Safe course lookup by code
 */
export async function safeGetCourseByCode(courseCode: string) {
    const safeCourseCode = validateCourseCode(courseCode);
    
    const { data, error } = await supabaseAdmin()
        .from('courses')
        .select('id, code, title, credits, prerequisites')
        .eq('code', safeCourseCode)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') { // No rows returned
            return null;
        }
        console.error('Database query error:', error);
        throw new DatabaseSecurityError('Failed to fetch course', 'QUERY_ERROR');
    }
    
    return data;
}

/**
 * Safe user profile query
 */
export async function safeGetUserProfile(authId: string) {
    if (!authId || typeof authId !== 'string' || authId.length > 50) {
        throw new DatabaseSecurityError('Invalid auth ID', 'INVALID_AUTH_ID');
    }
    
    // Sanitize auth ID
    const safeAuthId = authId.trim().replace(/[<>'"&]/g, '');
    
    const { data, error } = await supabaseAdmin()
        .from('user_profiles_enhanced')
        .select(`
            id,
            auth_id,
            email,
            full_name,
            gt_username,
            graduation_year,
            major,
            minors,
            threads,
            degree_program_id,
            plan_settings,
            completed_courses,
            completed_groups,
            has_detailed_gpa,
            semester_gpas,
            admin,
            created_at,
            updated_at
        `)
        .eq('auth_id', safeAuthId)
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') { // No rows returned
            return null;
        }
        console.error('Database query error:', error);
        throw new DatabaseSecurityError('Failed to fetch user profile', 'QUERY_ERROR');
    }
    
    return data;
}

/**
 * Safe user course completion upsert
 */
export async function safeUpsertCourseCompletion(
    userId: number,
    completion: {
        courseCode: string;
        grade?: string;
        semester: string;
        credits?: number;
    }
) {
    const safeUserId = validateId(userId, 'user_id');
    const safeCourseCode = validateCourseCode(completion.courseCode);
    
    // Validate semester format
    const semesterRegex = /^(Fall|Spring|Summer)\s\d{4}$/;
    if (!semesterRegex.test(completion.semester)) {
        throw new DatabaseSecurityError('Invalid semester format', 'INVALID_SEMESTER');
    }
    
    // Validate grade if provided
    let safeGrade = null;
    if (completion.grade) {
        const gradeRegex = /^[ABCDF]$|^[WSUIP]$/;
        if (!gradeRegex.test(completion.grade)) {
            throw new DatabaseSecurityError('Invalid grade', 'INVALID_GRADE');
        }
        safeGrade = completion.grade.toUpperCase();
    }
    
    // Validate credits
    const safeCredits = completion.credits ? 
        Math.min(Math.max(1, completion.credits), 12) : 3;
    
    // Get course ID
    const course = await safeGetCourseByCode(safeCourseCode);
    if (!course) {
        throw new DatabaseSecurityError('Course not found', 'COURSE_NOT_FOUND');
    }
    
    const { error } = await supabaseAdmin()
        .from('user_course_completions')
        .upsert({
            user_id: safeUserId,
            course_id: course.id,
            course_code: safeCourseCode,
            grade: safeGrade,
            semester: completion.semester,
            credits: safeCredits,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .match({ 
            user_id: safeUserId, 
            course_id: course.id, 
            semester: completion.semester 
        });
    
    if (error) {
        console.error('Database upsert error:', error);
        throw new DatabaseSecurityError('Failed to save completion', 'UPSERT_ERROR');
    }
    
    return { success: true };
}

/**
 * Safe delete course completion
 */
export async function safeDeleteCourseCompletion(
    userId: number,
    courseCode: string,
    semester?: string
) {
    const safeUserId = validateId(userId, 'user_id');
    const safeCourseCode = validateCourseCode(courseCode);
    
    // Get course ID
    const course = await safeGetCourseByCode(safeCourseCode);
    if (!course) {
        throw new DatabaseSecurityError('Course not found', 'COURSE_NOT_FOUND');
    }
    
    let query = supabaseAdmin()
        .from('user_course_completions')
        .delete()
        .eq('user_id', safeUserId)
        .eq('course_id', (course as any).id);
    
    if (semester) {
        const semesterRegex = /^(Fall|Spring|Summer)\s\d{4}$/;
        if (!semesterRegex.test(semester)) {
            throw new DatabaseSecurityError('Invalid semester format', 'INVALID_SEMESTER');
        }
        query = query.eq('semester', semester);
    }
    
    const { error } = await query;
    
    if (error) {
        console.error('Database delete error:', error);
        throw new DatabaseSecurityError('Failed to delete completion', 'DELETE_ERROR');
    }
    
    return { success: true };
}

/**
 * Safe update user profile (with auto-creation if user doesn't exist)
 */
export async function safeUpdateUserProfile(
    authId: string,
    updates: Record<string, any>
) {
    if (!authId || typeof authId !== 'string' || authId.length > 50) {
        throw new DatabaseSecurityError('Invalid auth ID', 'INVALID_AUTH_ID');
    }
    
    const safeAuthId = authId.trim().replace(/[<>'"&]/g, '');
    
    // Whitelist allowed fields - ONLY fields that exist in actual database schema
    const allowedFields = [
        'full_name', 'gt_username', 'graduation_year', 'major', 'minors',
        'selected_threads', 'degree_program_id', 'plan_settings', 
        'has_detailed_gpa', 'semester_gpas'
    ];
    
    const safeUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
            safeUpdates[key] = value;
        }
    }
    
    // Always update timestamp
    safeUpdates.updated_at = new Date().toISOString();
    
    // First, try to update the existing user
    const { data: updateData, error: updateError } = await supabaseAdmin()
        .from('users')
        .update(safeUpdates)
        .eq('auth_id', safeAuthId)
        .select()
        .single();
    
    if (updateError) {
        // If user doesn't exist (PGRST116), create them
        if (updateError.code === 'PGRST116') {
            // Get basic user info from Supabase Auth
            const { data: authUser, error: authError } = await supabaseAdmin().auth.admin.getUserById(safeAuthId);
            
            if (authError || !authUser?.user) {
                console.error('Failed to get auth user:', authError);
                throw new DatabaseSecurityError('Invalid auth user', 'AUTH_USER_NOT_FOUND');
            }
            
            // Create new user with default values + updates
            const newUserData = {
                auth_id: safeAuthId,
                email: authUser.user.email || '',
                full_name: updates.full_name || authUser.user.user_metadata?.full_name || '',
                role: 'student',
                created_at: new Date().toISOString(),
                ...safeUpdates
            };
            
            const { data: createData, error: createError } = await supabaseAdmin()
                .from('users')
                .insert(newUserData)
                .select()
                .single();
            
            if (createError) {
                console.error('Database insert error:', createError);
                throw new DatabaseSecurityError('Failed to create user profile', 'INSERT_ERROR');
            }
            
            return createData;
        } else {
            // Other update error
            console.error('Database update error:', updateError);
            throw new DatabaseSecurityError('Failed to update profile', 'UPDATE_ERROR');
        }
    }
    
    return updateData;
}