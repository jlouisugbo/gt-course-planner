import { StudentInfo,
  AcademicProgress,
  Course } from '@/types';

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
    date: Date;
    type: "registration" | "withdrawal" | "graduation";
    urgent: boolean;
    is_active: boolean;
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