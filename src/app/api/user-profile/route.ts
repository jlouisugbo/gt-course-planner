import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSecureRoute, SECURITY_CONFIGS } from '@/lib/security/middleware';
import { UserProfileUpdateSchema } from '@/lib/validation/schemas';
import { safeGetUserProfile } from '@/lib/security/database';
import { createSecureErrorHandler } from '@/lib/security/errorHandler';

// Secure GET handler using security middleware
export const GET = createSecureRoute(async (request, context) => {
    try {
        const userRecord = await safeGetUserProfile(context.user!.id);
        
        if (!userRecord) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        // Get completed courses from normalized table using safe query
        // Use the internal database ID (bigint), not the auth UUID
        const { data: completions } = await supabaseAdmin()
            .from('user_course_completions')
            .select('course_code, grade, semester, credits')
            .eq('user_id', userRecord.id)
            .eq('status', 'completed');

        // Calculate GPA from normalized data
        let overallGPA = 0;
        let semesterGPAs: any[] = [];
        
        if (completions && completions.length > 0) {
            // Group by semester for GPA calculation
            const semesterMap = new Map<string, any>();
            
            completions.forEach((completion: any) => {
                if (!completion.grade) return;
                
                const gradePoints: Record<string, number> = {
                    'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
                };
                
                if (!(completion.grade in gradePoints)) return;
                
                if (!semesterMap.has(completion.semester)) {
                    semesterMap.set(completion.semester, {
                        semester: completion.semester,
                        totalPoints: 0,
                        totalCredits: 0,
                        courses: []
                    });
                }
                
                const sem = semesterMap.get(completion.semester);
                const credits = completion.credits || 3;
                const points = gradePoints[completion.grade as keyof typeof gradePoints] * credits;
                
                sem.totalPoints += points;
                sem.totalCredits += credits;
                sem.courses.push({
                    code: completion.course_code,
                    grade: completion.grade,
                    credits: credits
                });
            });
            
            // Calculate semester GPAs
            semesterGPAs = Array.from(semesterMap.values()).map(sem => ({
                semester: sem.semester,
                gpa: sem.totalCredits > 0 ? sem.totalPoints / sem.totalCredits : 0,
                credits: sem.totalCredits
            }));
            
            // Calculate overall GPA
            const totalPoints = Array.from(semesterMap.values()).reduce((sum, sem) => sum + sem.totalPoints, 0);
            const totalCredits = Array.from(semesterMap.values()).reduce((sum, sem) => sum + sem.totalCredits, 0);
            overallGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
        }

        // Get completed course codes
        const completedCourses = (completions || []).map(c => c.course_code).filter(Boolean);

        return NextResponse.json({
            id: userRecord.id,
            auth_id: userRecord.auth_id,
            email: userRecord.email,
            fullName: userRecord.full_name,
            gtUsername: userRecord.gt_username,
            graduationYear: userRecord.graduation_year,
            major: userRecord.major,
            minors: userRecord.minors || [],
            selectedThreads: userRecord.threads || [],
            degreeProgramId: userRecord.degree_program_id,
            completedCourses: completedCourses,
            completedGroups: userRecord.completed_groups || [],
            hasDetailedGPA: userRecord.has_detailed_gpa || completedCourses.length > 0,
            semesterGPAs: userRecord.semester_gpas || semesterGPAs,
            overallGPA: overallGPA,
            planSettings: userRecord.plan_settings || {},
            admin: userRecord.admin || false,
            createdAt: userRecord.created_at,
            updatedAt: userRecord.updated_at
        });
    } catch (error) {
        const errorHandler = createSecureErrorHandler('/api/user-profile', 'GET', context.user?.id);
        return errorHandler.handleError(error);
    }
}, SECURITY_CONFIGS.MEDIUM_SECURITY);

// Secure PUT handler with comprehensive validation
export const PUT = createSecureRoute(async (request, context) => {
    try {
        // Use the already validated data from security middleware
        const validatedData = context.validatedData!.body;
        // Perform an upsert (create if missing, update otherwise) using admin client
        const authId = context.user!.id;

        const upsertPayload: any = {
            auth_id: authId,
            email: validatedData.email ?? validatedData.email,
            full_name: validatedData.fullName ?? validatedData.full_name,
            major: validatedData.major ?? validatedData.major,
            minors: validatedData.minors ?? validatedData.minors,
            plan_settings: validatedData.planSettings ?? validatedData.plan_settings,
            graduation_year: validatedData.graduationYear ?? validatedData.graduation_year,
            degree_program_id: validatedData.degreeProgramId ?? validatedData.degree_program_id,
            gt_username: validatedData.gtUsername ?? validatedData.gt_username,
            has_detailed_gpa: validatedData.hasDetailedGPA ?? validatedData.has_detailed_gpa,
        };

        const { data: upserted, error: upsertError } = await supabaseAdmin()
            .from('users')
            .upsert(upsertPayload, { onConflict: 'auth_id' })
            .select()
            .single();

        if (upsertError) {
            throw upsertError;
        }

        return NextResponse.json({
            message: 'Profile upserted successfully',
            user: upserted
        });
    } catch (error: any) {
        const errorHandler = createSecureErrorHandler('/api/user-profile', 'PUT', context.user?.id);
        
        // Log academic data update for FERPA compliance
        errorHandler.logAcademicAccess('update_attempt', 'user_profile');
        
        return errorHandler.handleError(error);
    }
}, {
    ...SECURITY_CONFIGS.HIGH_SECURITY,
    validationSchema: {
        body: UserProfileUpdateSchema
    }
});