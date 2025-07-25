
// =====================================================
// USER-RELATED EXPORTS
// =====================================================

export type { 
    UserProfile, 
    UserSettings, 
    StudentInfo 
} from './user';

// =====================================================
// COURSE-RELATED EXPORTS
// =====================================================

export type { 
    Course, 
    Prerequisite, 
    SemesterOffering, 
    PlannedCourse, 
    AcademicRecord, 
    SemesterData, 
    CourseFilters 
} from './courses';

// =====================================================
// REQUIREMENTS-RELATED EXPORTS
// =====================================================

export type { 
    RequirementCategory, 
    SpecificRequirement, 
    ThreadRequirement, 
    MinorRequirement, 
    MajorRequirement, 
    DegreeRequirements, 
    DegreeProgramDisplay, 
    ProgressItem, 
    AcademicProgress 
} from './requirements';

// =====================================================
// UI-RELATED EXPORTS
// =====================================================

export { DragTypes } from './ui.types';
export type { 
    DragItem, 
    DropResult, 
    MajorMinorOption, 
    MajorMinorSelection, 
    Items 
} from './ui.types';

// =====================================================
// API-RELATED EXPORTS
// =====================================================

export type { 
    PaginatedResponse, 
    PaginationParams, 
    College 
} from './api.types';

// =====================================================
// DASHBOARD-RELATED EXPORTS
// =====================================================

export type { 
    ActivityItem, 
    Activity, 
    Deadline, 
    GPAHistoryItem, 
    ThreadProgress, 
    Semester, 
    DashboardData 
} from './dashboard';