// types.ts

// Types from GT Scheduler crawler output
export interface Section {
  id: string;
  courseCode: string;
  sectionNumber: string;
  instructors: string[];
  location: string;
  times: Array<{
    days: string[];
    start: string;
    end: string;
  }>;
  term: string;
  campus: string;
}

export interface CrawlerCourse {
  id: string;
  title: string;
  school: string;
  subject: string;
  number: string;
  section: string;
  credits: number;
  prereqs: string;
  coreqs: string;
  description: string;
  grade_basis: string;
  instructors: string[];
  location: string;
  times: Array<{
    days: string[];
    start: string;
    end: string;
  }>;
  term: string;
  campus: string;
}

export interface Instructor {
  id: string;
  name: string;
  email?: string;
  sections?: string[];
}

export interface Location {
  id: string;
  building: string;
  room: string;
  campus?: string;
}

export interface Period {
  id: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface CrawlerOutput {
  courses: CrawlerCourse[];
  sections: Section[];
  instructors: Instructor[];
  locations: Location[];
  periods: Period[];
}

// Enhanced course attribute types
export interface CourseAttributes {
  subject: string;
  school: string;
  campus?: string;
  grade_basis?: string;
  difficulty?: number;
  is_lab?: boolean;
  is_studio?: boolean;
  ethics?: boolean;
  variable_credits?: boolean;
  credits_range?: string;
  [key: string]: unknown; // Allow for flexible attributes
}

// Simplified offering structure matching database
export interface CourseOfferings {
  fall: boolean;
  spring: boolean;
  summer: boolean;
}

// Detailed offering information (for future use)
export interface DetailedCourseOffering {
  semester: 'fall' | 'spring' | 'summer';
  year: number;
  sections: Section[];
  instructors: Instructor[];
  locations: Location[];
}

// Prerequisite types (matching database schema)
export interface PrerequisiteGroup {
  id?: number;
  course_id: number;
  group_type: "prerequisite" | "corequisite";
  logic_operator: "AND" | "OR";
  group_name?: string;
  description?: string;
  group_order?: number;
}

export interface PrerequisiteRequirement {
  id?: number;
  group_id: number;
  requirement_type: "course" | "credit_hours" | "gpa" | "classification" | "test_score";
  required_course_id?: number;
  alternative_courses?: number[];
  min_credit_hours?: number;
  min_gpa?: number;
  classification?: string;
  test_type?: string;
  min_score?: number;
  min_grade?: string;
  description?: string;
  requirement_order?: number;
}

// Parsed prerequisite structure (for display/logic)
export interface ParsedPrerequisite {
  group_name?: string;
  logic_operator: "AND" | "OR";
  requirements: Array<{
    type: string;
    course_code?: string;
    min_grade?: string;
    description?: string;
  }>;
}

// Database course type (matches your schema)
export interface Course {
  id?: number;
  code: string;
  title: string;
  credits: number;
  description: string;
  attributes: CourseAttributes;
  offerings: CourseOfferings;
  is_active?: boolean;
  created_at?: string;
}

// Extended course with prerequisite information (from export)
export interface ExportedCourse extends Course {
  id: number; // Required for exported courses
  prerequisites: ParsedPrerequisite[];
}

// Simplified course for frontend use
export interface SimplifiedCourse {
  code: string;
  title: string;
  credits: number;
  description: string;
  school?: string;
  subject?: string;
  offerings: CourseOfferings;
  hasPrerequisites: boolean;
}

// Course with full relationship data (for planning)
export interface CourseWithRelations extends Course {
  id: number;
  prerequisite_groups?: Array<PrerequisiteGroup & {
    prerequisite_requirements: PrerequisiteRequirement[];
  }>;
  corequisite_groups?: Array<PrerequisiteGroup & {
    prerequisite_requirements: PrerequisiteRequirement[];
  }>;
  sections?: Section[];
  instructors?: Instructor[];
}

// Degree program types
export interface DegreeProgram {
  id?: number;
  name: string;
  college: string;
  total_credits: number;
  catalog_year: number;
  core_requirements: Array<{
    course_code: string;
    credits: number;
  }>;
  elective_categories: Array<{
    name: string;
    credits_required: number;
    options: string[];
  }>;
  thread_options: Array<{
    name: string;
    credits_required: number;
    description?: string;
    required_courses?: string[];
    elective_options?: string[];
  }>;
  graduation_requirements?: {
    min_gpa?: number;
    residency_hours?: number;
    [key: string]: unknown
  };
  is_active?: boolean;
  created_at?: string;
}

// Planning types
export interface PlannedCourse {
  course_id: number;
  course_code: string;
  semester: 'fall' | 'spring' | 'summer';
  year: number;
  status: 'planned' | 'in_progress' | 'completed' | 'dropped';
  grade?: string;
  credits?: number;
  notes?: string;
}

export interface User {
  id?: number;
  auth_id: string;
  email: string;
  full_name: string;
  gt_username?: string;
  graduation_year?: number;
  degree_program_id?: number;
  selected_threads?: string[];
  planned_courses?: PlannedCourse[];
  plan_settings?: {
    plan_name?: string;
    starting_semester?: string;
    [key: string]: unknown;
  };
  created_at?: string;
  updated_at?: string;
}

// Import/Export types
export interface ImportResult {
  coursesProcessed: number;
  coursesInserted: number;
  coursesUpdated: number;
  prerequisitesCreated: number;
  errors: number;
}

export interface ExportOptions {
  includePrerequisites?: boolean;
  includeInactive?: boolean;
  format?: 'json' | 'csv' | 'simplified';
  subjects?: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search and filter types
export interface CourseSearchFilters {
  subjects?: string[];
  schools?: string[];
  credits?: number[];
  semesters?: ('fall' | 'spring' | 'summer')[];
  hasPrerequisites?: boolean;
  difficulty?: number[];
  search?: string;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  filters: {
    subjects: string[];
    schools: string[];
    creditOptions: number[];
  };
}