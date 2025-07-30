import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';
import { Course } from '@/types/courses';

export async function GET(request: NextRequest) {
    // SECURITY FIX: Authenticate user before accessing GT requirement data
    const { user, error: authError } = await authenticateRequest(request);
    
    if (!user || authError) {
        console.error('Unauthorized access attempt to /api/courses/requirement:', authError);
        return NextResponse.json(
            { error: 'Authentication required to access GT requirement data' }, 
            { status: 401 }
        );
    }

    try {
        const url = new URL(request.url);
        const requirementName = url.searchParams.get('name');
        const userId = url.searchParams.get('userId');
        
        if (!requirementName || !userId) {
            return NextResponse.json({
                error: 'Requirement name and userId are required',
                data: [],
                total: 0
            }, { status: 400 });
        }

        // SECURITY FIX: Verify user can only access their own data
        if (userId !== user.id) {
            console.error(`User ${user.id} attempted to access data for user ${userId}`);
            return NextResponse.json(
                { error: 'Access denied: Cannot access other users data' }, 
                { status: 403 }
            );
        }

        console.log(`🔍 Fetching courses for requirement: "${requirementName}" for user: ${userId}`);
        
        // Get user's major to fetch their degree program
        const { data: userRecord, error: userError } = await supabaseAdmin
            .from('users')
            .select('major')
            .eq('auth_id', userId)
            .single();

        if (userError || !userRecord?.major) {
            console.error('Error fetching user major:', userError);
            return NextResponse.json({
                error: 'User major not found',
                data: [],
                total: 0
            }, { status: 404 });
        }

        // Get degree program requirements
        const { data: program, error: programError } = await supabaseAdmin
            .from('degree_programs')
            .select('requirements')
            .eq('name', userRecord.major.trim())
            .eq('is_active', true)
            .single();

        if (programError || !program?.requirements) {
            console.error('Error fetching degree program:', programError);
            return NextResponse.json({
                error: 'Degree program not found',
                data: [],
                total: 0
            }, { status: 404 });
        }

        // Find the specific requirement
        const requirements = Array.isArray(program.requirements) ? program.requirements : [];
        console.log(`🔍 Looking for requirement: "${requirementName}"`);
        console.log(`📋 Available requirements:`, requirements.map(r => ({ title: r.title, name: r.name, id: r.id })));
        
        let targetRequirement = requirements.find((req: any) => 
            req.title === requirementName || req.name === requirementName || req.id === requirementName
        );

        // If not found, try case-insensitive and partial matching
        if (!targetRequirement) {
            targetRequirement = requirements.find((req: any) => {
                const reqTitle = (req.title || '').toLowerCase();
                const reqName = (req.name || '').toLowerCase();
                const reqId = (req.id || '').toLowerCase();
                const searchName = requirementName.toLowerCase();
                
                return reqTitle.includes(searchName) || 
                       reqName.includes(searchName) || 
                       reqId.includes(searchName) ||
                       searchName.includes(reqTitle) || 
                       searchName.includes(reqName) ||
                       searchName.includes(reqId);
            });
        }

        if (!targetRequirement) {
            console.warn(`Requirement "${requirementName}" not found in any form`);
            return NextResponse.json({
                data: [],
                total: 0,
                requirementName,
                message: 'Requirement not found'
            });
        }

        console.log(`✅ Found requirement:`, { title: targetRequirement.title, name: targetRequirement.name, id: targetRequirement.id, type: targetRequirement.type });

        let courseCodes: string[] = [];

        // Handle different types of requirements
        if (targetRequirement.type === 'thread_selection' && targetRequirement.options) {
            // For thread selections, combine all courses from all thread options
            for (const option of targetRequirement.options) {
                if (option.courses && Array.isArray(option.courses)) {
                    courseCodes.push(...option.courses);
                }
            }
            console.log(`📚 Found ${courseCodes.length} course codes from ${targetRequirement.options.length} thread options`);
        } else if (targetRequirement.type === 'elective' && !targetRequirement.courses) {
            // For free electives without specific courses, return a message
            return NextResponse.json({
                data: [],
                total: 0,
                requirementName,
                requirementType: targetRequirement.type,
                minCredits: targetRequirement.minCredits || 0,
                selectionCount: targetRequirement.selectionCount || 0,
                message: 'This requirement allows any approved courses. Use search to find courses that interest you.'
            });
        } else if (targetRequirement.courses && Array.isArray(targetRequirement.courses)) {
            // Standard requirements with specific courses
            courseCodes = targetRequirement.courses;
            console.log(`📚 Found ${courseCodes.length} course codes for requirement:`, courseCodes);
        }

        if (courseCodes.length === 0) {
            return NextResponse.json({
                data: [],
                total: 0,
                requirementName,
                requirementType: targetRequirement.type,
                minCredits: targetRequirement.minCredits || 0,
                selectionCount: targetRequirement.selectionCount || 0,
                message: 'No specific courses defined for this requirement'
            });
        }

        // Query courses by course codes
        const { data: courses, error: coursesError } = await supabaseAdmin
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
            .in('code', courseCodes)
            .order('code', { ascending: true });

        if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            return NextResponse.json({
                error: 'Failed to fetch courses',
                data: [],
                total: 0
            }, { status: 500 });
        }

        const transformedCourses = transformCourses(courses || []);
        console.log(`✅ Successfully fetched ${transformedCourses.length} courses for requirement "${requirementName}"`);

        return NextResponse.json({
            data: transformedCourses,
            total: transformedCourses.length,
            requirementName,
            requirementType: targetRequirement.type || 'unknown',
            minCredits: targetRequirement.minCredits || 0,
            selectionCount: targetRequirement.selectionCount || 0,
            isFlexible: targetRequirement.type === 'elective' || targetRequirement.type === 'thread_selection'
        });

    } catch (error) {
        console.error('🚨 Requirement API Error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch requirement courses',
            data: [],
            total: 0
        }, { status: 500 });
    }
}

// Helper function to transform courses to expected format
function transformCourses(courses: any[]): Course[] {
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
        offerings: { fall: true, spring: true, summer: false }, // Default offerings
        threads: [], // Default threads
        instructors: [] // Default instructors
    }));
}