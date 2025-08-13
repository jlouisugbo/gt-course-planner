import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSecureRoute, SECURITY_CONFIGS } from '@/lib/security/middleware';
import { CourseCompletionSchema, CourseCompletionDeleteSchema } from '@/lib/validation/schemas';
import { 
    safeGetUserCompletions, 
    safeUpsertCourseCompletion, 
    safeDeleteCourseCompletion
} from '@/lib/security/database';


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

// Secure GET handler for user course completions
export const GET = createSecureRoute(async (request, context) => {
    try {
        // Get user record using safe method
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', context.user!.id)
            .single() as { data: { id: number } | null };

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Use safe database query for completions
        const completions = await safeGetUserCompletions(userRecord.id);

        // Transform to legacy format for frontend compatibility
        const completedCourses = completions.map(c => c.course_code).filter(Boolean);
        
        // Calculate semester GPAs from normalized data
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions);
        
        return NextResponse.json({
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs),
            // Also include detailed completions for future frontend updates
            detailedCompletions: completions
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, SECURITY_CONFIGS.MEDIUM_SECURITY);

// Secure POST handler for adding course completions
export const POST = createSecureRoute(async (request, context) => {
    try {
        const body = await request.json();
        
        // Validate input using Zod schema
        const validatedCompletion = CourseCompletionSchema.parse(body);

        // Get user record
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', context.user!.id)
            .single() as { data: { id: number } | null };

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Use safe database method to save completion
        await safeUpsertCourseCompletion(userRecord.id, {
            courseCode: validatedCompletion.courseCode,
            grade: validatedCompletion.grade,
            semester: validatedCompletion.semester,
            credits: validatedCompletion.credits
        });

        // Get updated completions using safe method
        const completions = await safeGetUserCompletions(userRecord.id);

        // Transform for frontend compatibility
        const completedCourses = completions.map(c => c.course_code).filter(Boolean);
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions);

        return NextResponse.json({
            message: 'Course completion saved successfully',
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs)
        });
    } catch (error: any) {
        console.error('API Error:', error);
        
        // Handle validation errors
        if (error.name === 'ZodError') {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.errors
            }, { status: 400 });
        }
        
        // Handle database security errors
        if (error.name === 'DatabaseSecurityError') {
            return NextResponse.json({
                error: error.message,
                code: error.code
            }, { status: 400 });
        }
        
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, {
    ...SECURITY_CONFIGS.HIGH_SECURITY,
    validationSchema: {
        body: CourseCompletionSchema
    }
});

// Secure DELETE handler for removing course completions
export const DELETE = createSecureRoute(async (request, context) => {
    try {
        const { searchParams } = new URL(request.url);
        const courseCode = searchParams.get('courseCode');
        const semester = searchParams.get('semester');

        // Validate input using Zod schema
        const validatedData = CourseCompletionDeleteSchema.parse({
            courseCode,
            semester
        });

        // Get user record
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', context.user!.id)
            .single() as { data: { id: number } | null };

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Use safe database method to delete completion
        await safeDeleteCourseCompletion(
            userRecord.id!, 
            validatedData.courseCode!, 
            validatedData.semester
        );

        // Get updated completions using safe method
        const completions = await safeGetUserCompletions(userRecord.id);

        // Transform for frontend compatibility
        const completedCourses = completions.map(c => c.course_code).filter(Boolean);
        const semesterGPAs = calculateSemesterGPAsFromCompletions(completions);

        return NextResponse.json({
            message: 'Course removed successfully',
            completedCourses,
            semesterGPAs,
            overallGPA: calculateOverallGPA(semesterGPAs)
        });
    } catch (error: any) {
        console.error('API Error:', error);
        
        // Handle validation errors
        if (error.name === 'ZodError') {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.errors
            }, { status: 400 });
        }
        
        // Handle database security errors
        if (error.name === 'DatabaseSecurityError') {
            return NextResponse.json({
                error: error.message,
                code: error.code
            }, { status: 400 });
        }
        
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, {
    ...SECURITY_CONFIGS.HIGH_SECURITY,
    validationSchema: {
        query: CourseCompletionDeleteSchema
    }
});

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