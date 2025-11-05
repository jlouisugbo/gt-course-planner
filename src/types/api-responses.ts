/**
 * API Response Types
 *
 * These types represent the raw data structures returned from the database (snake_case).
 * They should be transformed to application types (camelCase) using the transformation
 * layer in src/lib/types/transforms.ts
 *
 * Naming Convention:
 * - Database fields use snake_case
 * - Application types use camelCase
 * - Response types are prefixed with "DB" to indicate database origin
 */

// =====================================================
// USER & PROFILE RESPONSES
// =====================================================

export interface DBUserProfileResponse {
  id: number;
  auth_id: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gt_id?: number | null;
  gt_username?: string | null;
  major?: string | null;
  minors?: string[] | null; // JSON array from DB
  selected_threads?: string[] | null; // JSON array from DB
  graduation_year?: number | null;
  expected_graduation?: string | null;
  current_gpa?: number | null;
  total_credits_earned?: number | null;
  is_transfer_student?: boolean | null;
  transfer_credits?: number | null;
  degree_program_id?: number | null;
  completed_courses?: string[] | null; // JSON array from DB
  completed_groups?: string[] | null; // JSON array from DB
  has_detailed_gpa?: boolean | null;
  semester_gpas?: Array<{
    semester: string;
    gpa: number;
    credits: number;
  }> | null; // JSON array from DB
  overall_gpa?: number | null;
  plan_settings?: Record<string, unknown> | null; // JSON object from DB
  admin?: boolean;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// COURSE RESPONSES
// =====================================================

export interface DBCourseResponse {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  credits: number;
  college?: string | null;
  college_id?: number | null;
  department?: string | null;
  level?: number | null;
  prerequisites?: DBPrerequisiteStructure | null; // JSON from DB
  corequisites?: string[] | null; // JSON array from DB
  semester_offered?: string[] | null; // JSON array from DB
  cross_listed_as?: string[] | null; // JSON array from DB
  course_type?: string | null;
  is_active?: boolean;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBPrerequisiteStructure {
  type?: "AND" | "OR";
  courses?: string[];
  conditions?: Array<{
    type: "course" | "gpa" | "credit" | "classification";
    courses?: string[];
    gpa?: number;
    credits?: number;
    classification?: string;
  }>;
  nested?: DBPrerequisiteStructure[];
}

export interface DBCoursesListResponse {
  data: DBCourseResponse[];
  count: number;
  hasMore?: boolean;
  offset?: number;
  limit?: number;
}

// =====================================================
// DEGREE PROGRAM RESPONSES
// =====================================================

export interface DBDegreeProgramResponse {
  id: number;
  name: string;
  degree_type: 'BS' | 'MS' | 'PhD' | 'Minor' | 'Thread';
  college_id?: number | null;
  total_credits: number;
  min_gpa?: number | null;
  requirements: DBRequirementStructure | null; // JSON from DB
  footnotes?: string | null; // JSON string or text
  catalog_year?: number | null;
  is_active: boolean;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBRequirementStructure {
  [categoryName: string]: {
    name?: string;
    description?: string;
    min_credits?: number;
    required_courses?: string[];
    flexible_options?: Array<{
      name: string;
      description?: string;
      courses: string[];
      required_count: number;
      min_credits?: number;
    }>;
  };
}

export interface DBDegreeProgramWithCollegeResponse extends DBDegreeProgramResponse {
  colleges?: {
    name: string;
    abbreviation?: string;
  } | null;
}

// =====================================================
// SEMESTER RESPONSES
// =====================================================

export interface DBSemesterResponse {
  id?: number;
  user_id?: number;
  semester_id?: number; // Numeric YYYYSS identifier
  term?: string; // "Fall 2025"
  year: number;
  season: 'Fall' | 'Spring' | 'Summer';
  courses?: DBPlannedCourseInSemester[] | null; // JSON array from DB
  total_credits?: number;
  max_credits?: number;
  is_active?: boolean;
  gpa?: number;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBPlannedCourseInSemester {
  id?: number;
  code: string;
  title?: string;
  credits: number;
  grade?: string;
  status?: 'completed' | 'in-progress' | 'planned';
}

export interface DBSemestersListResponse {
  semesters: Record<string, DBSemesterResponse>;
  count?: number;
}

// =====================================================
// COURSE COMPLETION RESPONSES
// =====================================================

export interface DBCourseCompletionResponse {
  id: number;
  user_id: number;
  course_id: number;
  course_code: string;
  status: 'completed' | 'in-progress' | 'planned';
  grade?: string | null;
  semester_taken?: string | null;
  credits_earned?: number;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// REQUIREMENT PROGRESS RESPONSES
// =====================================================

export interface DBRequirementProgressResponse {
  id: number;
  user_id: number;
  degree_program_id: number;
  category_name: string;
  credits_completed: number;
  credits_required: number;
  completion_percentage: number;
  completed_courses?: string[] | null; // JSON array from DB
  status: 'completed' | 'in-progress' | 'not-started';
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBRequirementCalculationResponse {
  degree_program: DBDegreeProgramResponse;
  total_credits_required: number;
  total_credits_completed: number;
  total_credits_in_progress: number;
  total_credits_planned: number;
  overall_completion_percentage: number;
  estimated_graduation_semester: string;
  requirement_progress: Array<{
    category: string;
    credits_required: number;
    credits_completed: number;
    completion_percentage: number;
    status: 'completed' | 'in-progress' | 'not-started';
    completed_courses: string[];
  }>;
  category_progress: Array<{
    category_name: string;
    credits_required: number;
    credits_completed: number;
    completion_percentage: number;
    status: 'completed' | 'in-progress' | 'not-started';
  }>;
  thread_progress: Array<{
    thread_name: string;
    credits_completed: number;
    credits_required: number;
    completion_percentage: number;
    status: 'completed' | 'in-progress' | 'not-started';
  }>;
  warnings: string[];
  blockers: string[];
  recommendations: string[];
}

// =====================================================
// DEADLINE RESPONSES
// =====================================================

export interface DBDeadlineResponse {
  id: number;
  title: string;
  description?: string | null;
  due_date: string; // ISO timestamp
  date?: string | null; // Legacy field
  type: 'registration' | 'withdrawal' | 'graduation' | 'thread-confirmation' | 'financial' | 'housing';
  category?: string | null;
  urgent: boolean;
  is_active: boolean;
  source?: string | null;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// OPPORTUNITY RESPONSES
// =====================================================

export interface DBOpportunityResponse {
  id: number;
  title: string;
  company: string;
  description?: string | null;
  opportunity_type: 'internship' | 'co-op' | 'research' | 'job';
  application_deadline?: string | null; // ISO timestamp
  requirements?: Record<string, unknown> | null; // JSON from DB
  location?: string | null;
  is_active: boolean;
  posted_by?: string | null; // UUID
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBOpportunityApplicationResponse {
  id: number;
  user_id: number;
  opportunity_id: number;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  cover_letter?: string | null;
  resume_url?: string | null;
  application_answers?: Record<string, unknown> | null; // JSON from DB
  submitted_at?: string | null; // ISO timestamp
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// ADVISOR RESPONSES
// =====================================================

export interface DBAdvisorResponse {
  id: number;
  user_id?: string | null; // UUID
  full_name: string;
  email: string;
  title?: string | null;
  specializations?: string[] | null; // Array from DB
  departments?: string[] | null; // Array from DB
  bio?: string | null;
  office_location?: string | null;
  office_hours?: Record<string, unknown> | null; // JSON from DB
  booking_url?: string | null;
  is_accepting_students: boolean;
  max_students?: number | null;
  is_active: boolean;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBAdvisorConnectionResponse {
  id: number;
  student_id: number;
  advisor_id: number;
  connection_type: 'requested' | 'assigned' | 'self-selected';
  status: 'pending' | 'active' | 'declined' | 'inactive';
  notes?: string | null;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface DBAdvisorAppointmentResponse {
  id: number;
  student_id: number;
  advisor_id: number;
  appointment_date: string; // ISO timestamp
  duration_minutes: number;
  meeting_type: 'in-person' | 'virtual' | 'phone';
  meeting_link?: string | null;
  topic?: string | null;
  notes?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// NOTIFICATION RESPONSES
// =====================================================

export interface DBNotificationResponse {
  id: number;
  user_id: number;
  type: 'deadline' | 'requirement' | 'course' | 'gpa' | 'advisor' | 'opportunity' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: Record<string, unknown> | null; // JSON from DB
  read: boolean;
  read_at?: string | null; // ISO timestamp
  action_url?: string | null;
  expires_at?: string | null; // ISO timestamp
  created_at?: string; // ISO timestamp
}

// =====================================================
// FLEXIBLE COURSE OPTION RESPONSES
// =====================================================

export interface DBFlexibleCourseOptionResponse {
  id: number;
  requirement_id: number;
  course_code: string;
  group_name?: string | null;
  sort_order?: number;
  created_at?: string; // ISO timestamp
}

// =====================================================
// COLLEGE RESPONSES
// =====================================================

export interface DBCollegeResponse {
  id: number;
  name: string;
  abbreviation?: string | null;
  website?: string | null;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// SYSTEM CONFIG RESPONSES
// =====================================================

export interface DBSystemConfigResponse {
  key: string;
  value: string | Record<string, unknown>; // Could be JSON
  last_crawler_run?: string | null; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

// =====================================================
// ERROR RESPONSE (Standardized across all API routes)
// =====================================================

export interface DBErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  code?: string;
  status?: number;
}

// =====================================================
// SUCCESS RESPONSE (Generic)
// =====================================================

export interface DBSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
}
