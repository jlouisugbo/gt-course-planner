import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

// GET /api/semesters/:id - get a specific semester
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing semester id' }, { status: 400 });
        }

        // Get internal user id
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch the semester
        const { data: semester, error: fetchError } = await supabaseAdmin()
            .from('user_semesters')
            .select('*')
            .eq('user_id', Number(userRecord.id))
            .eq('semester_id', Number(id))
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching semester:', fetchError);
            if (fetchError.code === '42P01') {
                return NextResponse.json({ error: 'Migration needed' }, { status: 503 });
            }
            return NextResponse.json({ error: 'Failed to fetch semester' }, { status: 500 });
        }

        if (!semester) {
            return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
        }

        // Transform to frontend format
        const semesterCode = semester.season === 'Fall' ? 0 : semester.season === 'Spring' ? 1 : 2;
        const semesterId = Number(semester.year) * 100 + semesterCode;

        return NextResponse.json({
            semester: {
                id: semesterId,
                year: semester.year,
                season: semester.season,
                courses: semester.courses || [],
                totalCredits: semester.total_credits || 0,
                maxCredits: semester.max_credits || 18,
                isActive: semester.is_active || false,
                gpa: semester.gpa || 0
            }
        });
    } catch (error) {
        console.error('GET /api/semesters/:id error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/semesters/:id - update a specific semester
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing semester id' }, { status: 400 });
        }

        const body = await request.json();
        const { year, season, courses, maxCredits, isActive, gpa, totalCredits, operation, courseData } = body;

        // Get internal user id
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch existing semester
        const { data: existingSemester } = await supabaseAdmin()
            .from('user_semesters')
            .select('*')
            .eq('user_id', Number(userRecord.id))
            .eq('semester_id', Number(id))
            .maybeSingle();

        // Handle granular course operations
        let updatedCourses = courses;
        if (operation && existingSemester) {
            const currentCourses = (existingSemester.courses as any[]) || [];

            switch (operation) {
                case 'addCourse':
                    if (courseData) {
                        // Check for duplicates
                        const isDuplicate = currentCourses.some(c => c.id === courseData.id);
                        if (!isDuplicate) {
                            updatedCourses = [...currentCourses, courseData];
                        } else {
                            updatedCourses = currentCourses;
                        }
                    }
                    break;

                case 'removeCourse':
                    if (courseData?.id) {
                        updatedCourses = currentCourses.filter(c => c.id !== courseData.id);
                    }
                    break;

                case 'updateCourse':
                    if (courseData?.id) {
                        updatedCourses = currentCourses.map(c =>
                            c.id === courseData.id ? { ...c, ...courseData } : c
                        );
                    }
                    break;

                case 'updateCourseStatus':
                    if (courseData?.id && courseData?.status !== undefined) {
                        updatedCourses = currentCourses.map(c =>
                            c.id === courseData.id
                                ? { ...c, status: courseData.status, grade: courseData.grade || c.grade }
                                : c
                        );
                    }
                    break;

                default:
                    updatedCourses = courses || currentCourses;
            }
        }

        // Calculate derived values
        const calculatedTotalCredits = updatedCourses
            ? updatedCourses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0)
            : (totalCredits ?? existingSemester?.total_credits ?? 0);

        const calculatedGPA = updatedCourses
            ? calculateSemesterGPA(updatedCourses)
            : (gpa ?? existingSemester?.gpa ?? 0);

        // Build update payload
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };
        if (year !== undefined) updatePayload.year = parseInt(year);
        if (season !== undefined) updatePayload.season = season;
        if (updatedCourses !== undefined) updatePayload.courses = updatedCourses;
        if (maxCredits !== undefined) updatePayload.max_credits = maxCredits;
        if (isActive !== undefined) updatePayload.is_active = isActive;
        updatePayload.gpa = calculatedGPA;
        updatePayload.total_credits = calculatedTotalCredits;

        // Update or insert
        if (existingSemester) {
            const { data: updated, error: updateError } = await supabaseAdmin()
                .from('user_semesters')
                .update(updatePayload)
                .eq('user_id', Number(userRecord.id))
                .eq('semester_id', Number(id))
                .select()
                .single();

            if (updateError) {
                console.error('Error updating semester:', updateError);
                return NextResponse.json({ error: 'Failed to update semester' }, { status: 500 });
            }

            // Transform to frontend format
            const semesterCode = updated.season === 'Fall' ? 0 : updated.season === 'Spring' ? 1 : 2;
            const semesterId = Number(updated.year) * 100 + semesterCode;

            return NextResponse.json({
                semester: {
                    id: semesterId,
                    year: updated.year,
                    season: updated.season,
                    courses: updated.courses || [],
                    totalCredits: updated.total_credits || 0,
                    maxCredits: updated.max_credits || 18,
                    isActive: updated.is_active || false,
                    gpa: updated.gpa || 0
                }
            });
        }

        // If not existing, insert
        const insertPayload: any = {
            user_id: userRecord.id,
            semester_id: Number(id),
            year: year ? parseInt(year) : Math.floor(Number(id) / 100),
            season: season || (Number(id) % 100 === 0 ? 'Fall' : Number(id) % 100 === 1 ? 'Spring' : 'Summer'),
            courses: updatedCourses || [],
            total_credits: calculatedTotalCredits,
            max_credits: maxCredits || 18,
            is_active: isActive || false,
            gpa: calculatedGPA,
            updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabaseAdmin()
            .from('user_semesters')
            .insert(insertPayload)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting semester:', insertError);
            if (insertError.code === '42P01') {
                return NextResponse.json({ message: 'Semester saved locally (migration needed)' });
            }
            return NextResponse.json({ error: 'Failed to save semester' }, { status: 500 });
        }

        // Transform to frontend format
        const semesterCode = inserted.season === 'Fall' ? 0 : inserted.season === 'Spring' ? 1 : 2;
        const semesterId = Number(inserted.year) * 100 + semesterCode;

        return NextResponse.json({
            semester: {
                id: semesterId,
                year: inserted.year,
                season: inserted.season,
                courses: inserted.courses || [],
                totalCredits: inserted.total_credits || 0,
                maxCredits: inserted.max_credits || 18,
                isActive: inserted.is_active || false,
                gpa: inserted.gpa || 0
            }
        });
    } catch (error) {
        console.error('PUT /api/semesters/:id error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/semesters/:id - delete a specific semester
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing semester id' }, { status: 400 });
        }

        // Get internal user id
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete the semester
        const { error: deleteError } = await supabaseAdmin()
            .from('user_semesters')
            .delete()
            .eq('user_id', Number(userRecord.id))
            .eq('semester_id', Number(id));

        if (deleteError) {
            console.error('Error deleting semester:', deleteError);
            if (deleteError.code === '42P01') {
                return NextResponse.json({ message: 'Semester deleted locally (migration needed)' });
            }
            return NextResponse.json({ error: 'Failed to delete semester' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Semester deleted successfully', semesterId: id });
    } catch (error) {
        console.error('DELETE /api/semesters/:id error:', error);
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
