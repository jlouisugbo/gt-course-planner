export interface RequirementCategory {
    id: number;
    name: string;
    requiredCredits: number;
    completedCredits: number;
    inProgressCredits: number;
    plannedCredits: number;
    isComplete: boolean;
    progress: number;
    courses: string[];
    requirements?: SpecificRequirement[];
}

export interface SpecificRequirement {
    description: string;
    options: string[][];
    completed: boolean;
}

export interface ThreadRequirement {
    name: string;
    requiredCourses: string[];
    electiveOptions: string[];
    totalCredits: number;
    isComplete: boolean;
}

export interface MinorRequirement {
    name: string;
    requiredCourses: string[];
    electiveOptions: string[];
    totalCredits: number;
    isComplete: boolean;
}

export interface MajorRequirement {
    name: string;
    coreRequirements: string[];
    electiveOptions: string[];
    totalCredits: number;
    isComplete: boolean;
}

export interface DegreeRequirements {
    totalCredits: number;
    categories: RequirementCategory[];
    threads: ThreadRequirement[];
    gpaRequirement: number;
    residencyHours: number;
}

export interface DegreeProgramDisplay {
    id: number;
    name: string;
    degree_type: 'Thread' | 'Minor' | 'Major';
    required_credits: number;
    description?: string;
    requirements?: {
        core_courses?: number[];
        elective_credits?: number;
        categories?: {
            name: string;
            required_credits: number;
            eligible_courses: number[];
        }[];
    };
}

export interface ProgressItem {
    id: number;
    name: string;
    type: 'thread' | 'minor';
    completed: number;
    required: number;
    percentage: number;
    color: string;
    courses: {
        completed: number[];
        inProgress: number[];
        planned: number[];
        remaining: number[];
    };
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