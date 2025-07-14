import { ThreadRequirement } from './requirements';
export interface StudentInfo {
    id: string;
    name: string;
    email: string;
    major: string;
    threads: string[];
    minors: string[];
    majorRequirements: MajorRequirement[];
    minorRequirements?: MinorRequirement[];
    threadRequirements?: ThreadRequirement[];
    startYear: number;
    expectedGraduation: string;
    currentGPA: number;
}

export interface AcademicProgress {
    totalCreditsRequired: number;
    creditsCompleted: number;
    creditsInProgress: number;
    creditsPlanned: number;
    currentGPA: number;
    projectedGPA: number;
    graduationDate: string;
    onTrack: boolean;
}

export interface ActivityItem {
    id: string;
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

export interface Deadline {
    id: string;
    title: string;
    date: Date;
    type: "registration" | "withdrawal" | "graduation";
    urgent: boolean;
}
