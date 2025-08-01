export interface Course {
    id: number;
    code: string;
    title: string;
    description: string;
    credits: number;
    prerequisites: any; // JSON structure from database
    postrequisites?: any; // JSON structure from database  
    college: string;
    offerings: SemesterOffering;
    difficulty: number;
    type: string; // e.g., "core", "elective", "major"
}

export interface Prerequisite {
    type: "course" | "gpa" | "credit" | "classification";
    courses?: string[];
    logic?: "AND" | "OR";
    gpa?: number;
    credits?: number;
    classification?: string;
}

export interface SemesterOffering {
    fall: boolean;
    spring: boolean;
    summer: boolean;
}

export interface PlannedCourse extends Course {
    semesterId: number;
    status: "completed" | "in-progress" | "planned";
    grade?: string | null;
    year: number;
    season: "Fall" | "Spring" | "Summer";
}

export interface AcademicRecord {
    courseId: number;
    courseCode: string;
    courseTitle: string;
    credits: number;
    grade: string;
    semester: string;
    year: number;
    gpaPoints: number;
    status: "completed" | "in-progress" | "withdrawn" | "audit";
}

export interface SemesterData {
    id: number;
    year: number;
    season: "Fall" | "Spring" | "Summer";
    courses: PlannedCourse[];
    totalCredits: number;
    maxCredits: number;
    isActive: boolean;
    gpa: number;
}

export interface CourseFilters {
    search?: string
    credits?: number
    code?: string
    title?: string
    course_type?: string
}