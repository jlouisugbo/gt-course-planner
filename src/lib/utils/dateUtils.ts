/**
 * Centralized Date Utilities for GT Course Planner
 *
 * Handles conversion between various date formats and the application's
 * internal "Season YYYY" format used for semester generation.
 *
 * Supported input formats:
 * - "Season YYYY" (e.g., "Fall 2024", "Spring 2026") - pass through
 * - "YYYY-MM-DD" (e.g., "2026-05-15") - convert to season based on month
 * - Number (e.g., 2026) - convert to default season (Spring)
 * - null/undefined/empty string - return null
 */

/**
 * Season definitions based on Georgia Tech academic calendar
 */
const SEASONS = {
  FALL: 'Fall',
  SPRING: 'Spring',
  SUMMER: 'Summer'
} as const;

/**
 * Month ranges for each season
 */
const SEASON_MONTH_RANGES = {
  [SEASONS.SPRING]: { start: 0, end: 4 },   // Jan-May
  [SEASONS.SUMMER]: { start: 5, end: 7 },   // Jun-Aug
  [SEASONS.FALL]: { start: 8, end: 11 }     // Sep-Dec
};

/**
 * Validates if a string is in the correct "Season YYYY" format
 *
 * @param date - The date string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSeasonYear("Fall 2024") // true
 * isValidSeasonYear("2024-05-15") // false
 * isValidSeasonYear("Invalid") // false
 */
export function isValidSeasonYear(date: string): boolean {
  if (typeof date !== 'string' || !date.trim()) {
    return false;
  }

  // Must match pattern: "Season YYYY"
  const seasonYearPattern = /^(Fall|Spring|Summer)\s+\d{4}$/;
  return seasonYearPattern.test(date);
}

/**
 * Converts a month number (0-11) to its corresponding season
 *
 * @param month - Month number (0 = January, 11 = December)
 * @returns The season name
 */
function monthToSeason(month: number): string {
  if (month >= SEASON_MONTH_RANGES[SEASONS.SPRING].start &&
      month <= SEASON_MONTH_RANGES[SEASONS.SPRING].end) {
    return SEASONS.SPRING;
  }
  if (month >= SEASON_MONTH_RANGES[SEASONS.SUMMER].start &&
      month <= SEASON_MONTH_RANGES[SEASONS.SUMMER].end) {
    return SEASONS.SUMMER;
  }
  return SEASONS.FALL;
}

/**
 * Converts a YYYY-MM-DD date string to "Season YYYY" format
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date in "Season YYYY" format
 * @throws Error if date format is invalid
 *
 * @example
 * dateToSeason("2026-05-15") // "Spring 2026"
 * dateToSeason("2024-09-01") // "Fall 2024"
 */
