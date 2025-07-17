// GT Catalog Scraper TypeScript Type Definitions

import { Browser } from 'puppeteer';
import { CheerioAPI } from 'cheerio/lib/load';

// =====================================================
// CORE SCRAPING TYPES
// =====================================================

export interface Program {
  name: string;
  url: string;
  type?: string;
}

export interface ScrapingStats {
  totalPrograms: number;
  successfulPrograms: number;
  failedPrograms: number;
  partialPrograms: number;
}

// =====================================================
// NAVIGATION & DETECTION TYPES
// =====================================================

export interface NavigationPattern {
  anchor: string;
  type: 'threads' | 'concentrations' | 'simple' | 'direct_curriculum';
}

export interface NavigationPath {
  url: string;
  type: string;
}

export interface ContentValidation {
  isValid: boolean;
  courseCount: number;
  contentType: 'full_curriculum' | 'partial_curriculum' | 'minimal_curriculum' | 'insufficient_content' | 'recoverable_content' | 'unknown';
  qualityIndicators?: Record<string, any>;
  gtSpecificChecks?: GTQualityChecks;
  qualityScore?: number;
  reason?: string;
  recoveryStrategy?: string;
}

export interface GTQualityChecks {
  hasGenEdRequirements: boolean;
  hasThreadStructure: boolean;
  hasCreditInformation: boolean;
  hasPrerequisiteInfo: boolean;
  coursePrefixDiversity: number;
  suspiciousPatterns: string[];
}

export interface DetectionResult {
  success: boolean;
  pattern?: string;
  content?: string | Record<string, SubLinkContent>;
  navigationPath?: NavigationPath[];
  subLinks?: SubLink[];
  error?: string;
  isMultiLevel?: boolean;
}

export interface SubLink {
  name: string;
  url: string;
  linkText: string;
}

export interface SubLinkContent {
  content?: string;
  url: string;
  validation?: ContentValidation;
  error?: string;
}

