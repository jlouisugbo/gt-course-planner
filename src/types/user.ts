export interface UserProfile {
    id: string;
    name: string;
    email: string;
    gtId: string;
    major: string;
    secondMajor?: string; // Optional for double majors
    isDoubleMajor?: boolean; // Indicates if the user has a second major
    concentration?: string;
    threads: string[];
    minors: string[];
    startDate: string; // Format: "Fall 2024"
    expectedGraduation: string; // Format: "Spring 2028"
    currentGPA: number;
    year: string;
    totalCreditsEarned: number;
    isTransferStudent: boolean;
    transferCredits?: number;
    advisorName?: string;
    advisorEmail?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSettings {
    theme: "light" | "dark";
    emailNotifications: boolean;
    semesterReminders: boolean;
    prerequisiteWarnings: boolean;
    autoSave: boolean;
    defaultCreditLoad: number;
}

export interface AcademicRecord {
    courseId: string;
    courseCode: string;
    courseTitle: string;
    credits: number;
    grade: string;
    semester: string;
    year: number;
    gpaPoints: number;
    status: "completed" | "in-progress" | "withdrawn" | "audit";
}
