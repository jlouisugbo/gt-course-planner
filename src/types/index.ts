
// =====================================================
// USER-RELATED EXPORTS
// =====================================================

export type { 
    UserProfile, 
    UserSettings, 
    StudentInfo,
    SemesterGPA
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

export type {
    CourseViewMode,
    CourseSearchFilters  
} from './courses-ui';

// =====================================================
// REQUIREMENTS-RELATED EXPORTS
// =====================================================

export type { 
    RequirementType,
    EnrollmentType,
    DegreeProgram,
    RequirementCategory, 
    FlexibleOption,
    DegreeRequirement,
    UserDegreeProgram,
    UserRequirementProgress,
    UserThreadSelection,
    RequirementProgress,
    DegreeProgressSummary,
    CategoryProgress,
    RequirementCalculationRequest,
    RequirementCalculationResponse,
    RequirementUpdateRequest,
    RequirementValidation,
    CourseRequirementMatch,
    RequirementDisplaySettings,
    RequirementProgressSnapshot,
    ConditionalRequirement,
    CreditBucketRequirement,
    MajorRequirement,
    MinorRequirement,
    VisualCourse,
    VisualRequirementCategory,
    VisualDegreeProgram,
    VisualMinorProgram,
    EnhancedCourse,
    EnhancedCourseMap
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

// =====================================================
// OPPORTUNITIES-RELATED EXPORTS
// =====================================================

export type {
    Opportunity,
    OpportunityApplication,
    OpportunityFilters,
    CreateApplicationData,
    UpdateApplicationData
} from './opportunities';

// =====================================================
// ADVISORS-RELATED EXPORTS
// =====================================================

export type {
    Advisor,
    AdvisorConnection,
    AdvisorAppointment,
    AdvisorFilters,
    CreateConnectionData,
    CreateAppointmentData,
    UpdateAppointmentData
} from './advisors';

// =====================================================
// NOTIFICATIONS-RELATED EXPORTS
// =====================================================

export type {
    Notification,
    NotificationType,
    NotificationPriority,
    NotificationPreferences,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    UpdatePreferencesRequest,
    NotificationsResponse,
    DeadlineNotificationData,
    RequirementNotificationData,
    CourseNotificationData,
    GpaNotificationData,
    AdvisorNotificationData,
    UseNotificationsReturn,
    UseNotificationPreferencesReturn,
    NotificationCenterProps,
    NotificationItemProps,
    NotificationBadgeProps,
    NotificationIconProps,
    NotificationTriggerConfig,
    NotificationFilter
} from './notifications';

// =====================================================
// COMPONENT PROPS EXPORTS
// =====================================================

export type {
    // Layout Components
    AppLayoutProps,
    
    // Planner Components
    CourseRecommendationsProps,
    AcademicYearCardProps,
    SemesterColumnsProps,
    SemesterCardProps,
    CourseCardProps,
    CourseDetailsModalProps,
    CourseCompletionModalProps,
    FlexibleCourseCardProps,
    InfoPopoutProps,
    
    // Requirements Components
    RequirementCategoryProps,
    RequirementSectionProps,
    CompletableCourseCardProps,
    CompletableGroupCardProps,
    CourseGroupProps,
    CourseModalProps,
    FlexibleTextCardProps,
    
    // Courses Components
    RecommendedCoursesProps,
    CourseSearchBarProps,
    CourseFiltersProps,
    CourseGridProps,
    CourseListProps,
    
    // New Requirements Components  
    RequirementsCourseCardProps,
    RequirementsCourseModalProps,
    RequirementsCategoryProps,
    RequirementsCategoryListProps,
    RequirementsSearchProps,
    
    // Dashboard Components
    WelcomeHeaderProps,
    DashboardHeaderProps,
    TimelineOverviewProps,
    ThreadProgressChartProps,
    ChartsRowProps,
    DashboardDeadlinesProps,
    StatsGridProps,
    AIInsightsPanelProps,
    Insight,
    
    // Error Components
    ErrorBoundaryProps,
    ErrorBoundaryState,
    NetworkErrorFallbackProps,
    LoadingErrorStateProps,
    AsyncErrorBoundaryProps,
    
    // Legal Components
    CookieSettings,
    
    // DND Components
    DraggableProps,
    DroppableProps,
    
    // UI Components
    DebouncedInputProps,
    ChartConfig,
    TabType,
    PaginationLinkProps,
    FormFieldContextValue,
    FormItemContextValue,
    
    // Carousel Types
    CarouselApi,
    CarouselOptions,
    CarouselPlugin,
    CarouselProps,
    CarouselContextProps,
    ChartContextProps
} from './components';