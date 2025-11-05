import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

// Validation schema for course query parameters
const CourseAllQuerySchema = z.object({
    search: z.string()
        .trim()
        .max(100, "Search term too long")
        .transform(str => str.replace(/[<>'\"&;]/g, ''))
        .optional(),

    subject: z.string()
        .trim()
        .regex(/^[A-Z]{1,4}$/, "Invalid subject code")
        .optional(),

    // page is zero-based for infinite queries
    page: z.string()
        .regex(/^\d+$/, "Page must be a number")
        .transform(Number)
        .refine(n => n >= 0, "Page must be >= 0")
        .optional(),

    limit: z.string()
        .regex(/^\d+$/, "Limit must be a number")
        .transform(Number)
        .refine(n => n > 0 && n <= 2000, "Limit must be between 1 and 2000")
        .optional(),

    types: z.string()
        .trim()
        .optional(), // comma-separated course_type values

    credits: z.string()
        .trim()
        .optional() // comma-separated credit numbers
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
            types: url.searchParams.get('types') || undefined,
            credits: url.searchParams.get('credits') || undefined
        });

        // Pagination defaults: page is zero-based
        const limit = queryParams.limit || 100;
        const page = queryParams.page ?? 0;
        const offset = page * limit;

        // Build count query and apply filters
        let countQuery = supabaseAdmin().from('courses').select('id', { head: true, count: 'exact' });
        if (queryParams.search) {
            countQuery = countQuery.filter('code', 'ilike', `%${queryParams.search}%`);
        }
        if (queryParams.subject) {
            countQuery = countQuery.filter('code', 'ilike', `${queryParams.subject}%`);
        }
        // types and credits can be comma-separated lists
        const typesArray = queryParams.types ? queryParams.types.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (typesArray.length > 0) {
            countQuery = countQuery.in('course_type', typesArray as any);
        }
        const creditsArray = queryParams.credits ? queryParams.credits.split(',').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n)) : [];
        if (creditsArray.length > 0) {
            countQuery = countQuery.in('credits', creditsArray as any);
        }

        const countRes = await countQuery;
        const totalCount = (countRes && (countRes as any).count) ? (countRes as any).count : 0;

        // Now query for page data with same filters
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

        if (queryParams.search) {
            query = query.filter('code', 'ilike', `%${queryParams.search}%`);
        }
        if (queryParams.subject) {
            query = query.filter('code', 'ilike', `${queryParams.subject}%`);
        }
        if (typesArray.length > 0) {
            query = query.in('course_type', typesArray as any);
        }
        if (creditsArray.length > 0) {
            query = query.in('credits', creditsArray as any);
        }

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

    const { data: courses, error } = await query.range(offset, offset + limit - 1);

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

        const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit));

        return NextResponse.json({
            courses: transformedCourses,
            totalPages,
            totalCount: totalCount || 0
        });

    } catch (error: any) {
        console.error('Error in courses API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch courses', details: error.message },
            { status: 500 }
        );
    }
};