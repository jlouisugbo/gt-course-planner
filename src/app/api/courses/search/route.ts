import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

const RESULTS_LIMIT = 50;

export async function GET(request: NextRequest) {
    // SECURITY FIX: Authenticate user before accessing GT course search
    const { user, error: authError } = await authenticateRequest(request);
    
    if (!user || authError) {
        console.error('Unauthorized access attempt to /api/courses/search:', authError);
        return NextResponse.json(
            { error: 'Authentication required to search GT courses' }, 
            { status: 401 }
        );
    }
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q')?.trim();
        
        if (!query) {
            return NextResponse.json({
                data: [],
                total: 0,
                query: '',
                searchType: 'none'
            });
        }

        console.log(`🔍 Searching for: "${query}"`);
        
        const allResults: any[] = [];
        
        // Step 1: Search by course code (most specific)
        console.log('Step 1: Searching by course code...');
        const codeResults = await searchByCode(query);
        console.log(`📊 Code search returned: ${codeResults.length} results`);
        allResults.push(...codeResults);
        
        if (allResults.length >= RESULTS_LIMIT) {
            console.log(`✅ Found ${allResults.length} results from code search alone`);
            return NextResponse.json({
                data: allResults.slice(0, RESULTS_LIMIT),
                total: allResults.length,
                query,
                searchType: 'code'
            });
        }

        // Step 2: If we need more results, search by title
        const remainingSlots = RESULTS_LIMIT - allResults.length;
        console.log(`Step 2: Need ${remainingSlots} more results, searching by title...`);
        
        const titleResults = await searchByTitle(query, getExistingIds(allResults), remainingSlots);
        allResults.push(...titleResults);
        
        if (allResults.length >= RESULTS_LIMIT) {
            console.log(`✅ Found ${allResults.length} results after title search`);
            return NextResponse.json({
                data: allResults.slice(0, RESULTS_LIMIT),
                total: allResults.length,
                query,
                searchType: 'code+title'
            });
        }

        // Step 3: If we still need more results, search by description
        const finalRemainingSlots = RESULTS_LIMIT - allResults.length;
        console.log(`Step 3: Need ${finalRemainingSlots} more results, searching by description...`);
        
        const descriptionResults = await searchByDescription(query, getExistingIds(allResults), finalRemainingSlots);
        allResults.push(...descriptionResults);
        
        console.log(`✅ Final results: ${allResults.length} courses found`);
        console.log(`📋 Final results sample:`, allResults.slice(0, 3).map(r => ({ code: r.code, title: r.title })));
        
        const response = {
            data: allResults.slice(0, RESULTS_LIMIT),
            total: allResults.length,
            query,
            searchType: allResults.length > codeResults.length + titleResults.length ? 'code+title+description' : 'code+title'
        };
        
        console.log(`🚀 Returning response:`, { total: response.total, dataLength: response.data.length, searchType: response.searchType });
        return NextResponse.json(response);

    } catch (error) {
        console.error('🚨 Search API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to search courses',
            data: [],
            total: 0
        }, { status: 500 });
    }
}

// Helper function to search by course code
async function searchByCode(query: string) {
    try {
        // Prioritize exact course code matches first
        const upperQuery = query.toUpperCase();
        
        // First try exact prefix match (highest priority)
        const { data: exactCourses, error: exactError } = await supabaseAdmin
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
            .ilike('code', `${upperQuery}%`)
            .order('code', { ascending: true })
            .limit(RESULTS_LIMIT);

        if (exactError) {
            console.error('Error in exact code search:', exactError);
            return [];
        }

        const allCourses = exactCourses || [];
        console.log(`  🎯 Exact code search found ${allCourses.length} results`);

        // If we still have room, do a broader code search (contains query anywhere)
        if (allCourses.length < RESULTS_LIMIT) {
            const remainingLimit = RESULTS_LIMIT - allCourses.length;
            const existingIds = allCourses.map(c => c.id);
            
            const { data: broadCourses, error: broadError } = await supabaseAdmin
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
                .ilike('code', `%${upperQuery}%`)
                .not('id', 'in', `(${existingIds.join(',') || 0})`)
                .order('code', { ascending: true })
                .limit(remainingLimit);

            if (!broadError && broadCourses) {
                allCourses.push(...broadCourses);
                console.log(`  📚 Broad code search found ${broadCourses.length} additional results`);
            }
        }

        return transformCourses(allCourses);
    } catch (error) {
        console.error('Code search error:', error);
        return [];
    }
}

// Helper function to search by title
async function searchByTitle(query: string, excludeIds: number[], limit: number) {
    try {
        const upperQuery = query.toUpperCase();
        
        let titleQuery = supabaseAdmin
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
            .ilike('title', `%${upperQuery}%`)
            .order('code', { ascending: true })
            .limit(limit);

        // Exclude already found courses
        if (excludeIds.length > 0) {
            titleQuery = titleQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: courses, error } = await titleQuery;

        if (error) {
            console.error('Error in title search:', error);
            return [];
        }

        console.log(`  📖 Title search found ${courses?.length || 0} results`);
        return transformCourses(courses || []);
    } catch (error) {
        console.error('Title search error:', error);
        return [];
    }
}

// Helper function to search by description
async function searchByDescription(query: string, excludeIds: number[], limit: number) {
    try {
        const upperQuery = query.toUpperCase();
        
        let descQuery = supabaseAdmin
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
            .ilike('description', `%${upperQuery}%`)
            .order('code', { ascending: true })
            .limit(limit);

        // Exclude already found courses
        if (excludeIds.length > 0) {
            descQuery = descQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: courses, error } = await descQuery;

        if (error) {
            console.error('Error in description search:', error);
            return [];
        }

        console.log(`  📝 Description search found ${courses?.length || 0} results`);
        return transformCourses(courses || []);
    } catch (error) {
        console.error('Description search error:', error);
        return [];
    }
}

// Helper function to get existing IDs from results
function getExistingIds(results: any[]): number[] {
    return results.map(course => course.id).filter(id => id !== undefined);
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
        type: course.course_type || 'elective',
        college: course.college_id || 'Unknown',
        department: course.code?.split(' ')[0] || 'Unknown',
        difficulty: 3, // Default difficulty
        offerings: { fall: true, spring: true, summer: false } // Default offerings
    }));
}