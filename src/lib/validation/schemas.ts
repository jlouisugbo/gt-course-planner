import { z } from 'zod';

// Common validation patterns
const courseCodePattern = /^[A-Z]{2,4}\s*\d{4}[A-Z]?$/;
const gtUsernamePattern = /^[a-zA-Z][a-zA-Z0-9]*\d+$/;
const semesterPattern = /^(Fall|Spring|Summer)\s\d{4}$/;
const gradePattern = /^[ABCDF]$|^[WSUIP]$/;

// Base schemas for reuse
export const CourseCodeSchema = z.string()
    .trim()
    .min(1, "Course code is required")
    .max(10, "Course code too long")
    .regex(courseCodePattern, "Invalid course code format (e.g., CS 1301)")
    .transform(code => code.toUpperCase().replace(/\s+/g, ' '));

export const GTUsernameSchema = z.string()
    .trim()
    .min(3, "GT username too short")
    .max(20, "GT username too long")
    .regex(gtUsernamePattern, "Invalid GT username format")
    .toLowerCase();

export const SemesterSchema = z.string()
    .trim()
    .regex(semesterPattern, "Invalid semester format (e.g., Fall 2024)");

export const GradeSchema = z.string()
    .trim()
    .toUpperCase()
    .regex(gradePattern, "Invalid grade (A, B, C, D, F, W, S, U, I, P)");

export const EmailSchema = z.string()
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .max(255, "Email too long");

