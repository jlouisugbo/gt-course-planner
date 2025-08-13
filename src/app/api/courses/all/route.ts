import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSecureRoute, SECURITY_CONFIGS } from '@/lib/security/middleware';
import { z } from 'zod';
import { createSecureErrorHandler } from '@/lib/security/errorHandler';

// Validation schema for course query parameters
const CourseAllQuerySchema = z.object({
    search: z.string()
        .trim()
        .max(50, "Search term too long")
        .transform(str => str.replace(/[<>'"&;]/g, ''))
        .optional(),
    
    subject: z.string()
        .trim()
        .regex(/^[A-Z]{2,4}$/, "Invalid subject code")
        .optional(),
        
    limit: z.string()
        .regex(/^\d+$/, "Limit must be a number")
        .transform(Number)
        .refine(n => n > 0 && n <= 2000, "Limit must be between 1 and 2000")
        .default("1000"),
        
    offset: z.string()
        .regex(/^\d+$/, "Offset must be a number")
        .transform(Number)
        .refine(n => n >= 0, "Offset cannot be negative")
        .default("0")
});

// Secure GET handler for all courses
export const GET = createSecureRoute(async (request) => {
    try {
        const url = new URL(request.url);
        
        // Validate query parameters
        const queryParams = CourseAllQuerySchema.parse({
            search: url.searchParams.get('search'),
            subject: url.searchParams.get('subject'),
            limit: url.searchParams.get('limit') || "1000",
            offset: url.searchParams.get('offset') || "0"
        });

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
            .order('code', { ascending: true });

        // Apply search filter if provided (safe - already sanitized)
        if (queryParams.search) {
            query = query.ilike('code', `%${queryParams.search}%`);
        }

        // Apply subject filter if provided (safe - validated regex)
        if (queryParams.subject) {
            query = query.ilike('code', `${queryParams.subject}%`);
        }

        // Apply pagination (safe - validated numbers)
        query = query.range(queryParams.offset, queryParams.offset + queryParams.limit - 1);

        const { data: courses, error, count } = await query;

        if (error) {
            const errorHandler = createSecureErrorHandler('/api/courses/all', 'GET');
            return errorHandler.handleError(error, 'Failed to fetch courses');
        }

        // Transform the data to match expected format
        const transformedCourses = courses?.map(course => ({
            id: course.id,
            code: course.code,
            title: course.title,
            credits: course.credits || 3,
            description: course.description || `${course.code} - Course description not available`,
            prerequisites: course.prerequisites || [],
            postrequisites: course.postrequisites || [],
            type: course.course_type || 'elective',
            college: course.college || 'Unknown',
            department: course.department || (typeof course.code === 'string' ? course.code.split(' ')[0] : 'Unknown'),
            difficulty: 3, // Default difficulty
            offerings: course.offerings || { fall: true, spring: true, summer: false }
        })) || [];

        return NextResponse.json({
            data: transformedCourses,
            count: count || 0,
            hasMore: transformedCourses.length === queryParams.limit
        });

    } catch (error: any) {
        const errorHandler = createSecureErrorHandler('/api/courses/all', 'GET');
        return errorHandler.handleError(error);
    }
}, {
    ...SECURITY_CONFIGS.LOW_SECURITY,
    validationSchema: {
        query: CourseAllQuerySchema
    }
});