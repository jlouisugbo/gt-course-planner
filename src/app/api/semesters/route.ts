import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

// GET all semesters and courses for a user
export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get user ID from users table
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch user's semesters from user_semesters table
        const { data: semesters, error: semesterError } = await supabaseAdmin()
            .from('user_semesters')
            .select('*')
            .eq('user_id', Number(userRecord.id))
            .order('year', { ascending: true })
            .order('season', { ascending: true });

        if (semesterError) {
            console.error('Error fetching semesters:', semesterError);
            // If table doesn't exist yet, return empty structure
            if (semesterError.code === '42P01') {
                console.log('user_semesters table does not exist yet - please run migration');
                return NextResponse.json({ semesters: {}, message: 'Migration needed' });
            }
            return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 500 });
        }

        // Transform array to object format expected by frontend
        const semestersObject: Record<string, any> = {};
        (semesters || []).forEach((semester: any) => {
            // Create a unique ID from year and season
            const semesterCode = semester.season === 'Fall' ? 0 : semester.season === 'Spring' ? 1 : 2;
            const semesterId = Number(semester.year) * 100 + semesterCode;
            
            semestersObject[semesterId] = {
                id: semesterId,
                year: semester.year,
                season: semester.season,
                courses: semester.courses || [],
                totalCredits: semester.total_credits || 0,
                maxCredits: semester.max_credits || 18,
                isActive: semester.is_active || false,
                gpa: semester.gpa || 0
            };
        });

        return NextResponse.json({ semesters: semestersObject });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create or update a semester with courses
export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { semesterId, year, season, courses, maxCredits, isActive } = body;

        if (!semesterId || !year || !season) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user ID
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate total credits and GPA
        const totalCredits = courses?.reduce((sum: number, course: any) => sum + (course.credits || 0), 0) || 0;
        const gpa = calculateSemesterGPA(courses || []);

        // Upsert semester data
        const { data: semester, error: semesterError } = await supabaseAdmin()
            .from('user_semesters')
            .upsert({
                user_id: userRecord.id,
                semester_id: semesterId,
                year: parseInt(year),
                season: season,
                courses: courses || [],
                total_credits: totalCredits,
                max_credits: maxCredits || 18,
                is_active: isActive || false,
                gpa: gpa,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (semesterError) {
            console.error('Error saving semester:', semesterError);
            // If table doesn't exist yet, return success anyway
            if (semesterError.code === '42P01') {
                console.log('user_semesters table does not exist yet - please run migration');
                return NextResponse.json({ 
                    message: 'Semester saved successfully (local only - migration needed)',
                    semesterId
                });
            }
            return NextResponse.json({ error: 'Failed to save semester' }, { status: 500 });
        }

        return NextResponse.json({ 
            semester,
            message: 'Semester saved successfully'
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove a semester or course from a semester
export async function DELETE(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const semesterId = searchParams.get('semesterId');
        const courseId = searchParams.get('courseId');

        if (!semesterId) {
            return NextResponse.json({ error: 'Missing semesterId parameter' }, { status: 400 });
        }

        // Get user ID
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (courseId) {
            // Remove specific course from semester
            const { data: semester } = await supabaseAdmin()
                .from('user_semesters')
                .select('courses')
                .eq('user_id', Number(userRecord.id))
                .eq('semester_id', semesterId)
                .single();

            if (semester) {
                const updatedCourses = (semester.courses as any[]).filter(
                    course => course.id !== parseInt(courseId)
                );
                const totalCredits = updatedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
                const gpa = calculateSemesterGPA(updatedCourses);

                await supabaseAdmin()
                    .from('user_semesters')
                    .update({
                        courses: updatedCourses,
                        total_credits: totalCredits,
                        gpa: gpa,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', Number(userRecord.id))
                    .eq('semester_id', semesterId);
            }

            return NextResponse.json({ 
                message: 'Course removed successfully',
                semesterId,
                courseId
            });
        } else {
            // Delete entire semester
            const { error: deleteError } = await supabaseAdmin()
                .from('user_semesters')
                .delete()
                .eq('user_id', Number(userRecord.id))
                .eq('semester_id', semesterId);

            if (deleteError) {
                console.error('Error deleting semester:', deleteError);
                if (deleteError.code === '42P01') {
                    return NextResponse.json({ message: 'Semester deleted successfully (local only)' });
                }
                return NextResponse.json({ error: 'Failed to delete semester' }, { status: 500 });
            }

            return NextResponse.json({ message: 'Semester deleted successfully' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to calculate semester GPA
function calculateSemesterGPA(courses: any[]): number {
    const completedCourses = courses.filter(course => 
        course.status === 'completed' && course.grade
    );

    if (completedCourses.length === 0) return 0;

    const gradeToGPA: Record<string, number> = {
        'A': 4.0,
        'B': 3.0,
        'C': 2.0,
        'D': 1.0,
        'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;

    completedCourses.forEach(course => {
        const gpaValue = gradeToGPA[course.grade] || 0;
        const credits = course.credits || 3;
        totalPoints += gpaValue * credits;
        totalCredits += credits;
    });

    return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}