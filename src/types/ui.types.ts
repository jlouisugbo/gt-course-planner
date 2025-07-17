import { Course } from './courses';
export const DragTypes = {
    COURSE: 'course',
    PLANNED_COURSE: 'planned_course'
} as const;

export interface DragItem {
    type: string;
    id: number;
    course?: Course;
    semesterId?: number; 
}

export interface DropResult {
    targetSemesterId: number;
    targetType: 'semester' | 'sidebar';
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
    [containerId: number]: Course[];
}