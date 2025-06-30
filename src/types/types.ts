export interface Course {
  id: string | number;
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisite_courses: string[];
  college_id?: number;
}

export interface College {
  id: number;
  name: string;
  abbreviation: string;
  is_active: boolean;
}

export interface DegreeProgram {
  id: number;
  name: string;
  college_id: number;
  is_active: boolean;
}

export interface MajorMinorOption {
  value: string;
  label: string;
}

export interface MajorMinorSelection {
  major: string;
  minor: string;
}

export interface Items {
  [containerId: string]: Course[];
}

