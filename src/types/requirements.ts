export interface RequirementCategory {
    id: string;
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
