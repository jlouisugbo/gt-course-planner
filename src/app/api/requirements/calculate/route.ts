import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

// Calculate requirement progress and recommendations
export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get user data
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select(`
                id,
                major,
                minors,
                selected_threads,
                degree_program_id
            `)
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!(userRecord as any).degree_program_id) {
            return NextResponse.json({ 
                error: 'No degree program selected',
                requirementProgress: [],
                recommendations: []
            }, { status: 200 });
        }

        // Get completed courses from normalized table
        const { data: completions } = await supabaseAdmin()
            .from('user_course_completions')
            .select('course_code, credits, grade')
            .eq('user_id', (userRecord as any).id)
            .eq('status', 'completed');

        // Get degree program requirements
        const { data: degreeProgram } = await supabaseAdmin()
            .from('degree_programs')
            .select('requirements, total_credits')
            .eq('id', (userRecord as any).degree_program_id)
            .single();

        if (!degreeProgram) {
            return NextResponse.json({ error: 'Degree program not found' }, { status: 404 });
        }

        // Get all courses for prerequisite checking
        const { data: allCourses } = await supabaseAdmin()
            .from('courses')
            .select('id, code, title, prerequisites, credits, course_type');

        const courseMap = new Map((allCourses || []).map((c: any) => [String(c.code), c]));
        const completedSet = new Set((completions || []).map((c: any) => c.course_code).filter(Boolean) as string[]);

        // Calculate requirement progress
        const requirementProgress = calculateRequirementProgress(
            degreeProgram.requirements,
            completedSet
        );

        // Generate smart recommendations
        const recommendations = generateRecommendations(
            requirementProgress,
            completedSet,
            courseMap
        );

        // Calculate overall progress
        const totalRequired = degreeProgram.total_credits || 120;
        const completedCredits = Array.from(completedSet).reduce((sum: number, code: string) => {
            const course = courseMap.get(code);
            return sum + (typeof course?.credits === 'number' ? course.credits : 0);
        }, 0);

        return NextResponse.json({
            requirementProgress,
            recommendations,
            overallProgress: {
                completedCredits,
                totalRequired,
                percentComplete: Math.min(100, (Number(completedCredits) / Number(totalRequired)) * 100),
                remainingCredits: Math.max(0, Number(totalRequired) - Number(completedCredits))
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function calculateRequirementProgress(
    requirements: any,
    completedCourses: Set<string>
): any[] {
    if (!requirements || !Array.isArray(requirements)) return [];

    return requirements.map((category: any) => {
        const categoryProgress = {
            id: category.id,
            name: category.name,
            type: category.type,
            creditsRequired: category.creditsRequired || 0,
            creditsCompleted: 0,
            coursesRequired: category.coursesRequired || 0,
            coursesCompleted: 0,
            isComplete: false,
            subcategories: []
        };

        // Process subcategories
        if (category.subcategories && Array.isArray(category.subcategories)) {
            categoryProgress.subcategories = category.subcategories.map((sub: any) => {
                const subProgress = {
                    id: sub.id,
                    name: sub.name,
                    creditsRequired: sub.creditsRequired || 0,
                    creditsCompleted: 0,
                    coursesRequired: sub.coursesRequired || 0,
                    coursesCompleted: 0,
                    isComplete: false,
                    courses: []
                };

                // Check courses in subcategory
                if (sub.courses && Array.isArray(sub.courses)) {
                    sub.courses.forEach((course: any) => {
                        if (course.type === 'regular' && completedCourses.has(course.code)) {
                            subProgress.coursesCompleted++;
                            subProgress.creditsCompleted += course.credits || 3;
                        } else if (course.type === 'or-group' && course.options) {
                            // Check if any option is completed
                            const completed = course.options.find((opt: any) => 
                                completedCourses.has(opt.code)
                            );
                            if (completed) {
                                subProgress.coursesCompleted++;
                                subProgress.creditsCompleted += completed.credits || 3;
                            }
                        }
                    });
                }

                subProgress.isComplete = 
                    subProgress.coursesCompleted >= subProgress.coursesRequired ||
                    subProgress.creditsCompleted >= subProgress.creditsRequired;

                return subProgress;
            });
        }

        // Calculate category totals
        categoryProgress.coursesCompleted = categoryProgress.subcategories
            .reduce((sum: number, sub: any) => sum + sub.coursesCompleted, 0);
        categoryProgress.creditsCompleted = categoryProgress.subcategories
            .reduce((sum: number, sub: any) => sum + sub.creditsCompleted, 0);
        
        categoryProgress.isComplete = 
            categoryProgress.coursesCompleted >= categoryProgress.coursesRequired ||
            categoryProgress.creditsCompleted >= categoryProgress.creditsRequired;

        return categoryProgress;
    });
}

function generateRecommendations(
    requirementProgress: any[],
    completedCourses: Set<string>,
    courseMap: Map<string, any>
): any[] {
    const recommendations: any[] = [];
    const recommendedCodes = new Set<string>();

    // Find incomplete requirements
    requirementProgress.forEach(category => {
        if (!category.isComplete && category.subcategories) {
            category.subcategories.forEach((sub: any) => {
                if (!sub.isComplete && sub.courses) {
                    sub.courses.forEach((course: any) => {
                        if (course.type === 'regular' && 
                            !completedCourses.has(course.code) &&
                            !recommendedCodes.has(course.code)) {
                            
                            const fullCourse = courseMap.get(course.code);
                            if (fullCourse && checkPrerequisites(fullCourse, completedCourses)) {
                                recommendations.push({
                                    courseCode: course.code,
                                    courseTitle: fullCourse.title,
                                    credits: fullCourse.credits,
                                    reason: `Required for ${category.name} - ${sub.name}`,
                                    priority: 'high',
                                    category: category.name,
                                    subcategory: sub.name
                                });
                                recommendedCodes.add(course.code);
                            }
                        }
                    });
                }
            });
        }
    });

    // Sort by priority and limit to top 10
    return recommendations.slice(0, 10);
}

function checkPrerequisites(course: any, completedCourses: Set<string>): boolean {
    if (!course.prerequisites || course.prerequisites.length === 0) return true;
    
    // Simple prerequisite check - can be made more sophisticated
    return course.prerequisites.every((prereq: any) => {
        if (typeof prereq === 'string') {
            return completedCourses.has(prereq);
        } else if (prereq.type === 'or' && prereq.courses) {
            return prereq.courses.some((c: string) => completedCourses.has(c));
        }
        return true;
    });
}