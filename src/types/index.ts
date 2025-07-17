// =====================================================
// GT CATALOG CATALOGSCRAPER EXPORTS
// =====================================================

// Core scraping types
export type {
  Program,
  ScrapingStats
} from './catalogscraper.ts';

// Navigation & detection types
export type {
  NavigationPattern,
  NavigationPath,
  ContentValidation,
  GTQualityChecks,
  DetectionResult,
  SubLink,
  SubLinkContent,
  RetryStrategy
} from './catalogscraper.ts';

// Content parsing types
export type {
  ParseResult,
  CategoryRequirement,
  SelectionRequirement,
  GenEdRequirement,
  FlexibleRequirement,
  FootnoteData,
  ConcentrationParseResult,
  GenEdConstraints,
  GenEdConfig,
  GenEdStructure,
  GenEdCategoryResult
} from './catalogscraper.ts';

// Course mapping types
export type {
  CourseInfo,
  CourseDetails,
  MappingResult,
  MappedCategory,
  CreditValidationIssue,
  MappingStats,
  GTValidationIssue
} from './catalogscraper.ts';

// Database types
export type {
  DegreeProgram,
  ScrapingMetadata,
  ScrapingSession,
  ScrapingResultData,
  FootnoteRecord
} from './catalogscraper.ts';

// Processing result types
export type {
  ProcessingResult,
  DatabaseUpdateResult
} from './catalogscraper.ts';

// Enum-like types
export type {
  SelectionRule,
  FootnoteRuleType,
  DegreeType
} from './catalogscraper.js';

// GT-specific patterns
export type {
  GTSpecificPatterns,
  RecoveryOptions,
  RecoveryIndicators
} from './catalogscraper.js';

// Class interfaces
export type {
  GTCatalogScraperInterface,
  NavigationDetectorInterface,
  ContentParserInterface,
  CourseMapperInterface,
  DatabaseUpdaterInterface
} from './catalogscraper.js'

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