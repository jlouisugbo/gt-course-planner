import { NextRequest, NextResponse } from 'next/server';
import { safeSearchCourses, validateIdArray } from '@/lib/security/database';

/**
 * GET /api/courses/search
 * Search courses by query string (public data, no auth required)
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('q')?.trim() || '';
        const limitParam = url.searchParams.get('limit') || '50';
        const limit = Math.min(parseInt(limitParam, 10) || 50, 100); // Max 100 results

        if (!searchQuery) {
            return NextResponse.json({
                courses: [],
                total: 0,
                query: '',
                searchType: 'none'
            });
        }

        // Validate search query length
        if (searchQuery.length > 100) {
            return NextResponse.json({
                error: 'Search query too long (max 100 characters)',
                courses: [],
                total: 0
            }, { status: 400 });
        }

        const allResults: any[] = [];

        // Step 1: Search by course code (most specific)
        const codeResults = await safeSearchCourses(searchQuery, {
            limit: limit,
            searchType: 'code'
        });
        allResults.push(...transformCourses(codeResults));

        if (allResults.length >= limit) {
            return NextResponse.json({
                courses: allResults.slice(0, limit),
                total: allResults.length,
                query: searchQuery,
                searchType: 'code'
            });
        }

        // Step 2: Search by title if needed
        const remainingSlots = limit - allResults.length;
        if (remainingSlots > 0) {
            const existingIds = allResults.map(course => course.id).filter(id => id !== undefined);
            const titleResults = await safeSearchCourses(searchQuery, {
                excludeIds: validateIdArray(existingIds),
                limit: remainingSlots,
                searchType: 'title'
            });
            allResults.push(...transformCourses(titleResults));
        }

        // Step 3: Search by description if still needed
        const finalRemainingSlots = limit - allResults.length;
        if (finalRemainingSlots > 0) {
            const existingIds = allResults.map(course => course.id).filter(id => id !== undefined);
            const descriptionResults = await safeSearchCourses(searchQuery, {
                excludeIds: validateIdArray(existingIds),
                limit: finalRemainingSlots,
                searchType: 'description'
            });
            allResults.push(...transformCourses(descriptionResults));
        }

        const response = {
            courses: allResults.slice(0, limit),
            total: allResults.length,
            query: searchQuery,
            searchType: allResults.length > codeResults.length ? 'code+title+description' : 'code'
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('[Course Search API] Error:', error);
        return NextResponse.json({
            error: 'Failed to search courses',
            courses: [],
            total: 0
        }, { status: 500 });
    }
}

// Helper function to transform courses to expected format
function transformCourses(courses: any[]) {
    return courses.map(course => ({
        id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits || 3,
        description: course.description || `${course.code} - Course description not available`,
        prerequisites: course.prerequisites || [],
        postrequisites: course.postrequisites || [],
        course_type: course.course_type || 'elective',
        college: course.college_id || 'Unknown',
        offerings: { fall: true, spring: true, summer: false }, // Default offerings - should be fetched from database
        created_at: course.created_at || new Date().toISOString(),
        updated_at: course.updated_at || new Date().toISOString()
    }));
}
