export const DragTypes = {
  COURSE: 'course',
  PLANNED_COURSE: 'planned_course'
} as const;

export interface DragItem {
  type: string;
  id: string;
  course: unknown;
  semesterId?: string;
}

export interface DropResult {
  targetSemesterId: string;
  targetType: 'semester' | 'sidebar';
}

