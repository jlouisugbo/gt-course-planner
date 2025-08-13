/**
 * Degree Requirements Types
 * Phase 2.1.2 - GT Course Planner Enhancement
 */

export type RequirementType = 'core' | 'major' | 'thread' | 'minor' | 'elective' | 'free_elective';
export type EnrollmentType = 'primary' | 'secondary' | 'minor';

export interface DegreeProgram {
  id: number;
  name: string;
  code: string; // e.g., 'CS', 'EE', 'ME'
  college: string;
  description?: string;
  totalCredits: number;
  minGpa: number;
  catalogYear?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RequirementCategory {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  icon?: string; // Icon name for UI
  color: string; // Color hex code
}

export interface FlexibleOption {
  name: string;
  description?: string;
  courses: string[]; // Course codes
  requiredCount: number; // How many courses to choose
  minCredits?: number;
  category?: string;
}

export interface DegreeRequirement {
  id: number;
  degreeProgramId: number;
  requirementType: RequirementType;
  requirementName: string;
  description?: string;
  requiredCredits: number;
  requiredCourses: string[]; // Specific required courses
  flexibleOptions: FlexibleOption[]; // "Choose X of Y" options
  minGpa?: number;
  categoryId?: number;
  category?: RequirementCategory;
  sortOrder: number;
  isRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDegreeProgram {
  id: number;
  userId: number;
  degreeProgramId: number;
  degreeProgram?: DegreeProgram;
  enrollmentType: EnrollmentType;
  catalogYear?: number;
  expectedGraduationYear?: number;
  isActive: boolean;
  createdAt?: Date;
}

export interface UserRequirementProgress {
  id: number;
  userId: number;
  requirementId: number;
  requirement?: DegreeRequirement;
  completedCredits: number;
  completedCourses: string[];
  inProgressCourses: string[];
  plannedCourses: string[];
  isSatisfied: boolean;
  completionPercentage: number;
  lastUpdated?: Date;
}

export interface ThreadRequirement {
  id: number;
  threadName: string;
  degreeProgramId: number;
  description?: string;
  requiredCredits: number;
  requiredCourses: string[];
  electiveOptions: FlexibleOption[];
  isActive: boolean;
  createdAt?: Date;
}

export interface UserThreadSelection {
  id: number;
  userId: number;
  threadId: number;
  thread?: ThreadRequirement;
  selectionOrder: number; // 1 = primary, 2 = secondary
  isActive: boolean;
  createdAt?: Date;
}

// Computed interfaces for UI
export interface RequirementProgress {
  requirement: DegreeRequirement;
  progress: UserRequirementProgress;
  status: 'completed' | 'in-progress' | 'not-started' | 'blocked';
  remainingCredits: number;
  remainingCourses: string[];
  availableOptions: FlexibleOption[];
  nextCourses: string[]; // Suggested next courses
}

export interface DegreeProgressSummary {
  degreeProgramId: number;
  degreeProgram: DegreeProgram;
  totalCreditsRequired: number;
  totalCreditsCompleted: number;
  totalCreditsInProgress: number;
  totalCreditsPlanned: number;
  overallCompletionPercentage: number;
  estimatedGraduationSemester: string;
  requirementProgress: RequirementProgress[];
  categoryProgress: CategoryProgress[];
  threadProgress: ThreadProgress[];
  warnings: string[];
  blockers: string[];
  recommendations: string[];
}

export interface CategoryProgress {
  category: RequirementCategory;
  requirements: RequirementProgress[];
  totalCreditsRequired: number;
  totalCreditsCompleted: number;
  completionPercentage: number;
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface ThreadProgress {
  thread: ThreadRequirement;
  selection?: UserThreadSelection;
  creditsCompleted: number;
  creditsRequired: number;
  completionPercentage: number;
  completedCourses: string[];
  availableCourses: string[];
  status: 'completed' | 'in-progress' | 'not-started';
}

// API request/response types
export interface RequirementCalculationRequest {
  userId: number;
  degreeProgramId?: number;
  includeProjections?: boolean;
  semesterData?: Array<{
    id: number;
    courses: string[];
  }>;
}

export interface RequirementCalculationResponse {
  success: boolean;
  data: DegreeProgressSummary;
  timestamp: string;
}

export interface RequirementUpdateRequest {
  userId: number;
  requirementId: number;
  completedCourses: string[];
  inProgressCourses?: string[];
  plannedCourses?: string[];
}

// Validation and suggestion types
export interface RequirementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface CourseRequirementMatch {
  courseCode: string;
  matchedRequirements: {
    requirementId: number;
    requirementName: string;
    matchType: 'required' | 'flexible' | 'elective';
    credits: number;
  }[];
  isDoubleCountable: boolean;
  warnings: string[];
}

// Settings and preferences
export interface RequirementDisplaySettings {
  groupByCategory: boolean;
  showCompletedRequirements: boolean;
  showProgressBars: boolean;
  showCourseDetails: boolean;
  sortBy: 'category' | 'completion' | 'priority';
  expandedCategories: number[];
}

// Historical tracking
export interface RequirementProgressSnapshot {
  id: number;
  userId: number;
  snapshotDate: Date;
  degreeProgramId: number;
  progressData: DegreeProgressSummary;
  semester: string;
  notes?: string;
}

// Advanced requirement types
export interface ConditionalRequirement extends DegreeRequirement {
  conditions: {
    type: 'gpa' | 'credits' | 'classification' | 'course_completion';
    value: string | number;
    operator: '>=' | '>' | '<=' | '<' | '=' | '!=';
  }[];
}

export interface CreditBucketRequirement extends DegreeRequirement {
  buckets: {
    name: string;
    minCredits: number;
    maxCredits?: number;
    allowedCourses: string[];
    description?: string;
  }[];
}

// For the legacy compatibility
export interface MajorRequirement extends DegreeRequirement {
  majorCode: string;
}

export interface MinorRequirement extends DegreeRequirement {
  minorCode: string;
}

export interface ThreadRequirement extends DegreeRequirement {
  threadCode: string;
}

// Export all types
export type {
  RequirementType,
  EnrollmentType,
  DegreeProgram,
  RequirementCategory,
  FlexibleOption,
  DegreeRequirement,
  UserDegreeProgram,
  UserRequirementProgress,
  UserThreadSelection,
  RequirementProgress,
  DegreeProgressSummary,
  CategoryProgress,
  ThreadProgress,
  RequirementCalculationRequest,
  RequirementCalculationResponse,
  RequirementUpdateRequest,
  RequirementValidation,
  CourseRequirementMatch,
  RequirementDisplaySettings,
  RequirementProgressSnapshot,
  ConditionalRequirement,
  CreditBucketRequirement,
  MajorRequirement,
  MinorRequirement
};