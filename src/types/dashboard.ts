import { StudentInfo, Course } from '@/types';

export interface AcademicProgress {
    creditsCompleted: number;
    creditsInProgress: number;
    creditsPlanned: number;
    totalCreditsRequired: number;
    currentGPA: number;
    progressPercentage: number;
    onTrack: boolean;
}

export interface ActivityItem {
    id: number;
    type:
        | "course_added"
        | "prerequisite_met"
        | "requirement_completed"
        | "warning";
    title: string;
    description: string;
    timestamp: Date;
    metadata?: unknown;
}

export interface Activity {
    id: number;
    title: string;
    description: string;
    timestamp: Date;
    type: string;
}

export interface Deadline {
    id: number;
    title: string;
    description?: string;
    date: string; // ISO timestamp string from database (actual column name)
    due_date?: string; // For backward compatibility if needed
    type: "registration" | "withdrawal" | "graduation" | "thread-confirmation" | "financial" | "housing";
    category?: string;
    urgent: boolean;
    is_active: boolean;
    source?: string; // URL to official GT page
    created_at?: string;
    updated_at?: string;
}

export interface GPAHistoryItem {
    semester: string;
    gpa: number;
    year: number;
}

export interface ThreadProgress {
    name: string;
    completed: number;
    required: number;
    percentage: number;
}

export interface Semester {
    id: number;
    season: string;
    year: number;
    courses: Course[];
    totalCredits: number;
    isActive: boolean;
}

export interface DashboardData {
    studentInfo: StudentInfo;
    academicProgress: AcademicProgress;
    recentActivity: Activity[];
    semesters: Record<string, Semester>;
    allCourses: Course[];
    completedCourses: Course[];
    plannedCourses: Course[];
    inProgressCourses: Course[];
    gpaHistory: GPAHistoryItem[];
    threadProgress: ThreadProgress[];
    progressPercentage: number;
    remainingCourses: number;
}