import { MajorRequirement, MinorRequirement, ThreadRequirement } from '@/types';
export interface UserProfile {
    id: number;
    name: string;
    email: string;
    gtId: number;
    major: string;
    secondMajor?: string; 
    isDoubleMajor?: boolean; 
    concentration?: string;
    threads: string[];
    minors: string[];
    startDate: string; 
    expectedGraduation: string;
    currentGPA: number;
    year: string;
    totalCreditsEarned: number;
    isTransferStudent: boolean;
    transferCredits?: number;
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

export interface StudentInfo {
    id: number;
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