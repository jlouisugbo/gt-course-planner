import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

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
        
    page: z.string()
        .regex(/^\d+$/, "Page must be a number")
        .transform(Number)
        .refine(n => n > 0, "Page must be positive")
        .optional(),
        
    limit: z.string()
        .regex(/^\d+$/, "Limit must be a number")
        .transform(Number)
        .refine(n => n > 0 && n <= 2000, "Limit must be between 1 and 2000")
        .optional(),
        
    offset: z.string()
        .regex(/^\d+$/, "Offset must be a number")
        .transform(Number)
        .refine(n => n >= 0, "Offset cannot be negative")
        .optional()
});

// GET handler for all courses - simplified for demo
export const GET = async (request: Request) => {
    try {
        const url = new URL(request.url);
        
        // Validate query parameters (filter out null values)
        const queryParams = CourseAllQuerySchema.parse({
            search: url.searchParams.get('search') || undefined,
            subject: url.searchParams.get('subject') || undefined,
            page: url.searchParams.get('page') || undefined,
            limit: url.searchParams.get('limit') || undefined,
            offset: url.searchParams.get('offset') || undefined
        });

        // Calculate offset from page if provided
        const limit = queryParams.limit || 1000;
        const offset = queryParams.page 
            ? (queryParams.page - 1) * limit 
            : (queryParams.offset || 0);

        let query = supabaseAdmin()
            .from('courses')
            .select(`
                id,
                code,
                title,
                credits,
                description,
                course_type,
                college_id,
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
        query = query.range(offset, offset + limit - 1);

        const { data: courses, error, count } = await query;

        if (error) {
            console.error('Error fetching courses:', error);
            return NextResponse.json(
                { error: 'Failed to fetch courses' },
                { status: 500 }
            );
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
            college: course.college_id || 'Unknown',
            department: (typeof course.code === 'string' ? course.code.split(' ')[0] : 'Unknown'),
            difficulty: 3, // Default difficulty
            offerings: { fall: true, spring: true, summer: false } // Default offerings
        })) || [];

        return NextResponse.json({
            data: transformedCourses,
            count: count || 0,
            hasMore: transformedCourses.length === limit
        });

    } catch (error: any) {
        console.error('Error in courses API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch courses', details: error.message },
            { status: 500 }
        );
    }
};