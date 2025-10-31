// Component Props Types

// Layout Components
export interface AppLayoutProps {
  children: React.ReactNode;
}

// Import proper types
import { Course, SemesterData, PlannedCourse } from './courses';
import { VisualRequirementCategory, VisualCourse } from './requirements';
import { ThreadProgress, Deadline as DashboardDeadline, ActivityItem, DashboardData } from './dashboard';

// Planner Components
export interface CourseRecommendationsProps {
  onDragStart?: (course: Course) => void;
  onDragEnd?: () => void;
}

export interface AcademicYearCardProps {
  academicYear?: string;
  semesters?: SemesterData[];
}

export interface SemesterColumnsProps {
  semester?: SemesterData | null;
}

export interface SemesterCardProps {
  semester?: SemesterData | null;
}

export interface CourseCardProps {
  course: Course | PlannedCourse;
  onRemove: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

export interface CourseDetailsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onAddCourse?: (course: Course) => void;
  canModify?: boolean;
}

export interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onComplete: (courseCode: string, grade: string) => void;
}

export interface FlexibleCourseCardProps {
  title: string;
  requirementType: string;
  description?: string;
  onSelectCourse?: (course: Course) => void;
  selectedCourse?: Course | null;
  minCredits?: number;
  currentCredits?: number;
  selectionCount?: number;
  onRemoveCourse?: () => void;
}

export interface InfoPopoutProps {
  content: string;
  title?: string;
  children: React.ReactNode;
}

// Requirements Components
export interface RequirementCategoryProps {
  category: VisualRequirementCategory;
  isExpanded: boolean;
  onToggle: () => void;
  categoryKey: string;
  totalCredits: number;
}

export interface RequirementSectionProps {
  title: string;
  creditsRequired: number;
  creditsCompleted: number;
  courses: VisualCourse[];
  onToggle: (courseCode: string) => void;
  completedCourses: string[];
  isExpanded: boolean;
  onExpandToggle: () => void;
}

export interface CompletableCourseCardProps {
  course: VisualCourse;
  isCompleted: boolean;
  onToggle: () => void;
  variant?: 'card' | 'mini';
}

export interface CompletableGroupCardProps {
  group: VisualCourse; // Group is typically a VisualCourse with groupCourses
  completedCourses: string[];
  onToggle: (courseCode: string) => void;
}

export interface CourseGroupProps {
  group: VisualCourse;
  onCourseToggle: (courseCode: string) => void;
  completedCourses: string[];
}

export interface CourseModalProps {
  course: VisualCourse;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete?: (courseCode: string) => void;
  isCompleted?: boolean;
}

export interface FlexibleTextCardProps {
  title: string;
  description?: string;
  footnoteRefs?: number[];
  footnotes?: { [key: number]: string };
}

// Define CourseSearchFilters type
export interface CourseSearchFilters {
  search?: string;
  college?: string;
  credits?: number | null;
  difficulty?: number | null;
  type?: string;
  semester?: string;
}

// Courses Components
export interface RecommendedCoursesProps {
  onCourseClick?: (course: Course) => void;
  limit?: number;
}

// New Course Explorer Components
export interface CourseSearchBarProps {
  query: string;
  onSearch: (query: string) => void;
  onQueryChange: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export interface CourseFiltersProps {
  filters: CourseSearchFilters;
  onFiltersChange: (filters: CourseSearchFilters) => void;
  availableColleges: string[];
  isLoading?: boolean;
}

export interface CourseGridProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export interface CourseListProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

// New Requirements Components
export interface RequirementsCourseCardProps {
  course: VisualCourse;
  isCompleted: boolean;
  onToggleComplete: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

// Define RequirementsFilters type
export interface RequirementsFilters {
  searchQuery: string;
  showCompleted: boolean;
  showIncomplete: boolean;
  selectedSemester: string;
  courseType: string;
}

export interface RequirementsCourseModalProps {
  course: VisualCourse;
  isOpen: boolean;
  onClose: () => void;
  footnotes?: { id: number; text: string }[];
}

export interface RequirementsCategoryProps {
  section: VisualRequirementCategory;
  completedCourses: Set<string>;
  onToggleCourse: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

export interface RequirementsCategoryListProps {
  sections: VisualRequirementCategory[];
  completedCourses: Set<string>;
  filters: RequirementsFilters;
  onToggleCourse: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

export interface RequirementsSearchProps {
  filters: RequirementsFilters;
  onFiltersChange: (filters: RequirementsFilters) => void;
}

// Dashboard Components
export interface WelcomeHeaderProps {
  userName?: string;
  lastActivity?: Date;
  motivationalQuote?: string;
}

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export interface TimelineOverviewProps {
  currentSemester: string;
  expectedGraduation: string;
  creditsCompleted: number;
  totalCreditsRequired: number;
}

export interface ThreadProgressChartProps {
  progress: ThreadProgress[];
}

export interface ChartsRowProps {
  data: DashboardData;
}

export interface DashboardDeadlinesProps {
  deadlines: DashboardDeadline[];
}

// Define stats interface for dashboard
export interface DashboardStats {
  creditsCompleted: number;
  totalCreditsRequired: number;
  gpa: number;
  progressPercentage: number;
  semestersCompleted: number;
  totalSemesters: number;
}

export interface StatsGridProps {
  stats: DashboardStats;
}

export interface AIInsightsPanelProps {
  insights?: ActivityItem[];
  isLoading?: boolean;
}

// Error Components
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  resetKeys?: string[];
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'layout' | 'runtime';
  fallback?: React.ComponentType<any>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface NetworkErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export interface LoadingErrorStateProps {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorMessage?: string;
}

export interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  context?: string;
}

// Legal Components
export interface CookieSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
}

// DND Components
export interface DraggableProps {
  id: string;
  children: React.ReactNode;
  data?: Course | PlannedCourse | object; // More specific type
}

export interface DroppableProps {
  id: string;
  children: React.ReactNode;
  onDrop?: (item: Course | PlannedCourse | object) => void;
}

// UI Components
export interface DebouncedInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
}

// Chart Types
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<string, string> });
};

// Tab Type for Course Recommendations
export type TabType = "program" | "recommended" | "search" | "categories";

// Additional UI Types
export type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<'a'>;

export type FormFieldContextValue<
  TName = any
> = {
  name: TName;
};

export type FormItemContextValue = {
  id: string;
};

// Carousel Types - UI library types, using specific interfaces
export interface CarouselApi {
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
}

export interface CarouselOptions {
  loop?: boolean;
  align?: "start" | "center" | "end";
  skipSnaps?: boolean;
}

export interface CarouselPlugin {
  name: string;
  init: (embla: CarouselApi) => void;
  destroy?: () => void;
}

export type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin[];
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

export type CarouselContextProps = {
  carouselRef: React.RefObject<HTMLDivElement>;
  api: CarouselApi | undefined;
  opts?: CarouselOptions;
  orientation?: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

export type ChartContextProps = {
  config: ChartConfig;
};

// Dashboard Specific Types
export interface Insight {
  id: number;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

// Use consistent Deadline interface from dashboard types
export type { Deadline } from './dashboard';