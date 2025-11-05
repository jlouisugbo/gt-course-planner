/**
 * Type Transformation Layer
 *
 * This module provides functions to transform between:
 * - Database types (snake_case, from src/types/api-responses.ts)
 * - Application types (camelCase, from src/types/*.ts)
 *
 * Naming Convention:
 * - `toDB*` functions: Application → Database
 * - `fromDB*` functions: Database → Application
 */

import type {
  DBUserProfileResponse,
  DBCourseResponse,
  DBDegreeProgramResponse,
  DBSemesterResponse,
  DBDeadlineResponse,
  DBOpportunityResponse,
  DBAdvisorResponse,
  DBCourseCompletionResponse,
} from '@/types/api-responses';

import type {
  UserProfile,
  Course,
  DegreeProgram,
  SemesterData,
  Deadline,
  Opportunity,
  Advisor,
} from '@/types';

// =====================================================
// USER PROFILE TRANSFORMATIONS
// =====================================================

export function fromDBUserProfile(dbProfile: DBUserProfileResponse): UserProfile {
  return {
    id: dbProfile.id,
    authId: dbProfile.auth_id,
    email: dbProfile.email,
    fullName: dbProfile.full_name || undefined,
    firstName: dbProfile.first_name || undefined,
    lastName: dbProfile.last_name || undefined,
    gtId: dbProfile.gt_id || undefined,
    gtUsername: dbProfile.gt_username || undefined,
    major: dbProfile.major || undefined,
    minors: dbProfile.minors || undefined,
    selectedThreads: dbProfile.selected_threads || undefined,
    graduationYear: dbProfile.graduation_year || undefined,
    expectedGraduation: dbProfile.expected_graduation || undefined,
    currentGPA: dbProfile.current_gpa || undefined,
    totalCreditsEarned: dbProfile.total_credits_earned || undefined,
    isTransferStudent: dbProfile.is_transfer_student || undefined,
    transferCredits: dbProfile.transfer_credits || undefined,
    degreeProgramId: dbProfile.degree_program_id || undefined,
    completedCourses: dbProfile.completed_courses || undefined,
    completedGroups: dbProfile.completed_groups || undefined,
    hasDetailedGPA: dbProfile.has_detailed_gpa || undefined,
    semesterGPAs: dbProfile.semester_gpas || undefined,
    overallGPA: dbProfile.overall_gpa || undefined,
    planSettings: dbProfile.plan_settings || undefined,
    admin: dbProfile.admin || false,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

export function toDBUserProfile(profile: Partial<UserProfile>): Partial<DBUserProfileResponse> {
  return {
    auth_id: profile.authId,
    email: profile.email,
    full_name: profile.fullName,
    first_name: profile.firstName,
    last_name: profile.lastName,
    gt_id: profile.gtId,
    gt_username: profile.gtUsername,
    major: profile.major,
    minors: profile.minors,
    selected_threads: profile.selectedThreads,
    graduation_year: profile.graduationYear,
    expected_graduation: profile.expectedGraduation,
    current_gpa: profile.currentGPA,
    total_credits_earned: profile.totalCreditsEarned,
    is_transfer_student: profile.isTransferStudent,
    transfer_credits: profile.transferCredits,
    degree_program_id: profile.degreeProgramId,
    completed_courses: profile.completedCourses,
    completed_groups: profile.completedGroups,
    has_detailed_gpa: profile.hasDetailedGPA,
    semester_gpas: profile.semesterGPAs,
    overall_gpa: profile.overallGPA,
    plan_settings: profile.planSettings,
    admin: profile.admin,
  };
}

// =====================================================
// COURSE TRANSFORMATIONS
// =====================================================

export function fromDBCourse(dbCourse: DBCourseResponse): Course {
  return {
    id: dbCourse.id,
    code: dbCourse.code,
    title: dbCourse.title,
    description: dbCourse.description || undefined,
    credits: dbCourse.credits,
    college: dbCourse.college || undefined,
    collegeId: dbCourse.college_id || undefined,
    department: dbCourse.department || undefined,
    level: dbCourse.level || undefined,
    prerequisites: dbCourse.prerequisites || undefined,
    corequisites: dbCourse.corequisites || undefined,
    semesterOffered: dbCourse.semester_offered || undefined,
    crossListedAs: dbCourse.cross_listed_as || undefined,
    courseType: dbCourse.course_type || undefined,
    isActive: dbCourse.is_active,
    createdAt: dbCourse.created_at,
    updatedAt: dbCourse.updated_at,
  };
}

export function toDBCourse(course: Partial<Course>): Partial<DBCourseResponse> {
  return {
    code: course.code,
    title: course.title,
    description: course.description,
    credits: course.credits,
    college: course.college,
    college_id: course.collegeId,
    department: course.department,
    level: course.level,
    prerequisites: course.prerequisites as any,
    corequisites: course.corequisites,
    semester_offered: course.semesterOffered,
    cross_listed_as: course.crossListedAs,
    course_type: course.courseType,
    is_active: course.isActive,
  };
}

// =====================================================
// DEGREE PROGRAM TRANSFORMATIONS
// =====================================================

export function fromDBDegreeProgram(dbProgram: DBDegreeProgramResponse): DegreeProgram {
  return {
    id: dbProgram.id,
    name: dbProgram.name,
    code: '', // Not in DB response, may need separate query
    college: '', // Not in DB response, may need separate query or join
    degreeType: dbProgram.degree_type,
    totalCredits: dbProgram.total_credits,
    minGpa: dbProgram.min_gpa || 2.0,
    catalogYear: dbProgram.catalog_year,
    isActive: dbProgram.is_active,
    createdAt: dbProgram.created_at ? new Date(dbProgram.created_at) : undefined,
    updatedAt: dbProgram.updated_at ? new Date(dbProgram.updated_at) : undefined,
  };
}

export function toDBDegreeProgram(program: Partial<DegreeProgram>): Partial<DBDegreeProgramResponse> {
  return {
    name: program.name,
    degree_type: program.degreeType as any,
    total_credits: program.totalCredits,
    min_gpa: program.minGpa,
    catalog_year: program.catalogYear,
    is_active: program.isActive,
  };
}

// =====================================================
// SEMESTER TRANSFORMATIONS
// =====================================================

export function fromDBSemester(dbSemester: DBSemesterResponse): SemesterData {
  const semesterCode = dbSemester.season === 'Fall' ? 0 :
                       dbSemester.season === 'Spring' ? 1 : 2;
  const semesterId = dbSemester.semester_id || (dbSemester.year * 100 + semesterCode);

  return {
    id: semesterId,
    year: dbSemester.year,
    season: dbSemester.season,
    courses: (dbSemester.courses || []).map(c => ({
      id: c.id || 0,
      code: c.code,
      title: c.title || '',
      credits: c.credits,
      grade: c.grade,
      status: c.status || 'planned',
      semesterId: semesterId,
    })),
    totalCredits: dbSemester.total_credits || 0,
    maxCredits: dbSemester.max_credits || 18,
    isActive: dbSemester.is_active ?? true,
    gpa: dbSemester.gpa,
  };
}

export function toDBSemester(semester: SemesterData): Partial<DBSemesterResponse> {
  return {
    semester_id: semester.id,
    year: semester.year,
    season: semester.season,
    term: `${semester.season} ${semester.year}`,
    courses: semester.courses?.map(c => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credits: c.credits,
      grade: c.grade,
      status: c.status,
    })),
    total_credits: semester.totalCredits,
    max_credits: semester.maxCredits,
    is_active: semester.isActive,
    gpa: semester.gpa,
  };
}

