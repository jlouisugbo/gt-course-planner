import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    // SECURITY FIX: Authenticate user before accessing GT course data
    const { user, error: authError } = await authenticateRequest(request);
    
    if (!user || authError) {
        console.error('Unauthorized access attempt to /api/courses/all:', authError);
        return NextResponse.json(
            { error: 'Authentication required to access GT course data' }, 
            { status: 401 }
        );
    }
    try {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        const subject = url.searchParams.get('subject');
        const limit = parseInt(url.searchParams.get('limit') || '1000');
        const offset = parseInt(url.searchParams.get('offset') || '0');

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

        // Apply search filter if provided (code only)
        if (search && search.trim()) {
            query = query.ilike('code', `%${search}%`);
        }

        // Apply subject filter if provided
        if (subject && subject.trim()) {
            query = query.ilike('code', `${subject}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: courses, error, count } = await query;

        if (error) {
            console.error('Error fetching courses:', error);
            return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
        }

        // Transform the data to match expected format
        const transformedCourses = courses?.map(course => ({
            id: course.id,
            code: course.code,
            title: course.title,
            credits: course.credits || 3,
            description: course.description || `${course.code} - Course description not available`,
            prerequisites: course.prerequisites || [], // From database or empty array
            postrequisites: course.postrequisites || [], // From database or empty array
            type: course.course_type || 'elective',
            college: course.college_id || 'Unknown',
            department: course.code?.split(' ')[0] || 'Unknown',
            difficulty: 3, // Default difficulty
            offerings: { fall: true, spring: true, summer: false } // Default offerings
        })) || [];

        return NextResponse.json({
            data: transformedCourses,
            count: count || 0,
            hasMore: transformedCourses.length === limit
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}