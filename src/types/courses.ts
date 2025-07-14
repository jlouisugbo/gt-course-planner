export interface Course {
    id: string;
    code: string;
    title: string;
    credits: number;
    description: string;
    prerequisites: Prerequisite[];
    corequisites: string[];
    attributes: string[];
    offerings: SemesterOffering;
    instructors: string[];
    difficulty: number;
    workload: number;
    threads: string[];
    college: string;
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
    semesterId: string;
    status: "completed" | "in-progress" | "planned";
    grade?: string;
    year: number;
    season: "Fall" | "Spring" | "Summer";
}

export interface SemesterData {
    id: string;
    year: number;
    season: "Fall" | "Spring" | "Summer";
    courses: PlannedCourse[];
    totalCredits: number;
    maxCredits: number;
    isActive: boolean;
    gpa: number;
}
