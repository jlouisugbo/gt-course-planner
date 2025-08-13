import { MajorRequirement, MinorRequirement, ThreadRequirement } from '@/types';
export interface SemesterGPA {
    semester: string; // Format: "Fall 2023", "Spring 2024", etc.
    gpa: number;
    creditsEarned: number;
}

export interface PlanSettings {
    theme?: 'light' | 'dark';
    autoSave?: boolean;
    defaultCreditLoad?: number;
    showPrerequisiteWarnings?: boolean;
    emailNotifications?: boolean;
    semesterReminders?: boolean;
    planName?: string;
    notes?: string;
    starting_semester?: string;
    is_transfer_student?: boolean;
    transfer_credits?: number;
    year?: string;
    is_double_major?: boolean;
    second_major?: string;
}

export interface UserProfile {
    id: number;
    // Core identity fields - align with database
    auth_id: string;
    full_name?: string;
    name?: string; // Keep for backwards compatibility
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    address?: string;
    student_id?: string;
    bio?: string;
    
    // GT-specific fields
    gtId?: number;
    admission_year?: number;
    
    // Academic fields
    major: string;
    secondMajor?: string; 
    isDoubleMajor?: boolean; 
    concentration?: string;
    threads: string[];
    minors: string[];
    
    // Timeline fields
    startDate?: string;
    expectedGraduation?: string;
    graduation_year?: number;
    
    // Academic progress
    currentGPA?: number;
    gpa?: number;
    year?: string;
    totalCreditsEarned?: number;
    isTransferStudent?: boolean;
    transferCredits?: number;
    
    // Settings and metadata
    plan_settings?: PlanSettings;
    semester_gpas?: Array<{
        semester: string;
        gpa: number;
        credits: number;
    }>;
    
    // Note: completedCourses and completedGroups are now handled by Zustand store
    // hasDetailedGPA and semesterGPAs removed (not used in current implementation)
    createdAt?: Date;
    updatedAt?: Date;
    created_at?: string;
    updated_at?: string;
}

export interface UserSettings {
    theme: "light" | "dark";
    emailNotifications: boolean;
    semesterReminders: boolean;
    prerequisiteWarnings: boolean;
    autoSave: boolean;
    defaultCreditLoad: number;
}

export interface StudentInfo {
    id: number;
    name: string;
    email: string;
    gtId?: number; // Optional GT ID field
    major: string;
    threads: string[];
    minors: string[];
    majorRequirements: MajorRequirement[];
    minorRequirements?: MinorRequirement[];
    threadRequirements?: ThreadRequirement[];
    startYear: number;
    expectedGraduation: string;
    graduationSemester?: string; // Optional graduation semester field
    currentGPA: number;
}

// Database-aligned UserData interface (for database operations)
export interface UserData {
    id?: number;
    auth_id: string;
    full_name?: string;
    email?: string;
    gt_username?: string;
    gt_id?: number;
    major?: string;
    threads?: string[]; // Legacy field for backward compatibility
    selected_threads?: string[]; // New database field
    minors?: string[];
    graduation_year?: number;
    degree_program_id?: number;
    completed_courses?: string[];
    completed_groups?: string[];
    has_detailed_gpa?: boolean;
    plan_settings?: PlanSettings;
    semester_gpas?: Array<{
        semester: string;
        gpa: number;
        credits: number;
    }>;
    // Legacy fields for backward compatibility
    start_date?: string;
    expected_graduation?: string;
    current_gpa?: number;
    total_credits_earned?: number;
    second_major?: string;
    is_transfer_student?: boolean;
    transfer_credits?: number;
    year?: string;
    created_at?: string;
    updated_at?: string;
}

// Profile data for setup flows and forms
export interface ProfileData {
    // Basic info
    full_name?: string;
    name?: string; // Legacy support
    first_name?: string; // For forms that split names
    last_name?: string;  // For forms that split names
    email?: string;
    phone?: string;
    address?: string;
    gt_username?: string;
    student_id?: string;
    gtId?: number; // Legacy support
    bio?: string;
    
    // Academic info
    major?: string;
    graduation_year?: number;
    degree_program_id?: number;
    admission_year?: number;
    
    // Timeline fields
    expectedGraduation?: string;
    startDate?: string;
    
    // Plan settings
    planName?: string;
    startingSemester?: string;
    totalCredits?: number;
    targetGpa?: number;
    gpa?: number;
    currentGPA?: number;
    isTransferStudent?: boolean;
    transferCredits?: number;
    startingYear?: number;
    year?: string;
    isDoubleMajor?: boolean;
    secondMajor?: string;
    
    // Threads and minors
    selectedThreads?: string[];
    minors?: string[];
}

// Enhanced profile data with computed fields
export interface EnhancedProfileData extends ProfileData {
    // Computed fields
    credits_completed?: number;
    credits_remaining?: number;
    semesters_remaining?: number;
    current_semester?: string;
    
    // Progress tracking
    requirements_met?: string[];
    requirements_remaining?: string[];
    
    // GPA tracking
    current_gpa?: number;
    semester_gpas?: Array<{
        semester: string;
        gpa: number;
        credits: number;
    }>;
}