export interface RetryStrategy {
  url: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// =====================================================
// CONTENT PARSING TYPES
// =====================================================

export interface ParseResult {
  pattern: string;
  categoryRequirements: Record<string, CategoryRequirement>;
  selectionRequirements: Record<string, SelectionRequirement>;
  genEdRequirements: Record<string, GenEdRequirement>;
  flexibleRequirements: Record<string, FlexibleRequirement>;
  footnotes: Record<number, FootnoteData>;
  coursesFound: number;
  categories: string[];
  extractedCourses: string[];
  programName?: string;
  concentrationName?: string;
  genEdWarnings?: string[];
  // For multi-level content
  concentrations?: Record<string, ConcentrationParseResult>;
}

export interface CategoryRequirement {
  name: string;
  courses: string[];
  creditsRequired: number | null;
  alternativeCourses: string[];
  selectionRule: SelectionRule;
}

export interface SelectionRequirement {
  name: string;
  selectionRule: string;
  creditsRequired: number | null;
  options: string[];
  sourceText: string;
}

export interface GenEdRequirement {
  name: string;
  credits_required: number;
  selection_rule: SelectionRule;
  options: number[];
  course_codes: string[];
  constraints: GenEdConstraints;
  source_text: string;
}

export interface FlexibleRequirement {
  name: string;
  creditsRequired: number;
  selectionRule: 'flexible';
  category_filter: string;
  sourceText: string;
}

export interface FootnoteData {
  content: string;
  rule_type: FootnoteRuleType;
  mapped_courses: string[];
  course_count: number;
}

export interface ConcentrationParseResult extends ParseResult {
  sourceUrl: string;
  validation: ContentValidation;
  error?: string;
}

export interface GenEdConstraints {
  category_filter?: string;
  minimum_level?: string;
  [key: string]: any;
}

export interface GenEdConfig {
  keywords: string[];
  expectedCredits: number[];
  commonCourses: string[];
}

export interface GenEdStructure {
  humanities: GenEdConfig;
  socialScience: GenEdConfig;
  wellness: GenEdConfig;
  constitution: GenEdConfig;
  ethics: GenEdConfig;
}

export interface GenEdCategoryResult {
  found: boolean;
  displayName: string;
  creditsRequired: number | null;
  selectionRule: SelectionRule;
  courseIds: number[];
  courseCodes: string[];
  constraints: GenEdConstraints;
  sourceText: string;
}

// =====================================================
// COURSE MAPPING TYPES
// =====================================================

export interface CourseInfo {
  id: number;
  title?: string;
  credits: number;
}

export interface CourseDetails {
  code: string;
  id: number;
  credits: number;
}

export interface MappingResult {
  programName: string;
  concentrationName?: string;
  pattern: string;
  mappedRequirements: Record<string, MappedCategory>;
  creditValidationIssues: CreditValidationIssue[];
  unmappedCourses: string[];
  mappedCount: number;
  totalCourses: number;
  qualityScore: number;
}

export interface MappedCategory {
  name: string;
  courseIds: number[];
  courseDetails: CourseDetails[];
  selectionRule: SelectionRule;
  expectedCredits?: number;
  actualCredits?: number;
  creditValidationIssue?: boolean;
  unmappedCourses: string[];
  alternativeCourses?: string[];
  // For gen ed requirements
  constraints?: GenEdConstraints;
  sourceText?: string;
  // For flexible requirements
  creditsRequired?: number;
  categoryFilter?: string;
}

export interface CreditValidationIssue {
  category: string;
  expected: number;
  actual: number;
  courses: CourseDetails[];
}

export interface MappingStats {
  totalLookups: number;
  creditValidationIssues: number;
  mappingQualityScore: number;
}

export interface GTValidationIssue {
  type: string;
  category?: string;
  message: string;
  severity: 'warning' | 'error';
}

// =====================================================
// DATABASE TYPES
// =====================================================

export interface DegreeProgram {
  id: number;
  name: string;
  base_program_name?: string;
  concentration_name?: string;
  degree_type: string;
  total_credits: number;
  requirements: Record<string, any>;
  gen_ed_requirements: Record<string, any>;
  requires_concentration: boolean;
  scraping_metadata: ScrapingMetadata;
}

export interface ScrapingMetadata {
  last_scraped?: string;
  source_url?: string;
  pattern_detected?: string;
  courses_mapped?: number;
  unmapped_courses?: string[];
  created_by_scraper?: boolean;
  created_at?: string;
  scraper_version?: string;
  last_updated?: string;
  partial_programs?: number;
}

export interface ScrapingSession {
  id: number;
  session_id: string;
  started_at: string;
  completed_at?: string;
  total_programs: number;
  successful_programs: number;
  failed_programs: number;
  session_metadata: Record<string, any>;
}

export interface ScrapingResultData {
  programUrl: string;
  programName: string;
  concentrationName?: string;
  status: 'success' | 'failed' | 'partial';
  patternDetected?: string;
  navigationPath?: NavigationPath[];
  coursesFound?: number;
  coursesMapped?: number;
  unmappedCourses?: string[];
  processingTimeMs?: number;
  errorDetails?: {
    message: string;
    stack?: string;
    [key: string]: any;
  };
}

export interface FootnoteRecord {
  degree_program_id: number;
  footnote_number: number;
  footnote_content: string;
  course_codes_mentioned: string[];
  rule_type: string;
  parsed_data: FootnoteData;
}

// =====================================================
// PROCESSING RESULT TYPES
// =====================================================

export interface ProcessingResult {
  programName: string;
  status: 'success' | 'failed' | 'partial' | 'critical_error';
  pattern?: string;
  coursesFound?: number;
  coursesMapped?: number;
  unmappedCourses?: string[];
  processingTime?: number;
  error?: string;
  warning?: string;
  details?: string;
}

export interface DatabaseUpdateResult {
  degreeProgram: DegreeProgram;
  updated: boolean;
}

// =====================================================
// ENUM-LIKE TYPES
// =====================================================

export type SelectionRule = 
  | 'required' 
  | 'choose_one' 
  | 'choose_two' 
  | 'choose_three' 
  | 'choose_one_alternative'
  | 'choose_from_list'
  | 'any_from_category'
  | 'flexible'
  | 'all_required'
  | string; // Allow custom rules

export type FootnoteRuleType = 
  | 'course_options'
  | 'grade_requirement'
  | 'credit_limit'
  | 'conditional_rule'
  | 'general_rule';

export type DegreeType = 'BS' | 'MS' | 'PhD' | 'minor';

// =====================================================
// GT-SPECIFIC PATTERNS
// =====================================================

export interface GTSpecificPatterns {
  commonPrefixes: string[];
  genEdKeywords: string[];
  threadKeywords: string[];
  creditPatterns: RegExp;
}

export interface RecoveryOptions {
  canRecover: boolean;
  strategy?: string;
  confidence?: number;
}

export interface RecoveryIndicators {
  hasCourseMentions: boolean;
  hasGTStructure: boolean;
  hasDegreeTerms: boolean;
  hasNavigationHints: boolean;
}

// =====================================================
// CLASS INTERFACES
// =====================================================

export interface GTCatalogScraperInterface {
  browser: Browser | null;
  sessionId: string;
  navigationDetector: NavigationDetectorInterface;
  contentParser: ContentParserInterface;
  courseMapper: CourseMapperInterface;
  databaseUpdater: DatabaseUpdaterInterface;
  startTime: number;
  stats: ScrapingStats;

  init(): Promise<void>;
  scrapeAllPrograms(programList: Program[]): Promise<ProcessingResult[]>;
  processDegreeProgram(program: Program): Promise<ProcessingResult>;
  close(): Promise<void>;
}

export interface NavigationDetectorInterface {
  browser: Browser | null;
  baseUrl: string;
  gtSpecificPatterns: GTSpecificPatterns;

  init(browser: Browser): Promise<void>;
  detectAndScrape(programUrl: string): Promise<DetectionResult>;
  validateContent(content: string): ContentValidation;
  tryPattern(url: string, patternType: string): Promise<DetectionResult>;
}

export interface ContentParserInterface {
  gtGenEdStructure: GenEdStructure;

  parseContent(content: string | Record<string, SubLinkContent>, pattern: string): Promise<ParseResult>;
  extractAllCourseCodes(content: string): string[];
  parseGenEdRequirements($: CheerioAPI, results: ParseResult, content: string): Promise<void>;
}

export interface CourseMapperInterface {
  courseCache: Map<string, CourseInfo>;
  mappingStats: MappingStats;

  init(): Promise<void>;
  mapToDatabase(parseResult: ParseResult): Promise<MappingResult>;
  mapCategoryWithValidation(categoryName: string, categoryData: CategoryRequirement): Promise<MappedCategory>;
}

export interface DatabaseUpdaterInterface {
  createSession(sessionId: string, stats: ScrapingStats): Promise<void>;
  updateSession(sessionId: string, stats: ScrapingStats): Promise<void>;
  updateProgram(program: Program, mappingResult: MappingResult, pattern: string): Promise<DatabaseUpdateResult>;
  logResult(sessionId: string, resultData: ScrapingResultData): Promise<void>;
}