// Sanitization helpers
export const sanitizeString = (str: string) => 
    str.trim().replace(/[<>'"&]/g, '');

export const sanitizeHtml = (str: string) =>
    str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
       .replace(/javascript:/gi, '')
       .replace(/on\w+=/gi, '');

// User Profile Schemas
export const UserProfileUpdateSchema = z.object({
    full_name: z.string()
        .trim()
        .min(1, "Full name is required")
        .max(100, "Full name too long")
        .transform(sanitizeString)
        .optional(),
    
    gt_username: GTUsernameSchema.optional(),
    
    graduation_year: z.number()
        .int("Graduation year must be an integer")
        .min(new Date().getFullYear(), "Invalid graduation year")
        .max(new Date().getFullYear() + 10, "Invalid graduation year")
        .optional(),
    
    major: z.string()
        .trim()
        .min(1, "Major is required")
        .max(100, "Major name too long")
        .transform(sanitizeString)
        .optional(),
    
    minors: z.array(z.string()
        .trim()
        .min(1, "Minor name cannot be empty")
        .max(100, "Minor name too long")
        .transform(sanitizeString))
        .max(5, "Too many minors")
        .optional(),
    
    selected_threads: z.array(z.string()
        .trim()
        .min(1, "Thread name cannot be empty")
        .max(100, "Thread name too long")
        .transform(sanitizeString))
        .max(10, "Too many threads")
        .optional(),
    
    degree_program_id: z.number()
        .int("Degree program ID must be an integer")
        .positive("Invalid degree program ID")
        .optional(),
    
    plan_settings: z.object({
        // Core settings
        preferred_semester_start: z.enum(['Fall', 'Spring', 'Summer']).optional(),
        max_courses_per_semester: z.number().int().min(1).max(8).optional(),
        min_courses_per_semester: z.number().int().min(0).max(6).optional(),
        preferred_course_times: z.array(z.string()).max(10).optional(),
        avoid_friday_classes: z.boolean().optional(),
        summer_enrollment: z.boolean().optional(),
        // Store non-database fields in plan_settings JSON
        start_date: z.string().trim().optional(),
        expected_graduation: z.string().trim().optional(),
        is_transfer_student: z.boolean().optional(),
        transfer_credits: z.number().int().min(0).max(200).optional(),
        current_gpa: z.number().min(0).max(4.0).optional(),
        total_credits_earned: z.number().int().min(0).max(300).optional(),
    }).optional(),
    
    has_detailed_gpa: z.boolean().optional(),
    
    semester_gpas: z.array(z.object({
        semester: SemesterSchema,
        gpa: z.number().min(0).max(4.0),
        credits: z.number().int().min(0).max(30)
    })).max(20, "Too many semesters").optional()
});

// Course Completion Schemas
export const CourseCompletionSchema = z.object({
    courseCode: CourseCodeSchema,
    grade: GradeSchema.optional(),
    semester: SemesterSchema,
    credits: z.number()
        .int("Credits must be an integer")
        .min(1, "Credits must be at least 1")
        .max(12, "Credits too high for single course")
        .default(3)
});

export const CourseCompletionDeleteSchema = z.object({
    courseCode: z.string().optional().transform(code => {
        if (!code) return undefined;
        return CourseCodeSchema.parse(code);
    }),
    semester: z.string().optional().transform(sem => {
        if (!sem) return undefined;
        return SemesterSchema.parse(sem);
    })
}).refine(
    data => data.courseCode !== undefined, 
    { message: "Course code is required" }
);

// Course Search Schemas
export const CourseSearchSchema = z.object({
    q: z.string()
        .trim()
        .min(1, "Search query is required")
        .max(100, "Search query too long")
        .transform(sanitizeString),
    
    page: z.string()
        .regex(/^\d+$/, "Page must be a number")
        .transform(Number)
        .refine(n => n > 0, "Page must be positive")
        .default("1"),
    
    limit: z.string()
        .regex(/^\d+$/, "Limit must be a number")
        .transform(Number)
        .refine(n => n > 0 && n <= 100, "Limit must be between 1 and 100")
        .default("50")
});

// Course Filter Schemas
export const CourseFilterSchema = z.object({
    colleges: z.array(z.string().trim().max(50)).max(20).optional(),
    course_types: z.array(z.enum(['core', 'elective', 'capstone', 'lab', 'seminar'])).optional(),
    credit_hours: z.array(z.number().int().min(1).max(12)).max(12).optional(),
    exclude_completed: z.boolean().optional(),
    include_prerequisites: z.boolean().optional()
});

// Analytics Schemas
export const AnalyticsEventSchema = z.object({
    event_type: z.enum([
        'page_view',
        'course_search',
        'course_completion',
        'plan_modification',
        'requirement_check',
        'profile_update'
    ]),
    
    page_path: z.string()
        .trim()
        .max(500, "Page path too long")
        .transform(sanitizeString)
        .optional(),
    
    metadata: z.record(z.any())
        .refine(obj => JSON.stringify(obj).length <= 5000, "Metadata too large")
        .optional(),
    
    session_id: z.string()
        .trim()
        .min(1, "Session ID required")
        .max(100, "Session ID too long")
        .optional()
});

// Admin Schemas (for admin endpoints)
export const AdminQuerySchema = z.object({
    user_id: z.string()
        .trim()
        .min(1, "User ID required")
        .max(100, "User ID too long")
        .optional(),
    
    start_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
        .optional(),
    
    end_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
        .optional(),
    
    action_type: z.enum([
        'profile_access',
        'course_data_access',
        'requirement_check',
        'plan_modification'
    ]).optional()
});

// Generic pagination schema
export const PaginationSchema = z.object({
    page: z.string()
        .regex(/^\d+$/, "Page must be a number")
        .transform(Number)
        .refine(n => n > 0, "Page must be positive")
        .default("1"),
    
    limit: z.string()
        .regex(/^\d+$/, "Limit must be a number") 
        .transform(Number)
        .refine(n => n > 0 && n <= 100, "Limit must be between 1 and 100")
        .default("25")
});

// Bulk operation schemas
export const BulkCourseCompletionSchema = z.object({
    completions: z.array(CourseCompletionSchema)
        .min(1, "At least one completion required")
        .max(50, "Too many completions in single request")
});

// Semester planning schemas
export const SemesterPlanSchema = z.object({
    semester: SemesterSchema,
    courses: z.array(CourseCodeSchema)
        .max(8, "Too many courses for single semester"),
    
    notes: z.string()
        .trim()
        .max(1000, "Notes too long")
        .transform(sanitizeHtml)
        .optional()
});

// Rate limiting helper - track requests by IP/user
export const RateLimitSchema = z.object({
    identifier: z.string().min(1).max(100),
    window_ms: z.number().int().positive().max(3600000), // Max 1 hour
    max_requests: z.number().int().positive().max(10000)
});

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type CourseCompletion = z.infer<typeof CourseCompletionSchema>;
export type CourseSearch = z.infer<typeof CourseSearchSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AdminQuery = z.infer<typeof AdminQuerySchema>;
export type SemesterPlan = z.infer<typeof SemesterPlanSchema>;