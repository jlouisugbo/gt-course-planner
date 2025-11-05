import { useMemo } from 'react';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { Course } from '@/types';
import { PrerequisiteValidator, ValidationContext, PrerequisiteCheck } from '@/lib/validation/prerequisites';
import { useAuth } from '@/providers/AuthProvider';

export interface PrerequisiteValidation {
  canAdd: boolean;
  missingPrereqs: string[];
  warnings: string[];
  isBlocked: boolean;
  suggestions?: string[];
  suggestedSemesters?: number[];
  corequisites?: string[];
}

export const usePrerequisiteValidation = () => {
  const { semesters } = usePlannerStore();
  const { userRecord } = useAuth();

  const getValidationForCourse = useMemo(() => {
    const validatePrerequisites = (course: Course, targetSemester?: number): PrerequisiteValidation => {
      // Build validation context from current planner state
      const allPlannedCourses = Object.values(semesters)
        .flatMap(s => s?.courses || [])
        .filter(c => c != null);

      const completedCourses = allPlannedCourses
        .filter(c => c && c.status === 'completed')
        .map(c => c.code);
      
      const inProgressCourses = allPlannedCourses
        .filter(c => c && c.status === 'in-progress')
        .map(c => c.code);

      // Build semester course map
      const plannedCourses = new Map<number, string[]>();
      Object.entries(semesters).forEach(([semId, sem]) => {
        if (sem?.courses) {
          plannedCourses.set(
            parseInt(semId),
            sem.courses.map(c => c.code)
          );
        }
      });

      // Check if course is already planned
      if (allPlannedCourses.some(c => c && c.code === course.code)) {
        return {
          canAdd: false,
          missingPrereqs: [],
          warnings: ['Course is already planned'],
          isBlocked: true,
        };
      }

      // Create validation context
      const context: ValidationContext = {
        completedCourses,
        inProgressCourses,
        plannedCourses,
        currentSemester: targetSemester || Object.keys(semesters).length + 1,
        userGPA: (userRecord as any)?.current_gpa ?? (userRecord as any)?.currentGPA,
        totalCredits: (userRecord as any)?.total_credits_earned ?? (userRecord as any)?.totalCreditsEarned,
        academicYear: (userRecord as any)?.year ? parseInt((userRecord as any).year) : undefined
      };

      // Use the new comprehensive validator
      const validation: PrerequisiteCheck = PrerequisiteValidator.validateCourse(
        course,
        context,
        targetSemester
      );

      return {
        canAdd: validation.isValid,
        missingPrereqs: validation.missingPrereqs,
        warnings: [...validation.warnings, ...validation.errors],
        isBlocked: !validation.isValid,
        suggestions: validation.recommendations,
        suggestedSemesters: validation.suggestedSemesters,
        corequisites: validation.corequisites
      };
    };

    return validatePrerequisites;
  }, [semesters, userRecord]);

  // Enhanced validation methods
  const validateSemesterPlan = (semesterCourses: Course[], semesterId: number) => {
    const context: ValidationContext = {
      completedCourses: Object.values(semesters)
        .flatMap(s => s?.courses || [])
        .filter(c => c?.status === 'completed')
        .map(c => c.code),
      inProgressCourses: [],
      plannedCourses: new Map(
        Object.entries(semesters).map(([id, sem]) => [
          parseInt(id),
          sem?.courses?.map(c => c.code) || []
        ])
      ),
      currentSemester: semesterId,
      userGPA: (userRecord as any)?.current_gpa ?? (userRecord as any)?.currentGPA,
      totalCredits: (userRecord as any)?.total_credits_earned ?? (userRecord as any)?.totalCreditsEarned,
      academicYear: (userRecord as any)?.year ? parseInt((userRecord as any).year) : undefined
    };

    return PrerequisiteValidator.validateCourses(semesterCourses, context);
  };

  const getPrerequisiteChain = (course: Course) => {
    // Build prerequisite chain for visualization
    const chain: string[] = [];
    const visited = new Set<string>();

    const buildChain = (courseCode: string, depth = 0) => {
      if (visited.has(courseCode) || depth > 10) return; // Prevent infinite loops
      visited.add(courseCode);
      
      // This would need course data lookup - simplified for now
      chain.push(courseCode);
    };

    if (course.prerequisites) {
      buildChain(course.code);
    }

    return chain;
  };

  return {
    validatePrerequisites: getValidationForCourse,
    validateSemesterPlan,
    getPrerequisiteChain,
    PrerequisiteValidator
  };
}