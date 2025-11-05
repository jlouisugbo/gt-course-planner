/**
 * Course Prerequisite Validation System
 * Handles complex prerequisite logic parsing and validation for GT Course Planner
 */

import { Course, PrerequisiteStructure, PrerequisiteCondition, AcademicRecord } from '@/types/courses';

export interface PrerequisiteCheck {
  courseCode: string;
  isValid: boolean;
  missingPrereqs: string[];
  suggestedSemesters: number[];
  warnings: string[];
  errors: string[];
  corequisites?: string[]; // Courses that must be taken concurrently
  recommendations?: string[]; // Helpful suggestions
}

export interface ValidationContext {
  completedCourses: string[]; // Course codes of completed courses
  inProgressCourses: string[]; // Course codes currently being taken
  plannedCourses: Map<number, string[]>; // Semester ID -> Course codes
  currentSemester: number;
  userGPA?: number;
  totalCredits?: number;
  academicYear?: number; // For classification-based prerequisites
  academicRecords?: AcademicRecord[];
}

export interface PrerequisiteValidationResult {
  overall: boolean;
  checks: PrerequisiteCheck[];
  criticalBlocks: string[]; // Courses that are blocking graduation
  optimizations: string[]; // Suggestions for better course sequencing
}

/**
 * Main prerequisite validation engine
 */
export class PrerequisiteValidator {
  
  /**
   * Validate prerequisites for a specific course
   */
  static validateCourse(
    course: Course, 
    context: ValidationContext,
    targetSemester?: number
  ): PrerequisiteCheck {
    const result: PrerequisiteCheck = {
      courseCode: course.code,
      isValid: true,
      missingPrereqs: [],
      suggestedSemesters: [],
      warnings: [],
      errors: []
    };

    // Skip validation if no prerequisites
    if (!course.prerequisites || this.isEmptyPrerequisite(course.prerequisites)) {
      return result;
    }

    // Parse and validate prerequisite structure
    const validation = this.validatePrerequisiteStructure(
      course.prerequisites, 
      context,
      course.code
    );

    result.isValid = validation.satisfied;
    result.missingPrereqs = validation.missingCourses;
    result.warnings = validation.warnings;
    result.errors = validation.errors;

    // Generate suggestions if validation failed
    if (!result.isValid) {
      result.suggestedSemesters = this.suggestOptimalSemesters(
        result.missingPrereqs,
        context,
        targetSemester || context.currentSemester
      );
      
      result.recommendations = this.generateRecommendations(
        course,
        result.missingPrereqs,
        context
      );
    }

    // Check for corequisites
    result.corequisites = this.extractCorequisites(course.prerequisites);

    return result;
  }

  /**
   * Validate multiple courses (batch validation)
   */
  static validateCourses(
    courses: Course[],
    context: ValidationContext
  ): PrerequisiteValidationResult {
    const checks = courses.map(course => 
      this.validateCourse(course, context)
    );

    const overall = checks.every(check => check.isValid);
    const criticalBlocks = this.identifyCriticalBlocks(checks, context);
    const optimizations = this.generateOptimizations(checks, context);

    return {
      overall,
      checks,
      criticalBlocks,
      optimizations
    };
  }

