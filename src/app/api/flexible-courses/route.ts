import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // SECURITY FIX: Authenticate user before accessing GT flexible course data
    const { user, error: authError } = await authenticateRequest(request);
    
    if (!user || authError) {
        console.error('Unauthorized access attempt to /api/flexible-courses:', authError);
        return NextResponse.json(
            { error: 'Authentication required to access GT course data' }, 
            { status: 401 }
        );
    }
    try {
        const { searchParams } = new URL(request.url);
        const requirementType = searchParams.get('type'); // e.g., "Technical Electives"
        const searchTerm = searchParams.get('search') || '';
        const userId = searchParams.get('userId');

        if (!requirementType) {
            return NextResponse.json({ error: 'Requirement type is required' }, { status: 400 });
        }

        console.log(`🔍 Searching flexible courses for requirement: "${requirementType}", search: "${searchTerm}"`);

        // If we have userId, try to get requirement-specific courses first
        if (userId) {
            try {
                const requirementResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/courses/requirement?name=${encodeURIComponent(requirementType)}&userId=${userId}`
                );
                
                if (requirementResponse.ok) {
                    const requirementData = await requirementResponse.json();
                    if (requirementData.data && requirementData.data.length > 0) {
                        // Filter by search term if provided
                        let filteredCourses = requirementData.data;
                        if (searchTerm) {
                            const lowerSearch = searchTerm.toLowerCase();
                            filteredCourses = filteredCourses.filter((course: any) =>
                                course.code?.toLowerCase().includes(lowerSearch) ||
                                course.title?.toLowerCase().includes(lowerSearch) ||
                                course.description?.toLowerCase().includes(lowerSearch)
                            );
                        }

                        return NextResponse.json({
                            requirementType,
                            courses: filteredCourses,
                            count: filteredCourses.length,
                            source: 'requirement-specific'
                        });
                    }
                }
            } catch (reqError) {
                console.warn('Could not fetch requirement-specific courses, falling back to generic search:', reqError);
            }
        }

        // Fallback to generic search
        let query = supabaseAdmin
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
            .order('code');

        if (searchTerm) {
            // Use the same search logic as the main courses search
            const upperSearch = searchTerm.toUpperCase();
            query = query.or(`code.ilike.${upperSearch}%,code.ilike.%${upperSearch}%,title.ilike.%${upperSearch}%,description.ilike.%${upperSearch}%`);
        } else {
            // Apply filters based on requirement type for better defaults
            if (requirementType.toLowerCase().includes('economics')) {
                query = query.or('code.ilike.%ECON%,title.ilike.%Economics%,title.ilike.%Economic%');
            } else if (requirementType.toLowerCase().includes('social')) {
                query = query.or('code.ilike.%PUBP%,code.ilike.%INTA%,code.ilike.%SOC%,code.ilike.%PSYC%');
            } else if (requirementType.toLowerCase().includes('humanities')) {
                query = query.or('code.ilike.%ENGL%,code.ilike.%PHIL%,code.ilike.%HIST%,code.ilike.%LMC%');
            } else if (requirementType.toLowerCase().includes('science')) {
                query = query.or('code.ilike.%PHYS%,code.ilike.%CHEM%,code.ilike.%BIOL%,code.ilike.%MATH%');
            } else if (requirementType.toLowerCase().includes('technical') || requirementType.toLowerCase().includes('elective')) {
                // For technical electives, show engineering and CS courses
                query = query.or('code.ilike.%CS %,code.ilike.%ME %,code.ilike.%ECE %,code.ilike.%AE %,code.ilike.%MATH %');
            }
        }

        const { data: courses, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching flexible courses:', error);
            return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
        }

        // Transform courses to expected format
        const transformedCourses = (courses || []).map(course => ({
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

        console.log(`✅ Found ${transformedCourses.length} flexible courses for "${requirementType}"`);

        return NextResponse.json({
            requirementType,
            courses: transformedCourses,
            count: transformedCourses.length,
            source: 'generic-search'
        });
    } catch (error) {
        console.error('🚨 Flexible courses API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}