export function dateToSeason(dateString: string): string {
  // Validate input
  if (typeof dateString !== 'string' || !dateString.trim()) {
    throw new Error('dateToSeason: Input must be a non-empty string');
  }

  // Parse date
  const date = new Date(dateString);

  // Check if valid date
  if (isNaN(date.getTime())) {
    throw new Error(`dateToSeason: Invalid date format "${dateString}". Expected YYYY-MM-DD.`);
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const season = monthToSeason(month);

  return `${season} ${year}`;
}

/**
 * Converts a year number to "Season YYYY" format
 * Defaults to Spring semester for the given year
 *
 * @param year - Year as a number
 * @param defaultSeason - Season to use (defaults to Spring)
 * @returns Date in "Season YYYY" format
 * @throws Error if year is invalid
 *
 * @example
 * yearToSeason(2026) // "Spring 2026"
 * yearToSeason(2024, "Fall") // "Fall 2024"
 */
export function yearToSeason(year: number, defaultSeason: string = SEASONS.SPRING): string {
  // Validate year
  if (typeof year !== 'number' || isNaN(year)) {
    throw new Error(`yearToSeason: Invalid year "${year}". Expected a number.`);
  }

  // Reasonable year range (1900-2100)
  if (year < 1900 || year > 2100) {
    throw new Error(`yearToSeason: Year ${year} is out of reasonable range (1900-2100)`);
  }

  // Validate season
  const validSeasons = Object.values(SEASONS);
  if (!validSeasons.includes(defaultSeason as any)) {
    throw new Error(`yearToSeason: Invalid season "${defaultSeason}". Must be Fall, Spring, or Summer.`);
  }

  return `${defaultSeason} ${year}`;
}

/**
 * Main conversion function that handles all date format inputs
 * Converts any supported format to "Season YYYY" format
 *
 * @param date - Date in any supported format (string, number, null, undefined)
 * @returns Date in "Season YYYY" format, or null if input is null/undefined/empty
 * @throws Error if date format is unsupported or invalid
 *
 * @example
 * convertToSeasonYear("Fall 2024") // "Fall 2024" (pass through)
 * convertToSeasonYear("2026-05-15") // "Spring 2026"
 * convertToSeasonYear(2026) // "Spring 2026"
 * convertToSeasonYear(null) // null
 * convertToSeasonYear("") // null
 * convertToSeasonYear("invalid") // throws Error
 */
export function convertToSeasonYear(
  date: string | number | null | undefined
): string | null {
  // Handle null/undefined/empty
  if (date === null || date === undefined) {
    return null;
  }

  if (typeof date === 'string' && !date.trim()) {
    return null;
  }

  // Handle string input
  if (typeof date === 'string') {
    const trimmedDate = date.trim();

    // Already in correct format - pass through
    if (isValidSeasonYear(trimmedDate)) {
      return trimmedDate;
    }

    // Try to parse as YYYY-MM-DD
    if (trimmedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateToSeason(trimmedDate);
    }

    // Try to parse as just year string "2026"
    const yearMatch = trimmedDate.match(/^(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      return yearToSeason(year);
    }

    // Unsupported format
    throw new Error(
      `Invalid date format: "${trimmedDate}". ` +
      `Expected formats: "Season YYYY" (e.g., "Fall 2024"), ` +
      `"YYYY-MM-DD" (e.g., "2024-08-20"), or year number (e.g., 2024).`
    );
  }

  // Handle number input
  if (typeof date === 'number') {
    return yearToSeason(date);
  }

  // Unsupported type
  throw new Error(
    `Invalid date type: ${typeof date}. Expected string, number, null, or undefined.`
  );
}

/**
 * Gets the current semester based on today's date
 *
 * @returns Current semester in "Season YYYY" format
 *
 * @example
 * getCurrentSemester() // "Fall 2024" (if called in September 2024)
 */
export function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const season = monthToSeason(month);

  return `${season} ${year}`;
}

/**
 * Validates and converts dates with user-friendly error messages
 * Use this in components that need to show errors to users
 *
 * @param date - Date to convert
 * @param fieldName - Name of the field (for error messages)
 * @returns Converted date in "Season YYYY" format
 * @throws Error with user-friendly message
 *
 * @example
 * validateAndConvertDate(userInput, "Graduation Date")
 * // throws: "Graduation Date is invalid. Please select a valid date."
 */
export function validateAndConvertDate(
  date: string | number | null | undefined,
  fieldName: string = 'Date'
): string {
  try {
    const converted = convertToSeasonYear(date);

    if (!converted) {
      throw new Error(`${fieldName} is required. Please provide a valid date.`);
    }

    return converted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `${fieldName} is invalid. ${error.message} ` +
        `Please update your profile with a valid date.`
      );
    }
    throw error;
  }
}

/**
 * Extracts the year from a "Season YYYY" date string
 *
 * @param seasonYear - Date in "Season YYYY" format
 * @returns Year as number
 * @throws Error if format is invalid
 *
 * @example
 * extractYear("Fall 2024") // 2024
 */
export function extractYear(seasonYear: string): number {
  if (!isValidSeasonYear(seasonYear)) {
    throw new Error(`Invalid season year format: "${seasonYear}"`);
  }

  const parts = seasonYear.split(' ');
  return parseInt(parts[1], 10);
}

/**
 * Extracts the season from a "Season YYYY" date string
 *
 * @param seasonYear - Date in "Season YYYY" format
 * @returns Season name
 * @throws Error if format is invalid
 *
 * @example
 * extractSeason("Fall 2024") // "Fall"
 */
export function extractSeason(seasonYear: string): string {
  if (!isValidSeasonYear(seasonYear)) {
    throw new Error(`Invalid season year format: "${seasonYear}"`);
  }

  const parts = seasonYear.split(' ');
  return parts[0];
}
