import { useMemo } from 'react';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { Course } from '@/types/courses';

export interface PrerequisiteValidation {
  canAdd: boolean;
  missingPrereqs: string[];
  warnings: string[];
  isBlocked: boolean;
}

export const usePrerequisiteValidation = () => {
  const { semesters } = usePlannerStore();

  const getValidationForCourse = useMemo(() => {
    const validatePrerequisites = (course: Course): PrerequisiteValidation => {
      const allPlannedCourses = Object.values(semesters).flatMap(s => s.courses);
      const completedCourses = allPlannedCourses.filter(c => c.status === 'completed').map(c => c.code);
      const plannedCourses = allPlannedCourses.filter(c => c.status === 'in-progress' || c.status === 'planned').map(c => c.code);

      const missingPrereqs: string[] = [];
      const warnings: string[] = [];

      if(allPlannedCourses.some(c => c.code === course.code)){
        return {
          canAdd: false,
          missingPrereqs: [],
          warnings: ['Course is already planned'],
          isBlocked: true,
        }
      }

      //check prereqs
      course.prerequisites.forEach(prereq => {
        if (prereq.type === 'course' && prereq.courses) {
          const missingCourses = prereq.courses.filter(code =>
            !completedCourses.includes(code) && !plannedCourses.includes(code)
          );
          if (missingCourses.length > 0) {
            if(prereq.logic === 'OR' && missingCourses.length === prereq.courses.length) {
              // all OR prereqs are missing
              missingPrereqs.push(`One of: ${prereq.courses.join(', ')}`);
            } else if (prereq.logic === 'AND' || !prereq.logic) {
              //Some AND prereqs are missing
              missingPrereqs.push(...missingCourses);
            }
          }

          const plannedButNotCompleted = prereq.courses.filter(code =>
            plannedCourses.includes(code) && !completedCourses.includes(code)
          );

          if(plannedButNotCompleted.length > 0) {
            warnings.push(`Prerequisites planned but not completed: ${plannedButNotCompleted.join(', ')}`);
          }
        }
      });

      const canAdd = missingPrereqs.length === 0;
      const isBlocked = missingPrereqs.length > 0 || warnings.length > 0;

      return {
        canAdd,
        missingPrereqs,
        warnings,
        isBlocked,
      };
    }

    return validatePrerequisites;
  }, [semesters]);


  return {
    validatePrerequisites: getValidationForCourse
  };
}