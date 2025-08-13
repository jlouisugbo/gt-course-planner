export interface Course {
    id: number;
    code: string;
    title: string;
    description: string;
    credits: number;
    prerequisites: PrerequisiteStructure; // More specific type
    college: string; // College name (from college table or legacy field)
    offerings: SemesterOffering;
    difficulty: number;
    course_type: string; // Course type field used in filtering (aligned with database)
    department: string; // Department field extracted from course code
}

// Better type for prerequisites/postrequisites JSON structure
export interface PrerequisiteStructure {
    type?: "AND" | "OR";
    courses?: string[];
    conditions?: PrerequisiteCondition[];
    nested?: PrerequisiteStructure[];
}

export interface PrerequisiteCondition {
    type: "course" | "gpa" | "credit" | "classification";
    value: string | number;
    operator?: ">" | ">=" | "<" | "<=" | "=";
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
    isCompleted: boolean; // Computed field indicating if semester is completed
    gpa: number;
}

export interface CourseFilters {
    search?: string
    credits?: number
    code?: string
    title?: string
    course_type?: string
}