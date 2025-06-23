/**
 * Simplified types for GT 4-Year Planner
 * Removed: detailed scheduling, locations, instructors, finals, enrollment data
 * Kept: course identity, credits, prerequisites, attributes, basic availability
 */

/**
 * Primary JSON object returned by the API
 */
export interface TermData {
  /**
   * Contains information about each course for planning purposes
   * Course IDs are keys: "ACCT 2101", "CS 2340", etc.
   */
  courses: Record<string, Course>;
  /**
   * Contains shared reference data
   */
  caches: Caches;
  /**
   * When this data was last updated
   */
  updatedAt: Date;
  /**
   * Version number for the term data
   */
  version: number;
}

/**
 * Simplified caches - only essential planning data
 */
export interface Caches {
  /**
   * Types of classes: "Lecture", "Lab", "Studio", "Seminar", etc.
   * Essential for understanding course format
   */
  scheduleTypes: string[];
  /**
   * Campus locations: "Georgia Tech-Atlanta", "Online", "GT-Lorraine", etc.
   * Important for students planning around location
   */
  campuses: string[];
  /**
   * Course attributes: "ETH5", "LAB", "Honors Program", "Capstone", etc.
   * Critical for degree requirement tracking
   */
  attributes: string[];
  /**
   * Grading schemes: "Standard Letter Grade", "Pass/Fail", etc.
   * Useful for GPA planning
   */
  gradeBases: string[];
}

/**
 * Simplified course information focused on planning needs
 * Still using array/tuple format for consistency with existing data
 */
export type Course = [
  /**
   * Full course name: "Introduction to Object-Oriented Programming"
   */
  fullName: string,
  /**
   * Section information - simplified to just show availability and basic details
   */
  sections: Record<string, Section>,
  /**
   * Prerequisites tree - ESSENTIAL for degree planning validation
   */
  prerequisites: Prerequisites,
  /**
   * Course description - important for course selection
   */
  description: string | null
];

/**
 * Simplified section information for planning
 * Removed: detailed meeting times, instructors, room locations, finals
 * Kept: credits, format, campus, attributes
 */
export type Section = [
  /**
   * CRN for registration reference
   */
  crn: string,
  /**
   * Simplified availability info
   */
  isAvailable: boolean,
  /**
   * Credit hours - ESSENTIAL for degree planning
   */
  creditHours: number,
  /**
   * Schedule type index (Lecture, Lab, etc.)
   */
  scheduleTypeIndex: number,
  /**
   * Campus index (Atlanta, Online, etc.)
   */
  campusIndex: number,
  /**
   * Attribute indices (ETH5, LAB, etc.) - CRITICAL for requirements
   */
  attributeIndices: number[],
  /**
   * Grade base index for GPA calculations
   */
  gradeBaseIndex: number
];

// KEEP ALL PREREQUISITE TYPES - ESSENTIAL FOR PLANNING
export type MinimumGrade = "A" | "B" | "C" | "D" | "T" | "S" | "U" | "V";
export type PrerequisiteCourse = { id: string; grade?: MinimumGrade };
export type PrerequisiteClause = PrerequisiteCourse | PrerequisiteSet;
export type PrerequisiteOperator = "and" | "or";
export type PrerequisiteSet = [
  operator: PrerequisiteOperator,
  ...clauses: PrerequisiteClause[]
];
export type Prerequisites = PrerequisiteSet | [];

// SIMPLIFIED API RESPONSE TYPES - Remove unnecessary enrollment/scheduling data
export type SectionResponse = {
  // Essential identification
  courseReferenceNumber: string;
  subject: string;
  subjectCourse: string;
  sequenceNumber: string;
  courseTitle: string;
  
  // Essential planning data
  creditHours: number;
  campusDescription: string;
  scheduleTypeDescription: string;
  
  // Keep for basic availability checking
  openSection: boolean;
  
  // Simplified faculty info - just check if course has instructor assigned
  faculty: { displayName: string }[];
  
  // Simplified meeting info - just need to know if course is actually offered
  meetingsFaculty: MeetingResponse[];
  
  // KEEP - Essential for degree requirements
  sectionAttributes: SectionAttributeResponse[];
};

export interface SectionAttributeResponse {
  description: string;
  // Remove other fields not needed for planning
}

export type BannerResponse = {
  success: boolean;
  totalCount: number;
  data: SectionResponse[] | null;
  pageOffset: number;
  pageMaxSize: number;
  sectionsFetchedCount: number;
  pathMode: string | null;
  searchResultsConfigs: SearchResultsConfigResponse[] | null;
  ztcEncodedImage: string | null;
};

export type SearchResultsConfigResponse = {
  config: string;
  display: string;
  title: string;
  required: boolean;
  width: string;
};
export interface MeetingResponse {
  buildingDescription: boolean;
  meetingTime: {
    // Just need to know if there are actual meeting times scheduled
    beginTime: string | null;
    endTime: string | null;
    // Days offered - useful for conflict checking in planning
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    buildingDescription: string | null; // Keep for campus/location info
  };
}

// PLANNER-SPECIFIC TYPES
/**
 * Clean course data structure for the 4-year planner UI
 */
export interface PlannerCourse {
  id: string; // "CS 2340"
  title: string; // "Objects and Design"
  credits: number;
  prerequisites: Prerequisites;
  description: string | null;
  attributes: string[]; // ["ETH5"], ["LAB"], etc.
  campus: string; // "Atlanta", "Online"
  scheduleType: string; // "Lecture", "Lab", "Studio"
  isOffered: boolean;
  hasInstructor: boolean;
  daysOffered: string[]; // ["Monday", "Wednesday", "Friday"]
  gradeBase: string; // "Standard Letter Grade"
}

/**
 * Semester planning data
 */
export interface PlannedSemester {
  year: number;
  season: "Fall" | "Spring" | "Summer";
  courses: string[]; // Array of course IDs
  totalCredits: number;
}

/**
 * Student's 4-year plan
 */
export interface DegreePlan {
  studentId: string;
  degreeProgram: string;
  selectedThreads: string[];
  semesters: PlannedSemester[];
  completedCourses: CompletedCourse[];
  planSettings: {
    startYear: number;
    startSeason: "Fall" | "Spring" | "Summer";
    targetGraduation: string;
  };
}

export interface CompletedCourse {
  courseId: string;
  grade: string;
  semester: string;
  transferCredit?: boolean;
}

// REMOVE THESE TYPES (not needed for planning):
// - Location class
// - Meeting type (detailed scheduling)
// - MeetingsFacultyResponse (detailed instructor data)
// - FacultyResponse (detailed instructor info)
// - MeetingsResponse (detailed time/room data)
// - BannerResponse (API-specific)
// - SearchResultsConfigResponse (UI-specific)
// - All enrollment/capacity data
// - All room/building data
// - All final exam data
// - All detailed time period data

export interface Term {
  term: string;
  finalized: boolean;
}