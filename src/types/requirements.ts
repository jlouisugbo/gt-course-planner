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

// Visual Requirements System Types
export interface FootnoteRef {
    number: number;
    text?: string;
}

export interface BaseCourse {
    code: string;
    title: string;
    isOption: boolean;
    courseType: string;
    footnoteRefs: number[];
}

export interface RegularCourse extends BaseCourse {
    courseType: 'regular' | 'or_option';
}

export interface OrGroupCourse extends BaseCourse {
    courseType: 'or_group';
    groupId: string;
    groupCourses: VisualCourse[];
}

export interface AndGroupCourse extends BaseCourse {
    courseType: 'and_group';
    groupId: string;
    groupCourses: VisualCourse[];
}

export interface SelectionCourse extends BaseCourse {
    courseType: 'selection';
    groupId: string;
    selectionCount: number;
    selectionOptions: VisualCourse[];
}

export interface FlexibleCourse extends BaseCourse {
    courseType: 'flexible';
    isFlexible: boolean;
}

export type VisualCourse = RegularCourse | OrGroupCourse | AndGroupCourse | SelectionCourse | FlexibleCourse;

export interface VisualRequirementCategory {
    name: string;
    courses: VisualCourse[];
}

export interface VisualDegreeProgram {
    id: number;
    name: string;
    degreeType: string;
    college?: string;
    totalCredits?: number;
    requirements: VisualRequirementCategory[];
    footnotes?: FootnoteRef[];
}

export interface VisualMinorProgram {
    id: number;
    name: string;
    requirements: VisualRequirementCategory[];
    footnotes?: FootnoteRef[];
}

// Database course interface for querying individual course details
export interface DatabaseCourse {
    code: string;
    title: string;
    credits: number;
    description: string;
    prerequisites?: string;
    course_type: string;
    college?: string;
    department?: string;
}

// Enhanced course interface with database data
export interface EnhancedCourse {
    code: string;
    title: string;
    isOption: boolean;
    courseType: string;
    footnoteRefs: number[];
    credits?: number;
    description?: string;
    prerequisites?: string;
    college?: string;
    department?: string;
    // Additional fields for group courses
    groupId?: string;
    groupCourses?: VisualCourse[];
    selectionCount?: number;
    selectionOptions?: VisualCourse[];
    isFlexible?: boolean;
}