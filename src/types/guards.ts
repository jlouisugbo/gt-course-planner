/**
 * Runtime Type Guards
 *
 * Provides runtime validation for critical data types to prevent invalid data
 * from causing errors in the application. Especially important for date formats.
 */

import { isValidSeasonYear } from '@/lib/utils/dateUtils';

/**
 * Assert that a value is a valid "Season YYYY" formatted date
 * Throws an error if validation fails
 *
 * @param date - The value to validate
 * @param fieldName - Name of the field for error messages
 * @throws Error if date is not in valid format
 *
 * @example
 * assertValidSeasonYear(userInput, "Start Date");
 * // If invalid, throws: "Start Date must be in 'Season YYYY' format (e.g., 'Fall 2024')"
 */
export function assertValidSeasonYear(date: unknown, fieldName: string = 'Date'): asserts date is string {
  if (typeof date !== 'string') {
    throw new Error(
      `${fieldName} must be a string. ` +
      `Received: ${typeof date}`
    );
  }

  if (!isValidSeasonYear(date)) {
    throw new Error(
      `${fieldName} must be in "Season YYYY" format (e.g., "Fall 2024"). ` +
      `Received: "${date}"`
    );
  }
}

/**
 * Type guard to check if a value is a valid season year string
 * Does not throw, returns boolean
 *
 * @param date - The value to check
 * @returns true if date is a valid "Season YYYY" string
 *
 * @example
 * if (isSeasonYearString(input)) {
 *   // TypeScript knows input is string here
 *   processDate(input);
 * }
 */
export function isSeasonYearString(date: unknown): date is string {
  return typeof date === 'string' && isValidSeasonYear(date);
}

/**
 * Assert that a user profile has required fields
 * Throws an error if validation fails
 *
 * @param profile - The profile object to validate
 * @throws Error with details about missing fields
 *
 * @example
 * assertValidUserProfile(profile);
 * // If invalid, throws with list of missing fields
 */
export function assertValidUserProfile(profile: unknown): asserts profile is {
  full_name: string;
  email: string;
  major: string;
} {
  if (!profile || typeof profile !== 'object') {
    throw new Error('User profile must be an object');
  }

  const requiredFields: Array<keyof { full_name: string; email: string; major: string }> = [
    'full_name',
    'email',
    'major'
  ];

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!(field in profile) || !(profile as any)[field]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `User profile is missing required fields: ${missingFields.join(', ')}. ` +
      `Please complete your profile to continue.`
    );
  }
}

/**
 * Type guard to check if a profile has complete date information
 * Does not throw, returns boolean
 *
 * @param profile - The profile object to check
 * @returns true if profile has valid start and graduation dates
 *
 * @example
 * if (hasValidDates(profile)) {
 *   generateSemesters(profile.start_date, profile.graduation_date);
 * } else {
 *   showProfileSetupPrompt();
 * }
 */
export function hasValidDates(profile: any): profile is {
  start_date: string;
  expected_graduation: string;
} {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  // Check plan_settings for dates
  const planSettings = profile.plan_settings || {};

  // Try to find start date
  const startDate = planSettings.starting_semester ||
                    planSettings.start_date ||
                    profile.startDate ||
                    profile.start_date;

  // Try to find graduation date
  const gradDate = planSettings.expected_graduation ||
                   profile.expectedGraduation ||
                   profile.expected_graduation;

  // Both must exist and be non-empty strings
  return Boolean(
    startDate &&
    typeof startDate === 'string' &&
    startDate.trim() !== '' &&
    gradDate &&
    typeof gradDate === 'string' &&
    gradDate.trim() !== ''
  );
}

/**
 * Assert that semester data is valid
 * Throws an error if validation fails
 *
 * @param semesterData - The semester object to validate
 * @throws Error if semester is missing required fields
 */
export function assertValidSemester(semesterData: unknown): asserts semesterData is {
  id: number;
  year: number;
  season: 'Fall' | 'Spring' | 'Summer';
  courses: any[];
} {
  if (!semesterData || typeof semesterData !== 'object') {
    throw new Error('Semester data must be an object');
  }

  const semester = semesterData as any;

  if (typeof semester.id !== 'number') {
    throw new Error('Semester must have a numeric ID');
  }

  if (typeof semester.year !== 'number') {
    throw new Error('Semester must have a numeric year');
  }

  const validSeasons = ['Fall', 'Spring', 'Summer'];
  if (!semester.season || !validSeasons.includes(semester.season)) {
    throw new Error(`Semester season must be one of: ${validSeasons.join(', ')}`);
  }

  if (!Array.isArray(semester.courses)) {
    throw new Error('Semester must have a courses array');
  }
}

/**
 * Validate that a course completion has required fields
 * Throws an error if validation fails
 *
 * @param completion - The course completion object to validate
 * @throws Error if completion is missing required fields
 */
export function assertValidCourseCompletion(completion: unknown): asserts completion is {
  course_id: number;
  status: 'completed' | 'in_progress' | 'planned';
  semester: string;
} {
  if (!completion || typeof completion !== 'object') {
    throw new Error('Course completion must be an object');
  }

  const comp = completion as any;

  if (typeof comp.course_id !== 'number' && typeof comp.course_id !== 'string') {
    throw new Error('Course completion must have a course_id');
  }

  const validStatuses = ['completed', 'in_progress', 'planned'];
  if (!comp.status || !validStatuses.includes(comp.status)) {
    throw new Error(`Course status must be one of: ${validStatuses.join(', ')}`);
  }

  if (typeof comp.semester !== 'string' || !comp.semester) {
    throw new Error('Course completion must have a semester string');
  }
}

/**
 * Safe extraction of error message from unknown error
 *
 * @param error - The error object (unknown type)
 * @returns A user-safe error message
 *
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   showToast(message);
 * }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }

  return 'An unknown error occurred';
}

/**
 * Check if an error is a date validation error
 * Useful for showing specific error messages to users
 *
 * @param error - The error to check
 * @returns true if error is related to date validation
 *
 * @example
 * try {
 *   generateSemesters(start, end);
 * } catch (error) {
 *   if (isDateValidationError(error)) {
 *     showDateSetupPrompt();
 *   } else {
 *     showGenericError();
 *   }
 * }
 */
export function isDateValidationError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('date') ||
         message.includes('Season YYYY') ||
         message.includes('semester') ||
         message.includes('graduation');
}

/**
 * Check if an error is a profile completion error
 *
 * @param error - The error to check
 * @returns true if error is related to incomplete profile
 */
export function isProfileIncompleteError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('profile') ||
         message.includes('missing required fields') ||
         message.includes('complete your profile');
}