// =====================================================
// DEADLINE TRANSFORMATIONS
// =====================================================

export function fromDBDeadline(dbDeadline: DBDeadlineResponse): Deadline {
  return {
    id: dbDeadline.id,
    title: dbDeadline.title,
    description: dbDeadline.description || undefined,
    date: dbDeadline.due_date || dbDeadline.date,
    dueDate: dbDeadline.due_date,
    type: dbDeadline.type,
    category: dbDeadline.category || undefined,
    urgent: dbDeadline.urgent,
    isActive: dbDeadline.is_active,
    source: dbDeadline.source || undefined,
    createdAt: dbDeadline.created_at,
    updatedAt: dbDeadline.updated_at,
  };
}

export function toDBDeadline(deadline: Partial<Deadline>): Partial<DBDeadlineResponse> {
  return {
    title: deadline.title,
    description: deadline.description,
    due_date: deadline.dueDate || deadline.date || '',
    type: deadline.type as any,
    category: deadline.category,
    urgent: deadline.urgent,
    is_active: deadline.isActive,
    source: deadline.source,
  };
}

// =====================================================
// OPPORTUNITY TRANSFORMATIONS
// =====================================================

export function fromDBOpportunity(dbOpp: DBOpportunityResponse): Opportunity {
  return {
    id: dbOpp.id,
    title: dbOpp.title,
    company: dbOpp.company,
    description: dbOpp.description || undefined,
    opportunityType: dbOpp.opportunity_type,
    applicationDeadline: dbOpp.application_deadline || undefined,
    requirements: dbOpp.requirements || undefined,
    location: dbOpp.location || undefined,
    isActive: dbOpp.is_active,
    postedBy: dbOpp.posted_by || undefined,
    createdAt: dbOpp.created_at,
    updatedAt: dbOpp.updated_at,
  };
}

