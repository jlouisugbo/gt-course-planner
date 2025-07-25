import { Course } from '@/types/courses';

export interface PrereqCourse {
    id: string;
    grade: string;
}

export interface PrereqValidationResult {
    isValid: boolean;
    missingCourses: string[];
    satisfiedBy: string[];
}

// Parse prerequisite JSON structure
export function parsePrerequisites(prereqData: any): PrereqCourse[] {
    if (!prereqData || !Array.isArray(prereqData) || prereqData.length === 0) {
        return [];
    }

    const extractCourses = (data: any): PrereqCourse[] => {
        const courses: PrereqCourse[] = [];
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (typeof item === 'object' && item.id) {
                    courses.push({ id: item.id, grade: item.grade || 'D' });
                } else if (Array.isArray(item)) {
                    courses.push(...extractCourses(item));
                }
            });
        } else if (typeof data === 'object' && data.id) {
            courses.push({ id: data.id, grade: data.grade || 'D' });
        }
        
        return courses;
    };

    return extractCourses(prereqData);
}

// Evaluate if prerequisites are satisfied
export function evaluatePrerequisites(
    prereqData: any, 
    completedCourses: Set<string>, 
    plannedCourses: Set<string>
): PrereqValidationResult {
    if (!prereqData || !Array.isArray(prereqData) || prereqData.length === 0) {
        return { isValid: true, missingCourses: [], satisfiedBy: [] };
    }

    const evaluateCondition = (condition: any): { satisfied: boolean; missing: string[]; satisfied_by: string[] } => {
        if (!Array.isArray(condition)) {
            return { satisfied: true, missing: [], satisfied_by: [] };
        }

        const [operator, ...requirements] = condition;
        const missing: string[] = [];
        const satisfied_by: string[] = [];

        if (operator === 'and') {
            // All requirements must be satisfied
            let allSatisfied = true;
            for (const req of requirements) {
                if (typeof req === 'object' && req.id) {
                    const courseId = req.id;
                    if (completedCourses.has(courseId) || plannedCourses.has(courseId)) {
                        satisfied_by.push(courseId);
                    } else {
                        missing.push(courseId);
                        allSatisfied = false;
                    }
                } else if (Array.isArray(req)) {
                    const subResult = evaluateCondition(req);
                    if (!subResult.satisfied) {
                        missing.push(...subResult.missing);
                        allSatisfied = false;
                    } else {
                        satisfied_by.push(...subResult.satisfied_by);
                    }
                }
            }
            return { satisfied: allSatisfied, missing, satisfied_by };
        } else if (operator === 'or') {
            // At least one requirement must be satisfied
            let anySatisfied = false;
            const allMissing: string[] = [];
            
            for (const req of requirements) {
                if (typeof req === 'object' && req.id) {
                    const courseId = req.id;
                    if (completedCourses.has(courseId) || plannedCourses.has(courseId)) {
                        satisfied_by.push(courseId);
                        anySatisfied = true;
                        break; // One satisfied is enough for OR
                    } else {
                        allMissing.push(courseId);
                    }
                } else if (Array.isArray(req)) {
                    const subResult = evaluateCondition(req);
                    if (subResult.satisfied) {
                        satisfied_by.push(...subResult.satisfied_by);
                        anySatisfied = true;
                        break;
                    } else {
                        allMissing.push(...subResult.missing);
                    }
                }
            }
            
            return { 
                satisfied: anySatisfied, 
                missing: anySatisfied ? [] : allMissing,
                satisfied_by 
            };
        }

        return { satisfied: true, missing: [], satisfied_by: [] };
    };

    const result = evaluateCondition(prereqData);
    return {
        isValid: result.satisfied,
        missingCourses: result.missing,
        satisfiedBy: result.satisfied_by
    };
}

// Get recommended courses based on completed courses and degree program
export function getRecommendedCourses(
    allCourses: Course[],
    completedCourses: Set<string>,
    plannedCourses: Set<string>,
    programCourses: Set<string>
): Course[] {
    // First: Get all courses in degree program
    const programCoursesArray = allCourses.filter(course => 
        programCourses.has(course.code)
    );

    // Second: From program courses, get those that have completed/planned prereqs
    const recommendedCourses = programCoursesArray.filter(course => {
        // Skip if already completed or planned
        if (completedCourses.has(course.code) || plannedCourses.has(course.code)) {
            return false;
        }

        // Check if prerequisites are satisfied
        const prereqResult = evaluatePrerequisites(course.prerequisites, completedCourses, plannedCourses);
        return prereqResult.isValid;
    });

    // Sort by course code for consistency
    return recommendedCourses.sort((a, b) => a.code.localeCompare(b.code));
}

// Get courses that this course unlocks (from postrequisites of completed courses)
export function getUnlockedCourses(
    courseCode: string,
    allCourses: Course[]
): Course[] {
    return allCourses.filter(course => {
        if (!course.prerequisites || !Array.isArray(course.prerequisites)) {
            return false;
        }

        // Check if this courseCode appears in the course's prerequisites
        const prereqCourses = parsePrerequisites(course.prerequisites);
        return prereqCourses.some(prereqCourse => prereqCourse.id === courseCode);
    });
}