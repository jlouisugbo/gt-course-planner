/**
 * Utility for generating semester data
 * Extracted from usePlannerStore to support API-first architecture
 */

import { SemesterData } from '@/types';

// Helper to validate season-year format
const isValidSeasonYear = (dateStr: string): boolean => {
  const pattern = /^(Fall|Spring|Summer)\s+\d{4}$/;
  return pattern.test(dateStr);
};

export interface GenerateSemestersParams {
  startDate: string; // Format: "Season YYYY" (e.g., "Fall 2024")
  graduationDate: string; // Format: "Season YYYY" (e.g., "Spring 2028")
}

/**
 * Generate semester data from start date to graduation date
 * Returns array of SemesterData objects suitable for bulk creation
 */
export function generateSemestersData(params: GenerateSemestersParams): Partial<SemesterData>[] {
  const { startDate, graduationDate } = params;

  // Comprehensive input validation
  if (!startDate || !graduationDate) {
    console.error("[generateSemesters] Invalid date format: dates are null/undefined", { startDate, graduationDate });
    return [];
  }

  if (typeof startDate !== 'string' || typeof graduationDate !== 'string') {
    console.error("[generateSemesters] Invalid date format: dates must be strings", {
      startDate: typeof startDate,
      graduationDate: typeof graduationDate
    });
    return [];
  }

  if (!isValidSeasonYear(startDate) || !isValidSeasonYear(graduationDate)) {
    const error = new Error(
      `[generateSemesters] Invalid date format. ` +
      `Expected 'Season YYYY' format (e.g., 'Fall 2024'). ` +
      `Received: start='${startDate}', graduation='${graduationDate}'. ` +
      `Please complete your profile with valid dates.`
    );
    console.error(error.message);
    throw error;
  }

  const [startSeason, startYear] = startDate.split(" ");
  const [gradSeason, gradYear] = graduationDate.split(" ");

  if (!startSeason || !startYear || !gradSeason || !gradYear) {
    console.error("[generateSemesters] Invalid date format: missing season or year after split", {
      startDate,
      startSeason,
      startYear,
      graduationDate,
      gradSeason,
      gradYear
    });
    return [];
  }

  const semesters: Partial<SemesterData>[] = [];
  const seasons = ["Fall", "Spring", "Summer"];

  let currentYear = parseInt(startYear);
  let currentSeasonIndex = seasons.indexOf(startSeason);
  let semesterCount = 0;

  // Safety check for invalid season
  if (currentSeasonIndex === -1) {
    console.error("Invalid start season:", startSeason);
    return [];
  }

  const finalYear = parseInt(gradYear);

  // Add extra semesters beyond graduation to ensure all options are available
  const extendedFinalYear = finalYear + 1;

  // Determine current semester based on current date
  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

  let currentSemesterSeason: string;
  if (currentMonth >= 8 && currentMonth <= 12) {
    currentSemesterSeason = 'Fall';
  } else if (currentMonth >= 1 && currentMonth <= 5) {
    currentSemesterSeason = 'Spring';
  } else {
    currentSemesterSeason = 'Summer';
  }

  // Generate ALL semesters from start to extended final year
  while (currentYear <= extendedFinalYear) {
    const season = seasons[currentSeasonIndex];
    // Unique semester ID generation: YYYYSS (year + season index)
    const semesterId = currentYear * 100 + currentSeasonIndex;

    // Check if this is the current semester
    const isCurrentSemester = currentYear === currentCalendarYear && season === currentSemesterSeason;

    semesters.push({
      id: semesterId,
      year: currentYear,
      season: season as "Fall" | "Spring" | "Summer",
      courses: [], // Always initialize as empty array
      totalCredits: 0,
      maxCredits: 18,
      isActive: isCurrentSemester,
      isCompleted: false,
      gpa: 0,
    });

    semesterCount++;
    currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
    if (currentSeasonIndex === 0) {
      currentYear++;
    }

    // Safety break to prevent infinite loops
    if (semesterCount > 25) {
      break;
    }
  }

  return semesters;
}