  /**
   * Validate prerequisite structure recursively
   */
  private static validatePrerequisiteStructure(
    prereq: PrerequisiteStructure,
    context: ValidationContext,
    parentCourse: string
  ): {
    satisfied: boolean;
    missingCourses: string[];
    warnings: string[];
    errors: string[];
  } {
    const result = {
      satisfied: true,
      missingCourses: [] as string[],
      warnings: [] as string[],
      errors: [] as string[]
    };

    try {
      // Handle course-based prerequisites
      if (prereq.courses && prereq.courses.length > 0) {
        const courseValidation = this.validateCoursePrerequisites(
          prereq.courses,
          prereq.type || 'AND',
          context
        );
        
        result.satisfied = result.satisfied && courseValidation.satisfied;
        result.missingCourses.push(...courseValidation.missing);
      }

      // Handle condition-based prerequisites (GPA, credits, classification)
      if (prereq.conditions && prereq.conditions.length > 0) {
        const conditionValidation = this.validateConditions(
          prereq.conditions,
          context
        );
        
        result.satisfied = result.satisfied && conditionValidation.satisfied;
        result.warnings.push(...conditionValidation.warnings);
      }

      // Handle nested prerequisite structures
      if (prereq.nested && prereq.nested.length > 0) {
        const nestedResults = prereq.nested.map(nested =>
          this.validatePrerequisiteStructure(nested, context, parentCourse)
        );

        const logicType = prereq.type || 'AND';
        if (logicType === 'AND') {
          // All nested prerequisites must be satisfied
          const allSatisfied = nestedResults.every(r => r.satisfied);
          result.satisfied = result.satisfied && allSatisfied;
          
          nestedResults.forEach(r => {
            result.missingCourses.push(...r.missingCourses);
            result.warnings.push(...r.warnings);
            result.errors.push(...r.errors);
          });
        } else if (logicType === 'OR') {
          // At least one nested prerequisite must be satisfied
          const anySatisfied = nestedResults.some(r => r.satisfied);
          result.satisfied = result.satisfied && anySatisfied;
          
          if (!anySatisfied) {
            // If none satisfied, show the option with fewest missing courses
            const bestOption = nestedResults.reduce((best, current) =>
              current.missingCourses.length < best.missingCourses.length ? current : best
            );
            result.missingCourses.push(...bestOption.missingCourses);
            result.warnings.push(`Choose one option: ${nestedResults.length} alternatives available`);
          }
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Error validating prerequisites for ${parentCourse}: ${message}`);
      result.satisfied = false;
    }

    return result;
  }

  /**
   * Validate course-based prerequisites
   */
  private static validateCoursePrerequisites(
    requiredCourses: string[],
    logic: 'AND' | 'OR',
    context: ValidationContext
  ): { satisfied: boolean; missing: string[] } {
    const allUserCourses = new Set([
      ...context.completedCourses,
      ...context.inProgressCourses,
      // Include courses from previous semesters in plan
      ...Array.from(context.plannedCourses.entries())
        .filter(([semId]) => semId < context.currentSemester)
        .flatMap(([, courses]) => courses)
    ]);

    const missingCourses = requiredCourses.filter(course => 
      !allUserCourses.has(course)
    );

    if (logic === 'AND') {
      return {
        satisfied: missingCourses.length === 0,
        missing: missingCourses
      };
    } else { // OR logic
      const hasAnyCourse = requiredCourses.some(course => 
        allUserCourses.has(course)
      );
      
      return {
        satisfied: hasAnyCourse,
        missing: hasAnyCourse ? [] : requiredCourses // If none satisfied, all are "missing options"
      };
    }
  }

  /**
   * Validate condition-based prerequisites (GPA, credits, classification)
   */
  private static validateConditions(
    conditions: PrerequisiteCondition[],
    context: ValidationContext
  ): { satisfied: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let satisfied = true;

    for (const condition of conditions) {
      switch (condition.type) {
        case 'gpa':
          if (context.userGPA !== undefined) {
            const required = Number(condition.value);
            const operator = condition.operator || '>=';
            
            if (!this.compareValues(context.userGPA, required, operator)) {
              satisfied = false;
              warnings.push(`GPA requirement: ${operator} ${required} (current: ${context.userGPA})`);
            }
          } else {
            warnings.push('GPA requirement cannot be verified - no GPA data available');
          }
          break;

        case 'credit':
          if (context.totalCredits !== undefined) {
            const required = Number(condition.value);
            const operator = condition.operator || '>=';
            
            if (!this.compareValues(context.totalCredits, required, operator)) {
              satisfied = false;
              warnings.push(`Credit requirement: ${operator} ${required} (current: ${context.totalCredits})`);
            }
          } else {
            warnings.push('Credit requirement cannot be verified - no credit data available');
          }
          break;

        case 'classification':
          if (context.academicYear !== undefined) {
            const classification = this.getClassification(context.academicYear);
            const required = String(condition.value);
            
            if (classification !== required) {
              satisfied = false;
              warnings.push(`Classification requirement: ${required} (current: ${classification})`);
            }
          } else {
            warnings.push(`Classification requirement: ${condition.value} - cannot verify`);
          }
          break;

        case 'course':
          // This should be handled in course-based validation
          break;
      }
    }

    return { satisfied, warnings };
  }

  /**
   * Suggest optimal semesters for taking missing prerequisites
   */
  private static suggestOptimalSemesters(
    missingCourses: string[],
    context: ValidationContext,
    targetSemester: number
  ): number[] {
    const suggestions: number[] = [];

    // For each missing course, find the earliest possible semester
    for (const courseCode of missingCourses) {
      // Simple heuristic: suggest semester before target
      const suggestedSemester = Math.max(1, targetSemester - 1);
      
      if (!suggestions.includes(suggestedSemester)) {
        suggestions.push(suggestedSemester);
      }
    }

    return suggestions.sort((a, b) => a - b);
  }

  /**
   * Generate helpful recommendations for prerequisite issues
   */
  private static generateRecommendations(
    course: Course,
    missingPrereqs: string[],
    context: ValidationContext
  ): string[] {
    const recommendations: string[] = [];

    if (missingPrereqs.length > 0) {
      recommendations.push(
        `Complete these prerequisites first: ${missingPrereqs.join(', ')}`
      );

      // Check if any missing prereqs are basic/foundational
      const foundationalCourses = missingPrereqs.filter(code => 
        code.match(/^[A-Z]{2,4}\s?1\d{3}$/) // Pattern for 1000-level courses
      );

      if (foundationalCourses.length > 0) {
        recommendations.push(
          `Consider taking foundational courses early: ${foundationalCourses.join(', ')}`
        );
      }

      // Suggest prerequisite chain optimization
      if (missingPrereqs.length > 2) {
        recommendations.push(
          'Consider splitting prerequisites across multiple semesters for better workload distribution'
        );
      }
    }

    return recommendations;
  }

  /**
   * Extract corequisite courses from prerequisite structure
   */
  private static extractCorequisites(prereq: PrerequisiteStructure): string[] {
    // This would need to be enhanced based on how corequisites are stored
    // For now, return empty array as corequisites aren't explicitly modeled
    return [];
  }

  /**
   * Identify courses that are critical blocks to graduation
   */
  private static identifyCriticalBlocks(
    checks: PrerequisiteCheck[],
    context: ValidationContext
  ): string[] {
    // Identify courses with many missing prerequisites
    return checks
      .filter(check => !check.isValid && check.missingPrereqs.length > 0)
      .filter(check => check.missingPrereqs.length >= 2) // Threshold for "critical"
      .map(check => check.courseCode);
  }

  /**
   * Generate optimization suggestions for course sequencing
   */
  private static generateOptimizations(
    checks: PrerequisiteCheck[],
    context: ValidationContext
  ): string[] {
    const optimizations: string[] = [];

    // Check for commonly missing prerequisites
    const allMissingPrereqs = checks
      .flatMap(check => check.missingPrereqs)
      .reduce((counts, course) => {
        counts[course] = (counts[course] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    const commonlyMissing = Object.entries(allMissingPrereqs)
      .filter(([, count]) => count > 1)
      .map(([course]) => course);

    if (commonlyMissing.length > 0) {
      optimizations.push(
        `Consider prioritizing these prerequisites as they're needed for multiple courses: ${commonlyMissing.join(', ')}`
      );
    }

    return optimizations;
  }

  /**
   * Helper method to check if prerequisite structure is empty
   */
  private static isEmptyPrerequisite(prereq: PrerequisiteStructure): boolean {
    return (
      (!prereq.courses || prereq.courses.length === 0) &&
      (!prereq.conditions || prereq.conditions.length === 0) &&
      (!prereq.nested || prereq.nested.length === 0)
    );
  }

  /**
   * Helper method to compare values with operators
   */
  private static compareValues(
    actual: number, 
    required: number, 
    operator: string
  ): boolean {
    switch (operator) {
      case '>': return actual > required;
      case '>=': return actual >= required;
      case '<': return actual < required;
      case '<=': return actual <= required;
      case '=': return Math.abs(actual - required) < 0.01; // Float comparison
      default: return actual >= required; // Default to >=
    }
  }

  /**
   * Helper method to get classification from academic year
   */
  private static getClassification(academicYear: number): string {
    switch (academicYear) {
      case 1: return 'Freshman';
      case 2: return 'Sophomore';
      case 3: return 'Junior';
      case 4: return 'Senior';
      default: return 'Graduate';
    }
  }

  /**
   * Parse prerequisite text into structured format (utility for data import)
   */
  static parsePrerequisiteText(text: string): PrerequisiteStructure {
    // This would implement natural language parsing of prerequisite descriptions
    // For now, return a basic structure
    const courseMatches = text.match(/[A-Z]{2,4}\s?\d{4}/g) || [];
    
    return {
      type: text.includes(' or ') ? 'OR' : 'AND',
      courses: courseMatches,
      conditions: [],
      nested: []
    };
  }
}

/**
 * React Hook for prerequisite validation
 */
export const usePrerequisiteValidation = () => {
  const validateCourse = (course: Course, context: ValidationContext) => {
    return PrerequisiteValidator.validateCourse(course, context);
  };

  const validateCourses = (courses: Course[], context: ValidationContext) => {
    return PrerequisiteValidator.validateCourses(courses, context);
  };

  const validateSemesterPlan = (
    semesterCourses: Course[],
    context: ValidationContext,
    semesterId: number
  ) => {
    // Update context to include current semester courses as "in progress"
    const updatedContext = {
      ...context,
      currentSemester: semesterId,
      inProgressCourses: [
        ...context.inProgressCourses,
        ...semesterCourses.map(c => c.code)
      ]
    };

    return validateCourses(semesterCourses, updatedContext);
  };

  return {
    validateCourse,
    validateCourses,
    validateSemesterPlan,
    PrerequisiteValidator
  };
};

export default PrerequisiteValidator;