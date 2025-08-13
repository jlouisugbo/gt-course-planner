// UI-specific types for courses components

export interface CourseViewMode {
  type: 'grid' | 'list' | 'compact';
  sortBy: 'relevance' | 'code' | 'title' | 'credits';
  sortOrder: 'asc' | 'desc';
}

export interface CourseSearchFilters {
  query: string;
  colleges: string[];
  creditHours: number[];
  courseTypes: string[];
  semesters: string[];
  hasPrerequisites: boolean | null;
}

// Remove Department type - not in database
// Remove difficulty_rating, enrollment_count, last_offered from Course interface