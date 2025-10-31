import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

interface SemesterGPA {
    semester: string;
    courses: Array<{ code: string; grade: string; credits: number }>;
    totalPoints: number;
    totalCredits: number;
    gpa: number;
}

// Grade point mapping for GT
const GRADE_POINTS: Record<string, number> = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0,
    'W': -1, // Withdrawn - not counted in GPA
    'S': -1, // Satisfactory - not counted in GPA
    'U': -1, // Unsatisfactory - not counted in GPA
    'I': -1, // Incomplete - not counted in GPA
    'P': -1, // Pass - not counted in GPA
};

// GET handler for user course completions
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user record
        const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get course completions
        const { data: completions, error } = await supabase
            .from('user_courses')
            .select('*')
            .eq('user_id', userRecord.id);

        if (error) throw error;

        // Transform to legacy format for frontend compatibility
        const completedCourses = (completions || [])
            .map(c => c.course_code)
            .filter(Boolean);

        // Calculate semester GPAs
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions || []);

        return NextResponse.json({
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs),
            detailedCompletions: completions || []
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST handler for adding course completions
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Get user record
        const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Save course completion
        const { error: upsertError } = await supabase
            .from('user_courses')
            .upsert({
                user_id: userRecord.id,
                course_code: body.courseCode,
                grade: body.grade,
                semester: body.semester,
                credits: body.credits,
                status: 'completed',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,course_code'
            });

        if (upsertError) throw upsertError;

        // Get updated completions
        const { data: completions } = await supabase
            .from('user_courses')
            .select('*')
            .eq('user_id', userRecord.id);

        const completedCourses = (completions || [])
            .map(c => c.course_code)
            .filter(Boolean);
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions || []);

        return NextResponse.json({
            message: 'Course completion saved successfully',
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs)
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE handler for removing course completions
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const courseCode = searchParams.get('courseCode');
        const semester = searchParams.get('semester');

        if (!courseCode) {
            return NextResponse.json({ error: 'Course code required' }, { status: 400 });
        }

        // Get user record
        const { data: userRecord } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete course completion
        let query = supabase
            .from('user_courses')
            .delete()
            .eq('user_id', userRecord.id)
            .eq('course_code', courseCode);

        if (semester) {
            query = query.eq('semester', semester);
        }

        const { error: deleteError } = await query;

        if (deleteError) throw deleteError;

        // Get updated completions
        const { data: completions } = await supabase
            .from('user_courses')
            .select('*')
            .eq('user_id', userRecord.id);

        const completedCourses = (completions || [])
            .map(c => c.course_code)
            .filter(Boolean);
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions || []);

        return NextResponse.json({
            message: 'Course removed successfully',
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs)
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to calculate semester GPAs from completions
function calculateSemesterGPAsFromCompletions(completions: any[]): SemesterGPA[] {
    const semesterMap = new Map<string, SemesterGPA>();

    completions.forEach(completion => {
        if (!completion.semester || !completion.grade) return;

        const gradePoints = GRADE_POINTS[completion.grade];
        if (gradePoints < 0) return; // Skip non-GPA grades

        if (!semesterMap.has(completion.semester)) {
            semesterMap.set(completion.semester, {
                semester: completion.semester,
                courses: [],
                totalPoints: 0,
                totalCredits: 0,
                gpa: 0
            });
        }

        const sem = semesterMap.get(completion.semester)!;
        const credits = completion.credits || 3;

        sem.courses.push({
            code: completion.course_code,
            grade: completion.grade,
            credits: credits
        });

        sem.totalPoints += gradePoints * credits;
        sem.totalCredits += credits;
        sem.gpa = sem.totalCredits > 0 ? sem.totalPoints / sem.totalCredits : 0;
    });

    return Array.from(semesterMap.values());
}

// Helper function to calculate overall GPA
function calculateOverallGPA(semesterGPAs: SemesterGPA[]): number {
    if (!semesterGPAs || semesterGPAs.length === 0) return 0;

    const totalPoints = semesterGPAs.reduce((sum, sem) => sum + (sem.totalPoints || 0), 0);
    const totalCredits = semesterGPAs.reduce((sum, sem) => sum + (sem.totalCredits || 0), 0);

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
}