export function toDBOpportunity(opp: Partial<Opportunity>): Partial<DBOpportunityResponse> {
  return {
    title: opp.title,
    company: opp.company,
    description: opp.description,
    opportunity_type: opp.opportunityType as any,
    application_deadline: opp.applicationDeadline,
    requirements: opp.requirements,
    location: opp.location,
    is_active: opp.isActive,
    posted_by: opp.postedBy,
  };
}

// =====================================================
// ADVISOR TRANSFORMATIONS
// =====================================================

export function fromDBAdvisor(dbAdvisor: DBAdvisorResponse): Advisor {
  return {
    id: dbAdvisor.id,
    userId: dbAdvisor.user_id || undefined,
    fullName: dbAdvisor.full_name,
    email: dbAdvisor.email,
    title: dbAdvisor.title || undefined,
    specializations: dbAdvisor.specializations || [],
    departments: dbAdvisor.departments || [],
    bio: dbAdvisor.bio || undefined,
    officeLocation: dbAdvisor.office_location || undefined,
    officeHours: dbAdvisor.office_hours || undefined,
    bookingUrl: dbAdvisor.booking_url || undefined,
    isAcceptingStudents: dbAdvisor.is_accepting_students,
    maxStudents: dbAdvisor.max_students || undefined,
    isActive: dbAdvisor.is_active,
    createdAt: dbAdvisor.created_at,
    updatedAt: dbAdvisor.updated_at,
  };
}

export function toDBAdvisor(advisor: Partial<Advisor>): Partial<DBAdvisorResponse> {
  return {
    user_id: advisor.userId,
    full_name: advisor.fullName,
    email: advisor.email,
    title: advisor.title,
    specializations: advisor.specializations,
    departments: advisor.departments,
    bio: advisor.bio,
    office_location: advisor.officeLocation,
    office_hours: advisor.officeHours,
    booking_url: advisor.bookingUrl,
    is_accepting_students: advisor.isAcceptingStudents,
    max_students: advisor.maxStudents,
    is_active: advisor.isActive,
  };
}

// =====================================================
// BATCH TRANSFORMATIONS
// =====================================================

export function fromDBCourseList(dbCourses: DBCourseResponse[]): Course[] {
  return dbCourses.map(fromDBCourse);
}

export function fromDBSemesterList(dbSemesters: DBSemesterResponse[]): SemesterData[] {
  return dbSemesters.map(fromDBSemester);
}

export function fromDBDeadlineList(dbDeadlines: DBDeadlineResponse[]): Deadline[] {
  return dbDeadlines.map(fromDBDeadline);
}

export function fromDBOpportunityList(dbOpps: DBOpportunityResponse[]): Opportunity[] {
  return dbOpps.map(fromDBOpportunity);
}

export function fromDBAdvisorList(dbAdvisors: DBAdvisorResponse[]): Advisor[] {
  return dbAdvisors.map(fromDBAdvisor);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Converts snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 */
export function deepSnakeToCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(deepSnakeToCamel) as any;
  }

  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = deepSnakeToCamel(obj[key]);
      return result;
    }, {} as any);
  }

  return obj;
}

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 */
export function deepCamelToSnake<T = any>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(deepCamelToSnake) as any;
  }

  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = deepCamelToSnake(obj[key]);
      return result;
    }, {} as any);
  }

  return obj;
}
