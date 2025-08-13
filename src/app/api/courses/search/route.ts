import { NextResponse } from 'next/server';
import { createSecureRoute, SECURITY_CONFIGS } from '@/lib/security/middleware';
import { CourseSearchSchema } from '@/lib/validation/schemas';
import { safeSearchCourses, validateIdArray } from '@/lib/security/database';

// Secure GET handler using security middleware
export const GET = createSecureRoute(async (request) => {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q')?.trim() || '';
    
    if (!searchQuery) {
        return NextResponse.json({
            courses: [],
            total: 0,
            query: '',
            searchType: 'none'
        });
    }

    // Validate search query
    const validatedQuery = CourseSearchSchema.parse({
        q: searchQuery,
        limit: url.searchParams.get('limit') || "50"
    });

    
    const allResults: any[] = [];
    
    try {
        // Step 1: Search by course code (most specific)
        const codeResults = await safeSearchCourses(validatedQuery.q, { 
            limit: validatedQuery.limit,
            searchType: 'code' 
        });
        allResults.push(...transformCourses(codeResults));
        
        if (allResults.length >= validatedQuery.limit) {
            return NextResponse.json({
                courses: allResults.slice(0, validatedQuery.limit),
                total: allResults.length,
                query: validatedQuery.q,
                searchType: 'code'
            });
        }

        // Step 2: Search by title if needed
        const remainingSlots = validatedQuery.limit - allResults.length;
        if (remainingSlots > 0) {
            
            const existingIds = allResults.map(course => course.id).filter(id => id !== undefined);
            const titleResults = await safeSearchCourses(validatedQuery.q, {
                excludeIds: validateIdArray(existingIds),
                limit: remainingSlots,
                searchType: 'title'
            });
            allResults.push(...transformCourses(titleResults));
        }
        
        // Step 3: Search by description if still needed
        const finalRemainingSlots = validatedQuery.limit - allResults.length;
        if (finalRemainingSlots > 0) {
            
            const existingIds = allResults.map(course => course.id).filter(id => id !== undefined);
            const descriptionResults = await safeSearchCourses(validatedQuery.q, {
                excludeIds: validateIdArray(existingIds),
                limit: finalRemainingSlots,
                searchType: 'description'
            });
            allResults.push(...transformCourses(descriptionResults));
        }
        
        
        const response = {
            courses: allResults.slice(0, validatedQuery.limit),
            total: allResults.length,
            query: validatedQuery.q,
            searchType: allResults.length > codeResults.length ? 'code+title+description' : 'code'
        };
        
        return NextResponse.json(response);

    } catch (error) {
        console.error('🚨 Search API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to search courses',
            courses: [],
            total: 0
        }, { status: 500 });
    }
}, {
    ...SECURITY_CONFIGS.MEDIUM_SECURITY,
    validationSchema: {
        query: CourseSearchSchema
    }
});


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