// Comprehensive GT Catalog Scraper
// Built following complete memory and implementation plan

import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type * as Types from '@/types';

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// =====================================================
// 1. MAIN ORCHESTRATOR CLASS
// =====================================================

class GTCatalogScraper implements Types.GTCatalogScraperInterface {
  public browser: Browser | null;
  public sessionId: string;
  public navigationDetector: NavigationDetector;
  public contentParser: ContentParser;
  public courseMapper: CourseMapper;
  public databaseUpdater: DatabaseUpdater;
  public startTime: number;
  public stats: Types.ScrapingStats;

  constructor() {
    this.browser = null;
    this.sessionId = uuidv4();
    this.navigationDetector = new NavigationDetector();
    this.contentParser = new ContentParser();
    this.courseMapper = new CourseMapper();
    this.databaseUpdater = new DatabaseUpdater();
    this.startTime = Date.now();
    
    // Statistics
    this.stats = {
      totalPrograms: 0,
      successfulPrograms: 0,
      failedPrograms: 0,
      partialPrograms: 0
    };
  }

  async init(): Promise<void> {
    try {
      console.log('🚀 Initializing GT Catalog Scraper...');
      
      // Launch browser
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Initialize components
      await this.navigationDetector.init(this.browser);
      await this.courseMapper.init();
      
      // Create scraping session
      await this.databaseUpdater.createSession(this.sessionId, this.stats);
      
      console.log(`✅ Scraper initialized with session: ${this.sessionId}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize scraper:', error);
      throw error;
    }
  }

  async scrapeAllPrograms(programList: Types.Program[]): Promise<Types.ProcessingResult[]> {
    console.log(`\n📊 Starting to scrape ${programList.length} programs...`);
    this.stats.totalPrograms = programList.length;
    
    const results: Types.ProcessingResult[] = [];
    let processedCount = 0;

    for (const program of programList) {
      try {
        processedCount++;
        console.log(`\n[${processedCount}/${programList.length}] Processing: ${program.name}`);
        
        const result = await this.processDegreeProgram(program);
        results.push(result);
        
        // Update statistics
        if (result.status === 'success') {
          this.stats.successfulPrograms++;
        } else if (result.status === 'partial') {
          this.stats.partialPrograms++;
        } else {
          this.stats.failedPrograms++;
        }
        
        // Progress update every 10 programs
        if (processedCount % 10 === 0) {
          await this.updateSessionStats();
          console.log(`📈 Progress: ${processedCount}/${programList.length} (${Math.round(processedCount/programList.length*100)}%)`);
        }
        
        // Rate limiting - be respectful to GT servers
        await this.delay(2000);
        
      } catch (error) {
        console.error(`❌ Critical error processing ${program.name}:`, error);
        results.push({
          programName: program.name,
          status: 'critical_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        this.stats.failedPrograms++;
      }
    }

    // Final session update
    await this.updateSessionStats();
    await this.printFinalSummary(results);
    
    return results;
  }

  async processDegreeProgram(program: Types.Program): Promise<Types.ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Detect navigation pattern and scrape content
      const detectionResult = await this.navigationDetector.detectAndScrape(program.url);
      
      if (!detectionResult.success) {
        return await this.handleFailedDetection(program, detectionResult);
      }

      // Step 2: Parse the scraped content
      const parseResult = await this.contentParser.parseContent(
        detectionResult.content!, 
        detectionResult.pattern!
      );

      if (parseResult.coursesFound < 5) {
        return await this.handleInsufficientContent(program, parseResult);
      }

      // Step 3: Map course codes to database IDs
      const mappingResult = await this.courseMapper.mapToDatabase(parseResult);
      
      // Step 4: Update database
      const updateResult = await this.databaseUpdater.updateProgram(
        program, 
        mappingResult, 
        detectionResult.pattern!
      );

      // Step 5: Log successful result
      const processingTime = Date.now() - startTime;
      await this.databaseUpdater.logResult(this.sessionId, {
        programUrl: program.url,
        programName: program.name,
        concentrationName: mappingResult.concentrationName,
        status: 'success',
        patternDetected: detectionResult.pattern,
        navigationPath: detectionResult.navigationPath,
        coursesFound: parseResult.coursesFound,
        coursesMapped: mappingResult.mappedCount,
        unmappedCourses: mappingResult.unmappedCourses,
        processingTimeMs: processingTime
      });

      console.log(`✅ ${program.name}: SUCCESS (${parseResult.coursesFound} courses, ${mappingResult.mappedCount} mapped)`);
      
      return {
        programName: program.name,
        status: 'success',
        pattern: detectionResult.pattern,
        coursesFound: parseResult.coursesFound,
        coursesMapped: mappingResult.mappedCount,
        unmappedCourses: mappingResult.unmappedCourses,
        processingTime: processingTime
      };

    } catch (error) {
      console.error(`❌ Error processing ${program.name}:`, error);
      
      // Log error result
      await this.databaseUpdater.logResult(this.sessionId, {
        programUrl: program.url,
        programName: program.name,
        status: 'failed',
        errorDetails: { 
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        processingTimeMs: Date.now() - startTime
      });

      return {
        programName: program.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleFailedDetection(program: Types.Program, detectionResult: Types.DetectionResult): Promise<Types.ProcessingResult> {
    console.warn(`⚠️  ${program.name}: Pattern detection failed - ${detectionResult.error}`);
    
    await this.databaseUpdater.logResult(this.sessionId, {
      programUrl: program.url,
      programName: program.name,
      status: 'failed',
      patternDetected: 'detection_failed',
      errorDetails: detectionResult
    });

    return {
      programName: program.name,
      status: 'failed',
      error: detectionResult.error || 'Pattern detection failed',
      details: 'Pattern detection failed'
    };
  }

  private async handleInsufficientContent(program: Types.Program, parseResult: Types.ParseResult): Promise<Types.ProcessingResult> {
    console.warn(`⚠️  ${program.name}: Insufficient content - only ${parseResult.coursesFound} courses found`);
    
    await this.databaseUpdater.logResult(this.sessionId, {
      programUrl: program.url,
      programName: program.name,
      status: 'partial',
      patternDetected: 'insufficient_content',
      coursesFound: parseResult.coursesFound,
      errorDetails: { reason: 'insufficient_course_content' }
    });

    return {
      programName: program.name,
      status: 'partial',
      coursesFound: parseResult.coursesFound,
      warning: 'Insufficient course content detected'
    };
  }

  private async updateSessionStats(): Promise<void> {
    try {
      await this.databaseUpdater.updateSession(this.sessionId, this.stats);
    } catch (error) {
      console.error('Warning: Failed to update session stats:', error);
    }
  }

  private async printFinalSummary(results: Types.ProcessingResult[]): Promise<void> {
    const processingTime = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING COMPLETE - FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Time: ${processingTime}s`);
    console.log(`📈 Total Programs: ${this.stats.totalPrograms}`);
    console.log(`✅ Successful: ${this.stats.successfulPrograms} (${Math.round(this.stats.successfulPrograms/this.stats.totalPrograms*100)}%)`);
    console.log(`⚠️  Partial: ${this.stats.partialPrograms} (${Math.round(this.stats.partialPrograms/this.stats.totalPrograms*100)}%)`);
    console.log(`❌ Failed: ${this.stats.failedPrograms} (${Math.round(this.stats.failedPrograms/this.stats.totalPrograms*100)}%)`);
    
    // Show failed programs
    const failed = results.filter(r => r.status === 'failed');
    if (failed.length > 0) {
      console.log('\n❌ Failed Programs:');
      failed.forEach(f => console.log(`   • ${f.programName}: ${f.error}`));
    }

    // Show partial programs
    const partial = results.filter(r => r.status === 'partial');
    if (partial.length > 0) {
      console.log('\n⚠️  Partial Programs (may need manual review):');
      partial.forEach(p => console.log(`   • ${p.programName}: ${p.warning || 'Partial content'}`));
    }

    console.log('\n🎯 Scraping session completed successfully!');
    console.log(`📋 Session ID: ${this.sessionId}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      console.log('🔒 Scraper resources cleaned up');
    } catch (error) {
      console.error('Warning: Error during cleanup:', error);
    }
  }
}

// =====================================================
// 2. NAVIGATION DETECTOR CLASS
// =====================================================

class NavigationDetector implements Types.NavigationDetectorInterface {
  public browser: Browser | null;
  public baseUrl: string;
  public gtSpecificPatterns: Types.GTSpecificPatterns;

  constructor() {
    this.browser = null;
    this.baseUrl = 'https://catalog.gatech.edu';
    this.gtSpecificPatterns = {
      // GT-specific course patterns and validation rules
      commonPrefixes: ['CS', 'MATH', 'PHYS', 'CHEM', 'ENGL', 'HTS', 'MGT', 'ISYE'],
      genEdKeywords: ['humanities', 'social science', 'wellness', 'constitution'],
      threadKeywords: ['thread', 'concentration', 'track', 'option'],
      creditPatterns: /(\d+)\s*(?:credit|hour|hr)/gi
    };
  }

  async init(browser: Browser): Promise<void> {
    this.browser = browser;
  }

  async detectAndScrape(programUrl: string): Promise<Types.DetectionResult> {
    const patterns: Types.NavigationPattern[] = [
      { anchor: '#threadstext', type: 'threads' },
      { anchor: '#concentrationstext', type: 'concentrations' },
      { anchor: '#requirementstext', type: 'simple' },
      { anchor: '', type: 'direct_curriculum' }
    ];

    const navigationPath: Types.NavigationPath[] = [];
    let lastError: string | null = null;

    for (const pattern of patterns) {
      try {
        const fullUrl = `${programUrl}${pattern.anchor}`;
        navigationPath.push({ url: fullUrl, type: pattern.type });
        
        console.log(`   🔍 Trying ${pattern.type}: ${pattern.anchor || 'direct'}`);
        
        const result = await this.tryPattern(fullUrl, pattern.type);
        
        if (result.success) {
          console.log(`   ✅ Success with ${pattern.type} pattern`);
          return {
            success: true,
            pattern: pattern.type,
            content: result.content,
            navigationPath: navigationPath,
            subLinks: result.subLinks || []
          };
        } else {
          console.log(`   ❌ ${pattern.type} failed: ${result.error}`);
          lastError = result.error || 'Unknown error';
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ ${pattern.type} threw error: ${errorMessage}`);
        lastError = errorMessage;
      }
    }

    return {
      success: false,
      error: lastError || 'All navigation patterns failed',
      navigationPath: navigationPath
    };
  }

  async tryPattern(url: string, patternType: string): Promise<Types.DetectionResult> {
    if (!this.browser) {
      return {
        success: false,
        error: 'Browser not initialized'
      };
    }

    const page = await this.browser.newPage();
    
    try {
      // Set timeout and navigation
      page.setDefaultTimeout(10000);
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      const content = await page.content();
      const validation = this.validateContent(content);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Content validation failed: ${validation.reason} (${validation.courseCount} courses)`
        };
      }

      // Handle multi-level navigation for threads/concentrations
      if (patternType === 'threads' || patternType === 'concentrations') {
        const subLinks = await this.extractSubLinks(content, url);
        
        if (subLinks.length > 0) {
          console.log(`   📂 Found ${subLinks.length} sub-links, processing...`);
          const subContent = await this.processSubLinks(subLinks);
          
          return {
            success: true,
            content: subContent,
            subLinks: subLinks,
            isMultiLevel: true
          };
        }
      }

      return {
        success: true,
        content: content,
        isMultiLevel: false
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await page.close();
    }
  }

  validateContent(content: string): Types.ContentValidation {
    const courseRegex = /\b[A-Z]{2,4}\s?\d{4}[A-Z]?\b/g;
    const courses = content.match(courseRegex) || [];
    const uniqueCourses = [...new Set(courses)];
    
    // Filter courses using GT-specific knowledge
    const validCourses = this.filterValidGTCourses(uniqueCourses);
    const courseCount = validCourses.length;

    // Enhanced validation with multiple quality checks
    const validation: Types.ContentValidation = {
      isValid: false,
      courseCount: courseCount,
      contentType: 'unknown',
      qualityIndicators: {},
      gtSpecificChecks: {}
    };

    // Basic course count validation
    if (courseCount >= 15) {
      validation.contentType = 'full_curriculum';
      validation.isValid = true;
    } else if (courseCount >= 8) {
      validation.contentType = 'partial_curriculum';
      validation.isValid = true;
    } else if (courseCount >= 5) {
      validation.contentType = 'minimal_curriculum';
      validation.isValid = true;
    } else {
      validation.contentType = 'insufficient_content';
      validation.reason = 'Too few courses found';
    }

    // GT-specific quality checks
    validation.gtSpecificChecks = this.performGTQualityChecks(content, validCourses);
    
    // If basic validation failed, check GT-specific recovery options
    if (!validation.isValid) {
      const recoveryCheck = this.checkGTRecoveryOptions(content);
      if (recoveryCheck.canRecover) {
        validation.isValid = true;
        validation.contentType = 'recoverable_content';
        validation.recoveryStrategy = recoveryCheck.strategy;
      }
    }

    // Calculate overall quality score
    validation.qualityScore = this.calculateContentQuality(validation, content);

    return validation;
  }

  private filterValidGTCourses(courses: string[]): string[] {
    return courses.filter(course => {
      const normalized = course.replace(/\s/g, '');
      
      // Remove obvious false positives
      if (normalized.match(/^(HTTP|HTML|CSS|API|URL|PDF|FAQ|ISBN)\d/i)) {
        return false;
      }
      
      // GT courses should have recognizable prefixes
      const prefix = course.match(/^([A-Z]{2,4})/)?.[1];
      if (prefix && this.gtSpecificPatterns.commonPrefixes.includes(prefix)) {
        return true; // High confidence GT course
      }
      
      // Keep courses that look like standard GT format
      return normalized.match(/^[A-Z]{2,4}\d{4}[A-Z]?$/);
    });
  }

  private async extractSubLinks(content: string, baseUrl: string): Promise<Types.SubLink[]> {
    const $ = cheerio.load(content);
    const links: Types.SubLink[] = [];
    
    // Look for concentration/thread links
    $('a[href*="/programs/"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      // Skip if it's the same page or doesn't look like a program link
      if (href && href !== baseUrl && text.length > 3) {
        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        
        // Extract concentration name from text or URL
        const concentrationName = this.extractConcentrationName(text, href);
        
        if (concentrationName) {
          links.push({
            name: concentrationName,
            url: fullUrl,
            linkText: text
          });
        }
      }
    });

    // If no explicit links found, try URL pattern discovery
    if (links.length === 0) {
      const discoveredLinks = await this.discoverHiddenConcentrations(baseUrl);
      links.push(...discoveredLinks);
    }

    return links;
  }

  private extractConcentrationName(text: string, href: string): string {
    // Extract from text patterns like "Bachelor of Science in Applied Physics - General"
    const textMatch = text.match(/.*?\s*-\s*(.+)$/);
    if (textMatch) {
      return textMatch[1].trim();
    }
    
    // Extract from URL patterns
    const urlMatch = href.match(/programs\/([^\/]+)-bs/);
    if (urlMatch) {
      return urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return text;
  }

  private async processSubLinks(subLinks: Types.SubLink[]): Promise<Record<string, Types.SubLinkContent>> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const results: Record<string, Types.SubLinkContent> = {};
    
    for (const link of subLinks) {
      try {
        const page = await this.browser.newPage();
        await page.goto(link.url, { waitUntil: 'networkidle0' });
        const content = await page.content();
        
        const validation = this.validateContent(content);
        if (validation.isValid) {
          results[link.name] = {
            content: content,
            url: link.url,
            validation: validation
          };
        } else {
          results[link.name] = {
            error: `Validation failed: ${validation.reason}`,
            url: link.url
          };
        }
        
        await page.close();
      } catch (error) {
        results[link.name] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: link.url
        };
      }
    }
    
    return results;
  }

  private async discoverHiddenConcentrations(baseUrl: string): Promise<Types.SubLink[]> {
    if (!this.browser) {
      return [];
    }

    // Try common GT concentration patterns
    const commonPatterns = [
      'general',
      'business-option',
      'management',
      'systems',
      'design'
    ];
    
    const discovered: Types.SubLink[] = [];
    const baseName = baseUrl.match(/programs\/([^\/]+)-bs/)?.[1];
    
    if (baseName) {
      for (const pattern of commonPatterns) {
        const testUrl = `${this.baseUrl}/programs/${baseName}-${pattern}-bs/`;
        
        try {
          const page = await this.browser.newPage();
          const response = await page.goto(testUrl, { waitUntil: 'networkidle0' });
          
          if (response && response.status() === 200) {
            const content = await page.content();
            const validation = this.validateContent(content);
            
            if (validation.isValid) {
              discovered.push({
                name: pattern.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                url: testUrl,
                linkText: `${baseName} - ${pattern}`
              });
            }
          }
          
          await page.close();
        } catch (error) {
          console.log(`   ❌ Failed to discover ${pattern} concentration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    return discovered;
  }

  private performGTQualityChecks(content: string, courses: string[]): Types.GTQualityChecks {
    const checks: Types.GTQualityChecks = {
      hasGenEdRequirements: false,
      hasThreadStructure: false,
      hasCreditInformation: false,
      hasPrerequisiteInfo: false,
      coursePrefixDiversity: 0,
      suspiciousPatterns: []
    };

    const lowerContent = content.toLowerCase();

    // Check for gen ed requirements
    checks.hasGenEdRequirements = this.gtSpecificPatterns.genEdKeywords.some(keyword =>
      lowerContent.includes(keyword)
    );

    // Check for thread/concentration structure
    checks.hasThreadStructure = this.gtSpecificPatterns.threadKeywords.some(keyword =>
      lowerContent.includes(keyword)
    );

    // Check for credit information
    const creditMatches = content.match(this.gtSpecificPatterns.creditPatterns);
    checks.hasCreditInformation = creditMatches !== null && creditMatches.length > 3;

    // Check course prefix diversity (good curriculum should have multiple departments)
    const prefixes = new Set(courses.map(course => course.match(/^([A-Z]{2,4})/)?.[1]).filter(Boolean));
    checks.coursePrefixDiversity = prefixes.size;

    // Check for suspicious patterns
    if (courses.length > 0 && checks.coursePrefixDiversity < 2) {
      checks.suspiciousPatterns.push('low_prefix_diversity');
    }

    if (lowerContent.includes('bs/ms option') && courses.length < 10) {
      checks.suspiciousPatterns.push('program_options_only');
    }

    if (lowerContent.includes('admission') && !lowerContent.includes('requirement')) {
      checks.suspiciousPatterns.push('admissions_page');
    }

    return checks;
  }

  private checkGTRecoveryOptions(content: string): Types.RecoveryOptions {
    const lowerContent = content.toLowerCase();
    
    // Check if this might be a valid page with different navigation needed
    const recoveryIndicators: Types.RecoveryIndicators = {
      hasCourseMentions: /course|curriculum|requirement/i.test(content),
      hasGTStructure: /georgia tech|gatech|institute/i.test(content),
      hasDegreeTerms: /bachelor|master|degree|major/i.test(content),
      hasNavigationHints: /thread|concentration|track|option/i.test(content)
    };

    const positiveIndicators = Object.values(recoveryIndicators).filter(Boolean).length;

    if (positiveIndicators >= 3) {
      return {
        canRecover: true,
        strategy: 'try_alternative_navigation',
        confidence: positiveIndicators / 4
      };
    }

    if (lowerContent.includes('prerequisite') || lowerContent.includes('corequisite')) {
      return {
        canRecover: true,
        strategy: 'extract_prerequisite_info',
        confidence: 0.7
      };
    }

    return { canRecover: false };
  }

  private calculateContentQuality(validation: Types.ContentValidation, content: string): number {
    let score = 0;

    // Base score from course count
    if (validation.courseCount >= 15) score += 40;
    else if (validation.courseCount >= 8) score += 25;
    else if (validation.courseCount >= 5) score += 15;

    // GT-specific bonuses
    const gtChecks = validation.gtSpecificChecks;
    
    if (gtChecks?.hasGenEdRequirements) score += 15;
    if (gtChecks?.hasThreadStructure) score += 10;
    if (gtChecks?.hasCreditInformation) score += 15;
    if (gtChecks?.coursePrefixDiversity && gtChecks.coursePrefixDiversity >= 3) score += 10;
    if (gtChecks?.coursePrefixDiversity && gtChecks.coursePrefixDiversity >= 5) score += 5;

    // Penalties for suspicious patterns
    if (gtChecks?.suspiciousPatterns.includes('program_options_only')) score -= 20;
    if (gtChecks?.suspiciousPatterns.includes('admissions_page')) score -= 30;
    if (gtChecks?.suspiciousPatterns.includes('low_prefix_diversity')) score -= 10;

    // Content length penalty for very short pages
    if (content.length < 2000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }
}

// =====================================================
// 3. CONTENT PARSER CLASS
// =====================================================

class ContentParser implements Types.ContentParserInterface {
  public gtGenEdStructure: Types.GenEdStructure;

  constructor() {
    // GT's standardized gen ed structure
    this.gtGenEdStructure = {
      humanities: {
        keywords: ['hum', 'humanities', 'literature', 'philosophy', 'history'],
        expectedCredits: [6, 9], // Common credit amounts
        commonCourses: ['ENGL', 'HIST', 'PHIL', 'LMC']
      },
      socialScience: {
        keywords: ['ss', 'social science', 'sociology', 'psychology', 'political'],
        expectedCredits: [6, 9],
        commonCourses: ['PSYC', 'SOC', 'POL', 'ECON', 'HTS']
      },
      wellness: {
        keywords: ['wellness', 'health', 'physical education', 'pe'],
        expectedCredits: [2, 3],
        commonCourses: ['APPH', 'HLTH']
      },
      constitution: {
        keywords: ['constitution', 'georgia constitution', 'us constitution'],
        expectedCredits: [0, 3], // Often satisfied by other requirements
        commonCourses: ['POL', 'HIST']
      },
      ethics: {
        keywords: ['ethics', 'ethical', 'eth5'],
        expectedCredits: [3],
        commonCourses: ['CS', 'PHIL', 'SLS', 'LMC']
      }
    };
  }

  async parseContent(content: string | Record<string, Types.SubLinkContent>, pattern: string): Promise<Types.ParseResult> {
    console.log(`   📝 Parsing content with ${pattern} pattern...`);
    
    if (typeof content === 'object') {
      // Multi-level content (concentrations/threads with sub-pages)
      return await this.parseMultiLevelContent(content, pattern);
    } else {
      // Single page content
      return await this.parseSinglePageContent(content, pattern);
    }
  }

  extractAllCourseCodes(content: string): string[] {
    const courseRegex = /\b([A-Z]{2,4})\s?(\d{4}[A-Z]?)\b/g;
    const matches = content.matchAll(courseRegex);
    
    const courses = Array.from(matches).map(match => 
      `${match[1].toUpperCase()} ${match[2].toUpperCase()}`
    );
    
    // Remove duplicates and filter false positives
    const uniqueCourses = [...new Set(courses)].filter(course => {
      return !course.match(/^(HTTP|HTML|CSS|API|URL|PDF|FAQ)\s/i);
    });
    
    return uniqueCourses;
  }

  async parseGenEdRequirements($: CheerioAPI, results: Types.ParseResult, content: string): Promise<void> {
    const lowerContent = content.toLowerCase();
    
    // Try to identify and structure gen ed requirements
    for (const [genEdType, config] of Object.entries(this.gtGenEdStructure)) {
      const genEdInfo = this.extractGenEdCategory($, content, genEdType, config);
      
      if (genEdInfo.found) {
        results.genEdRequirements[genEdType] = {
          name: genEdInfo.displayName,
          credits_required: genEdInfo.creditsRequired,
          selection_rule: genEdInfo.selectionRule,
          options: genEdInfo.courseIds,
          course_codes: genEdInfo.courseCodes,
          constraints: genEdInfo.constraints,
          source_text: genEdInfo.sourceText
        };

        // Also add to categories for backwards compatibility
        results.categories.push(genEdType);
      }
    }

    // Look for "Any HUM", "Any SS" style requirements
    this.parseFlexibleGenEd($, results, content);

    // Validate gen ed completeness
    this.validateGenEdCompleteness(results);
  }

  private async parseMultiLevelContent(subContent: Record<string, Types.SubLinkContent>, pattern: string): Promise<Types.ParseResult> {
    const results: Types.ParseResult = {
      pattern: `${pattern}_multi_level`,
      categoryRequirements: {},
      selectionRequirements: {},
      genEdRequirements: {},
      flexibleRequirements: {},
      footnotes: {},
      concentrations: {},
      coursesFound: 0,
      categories: [],
      extractedCourses: []
    };

    const categoriesSet = new Set<string>();

    for (const [name, data] of Object.entries(subContent)) {
      if (data.error) {
        results.concentrations![name] = { 
          ...this.getEmptyParseResult(),
          error: data.error,
          sourceUrl: data.url,
          validation: { isValid: false, courseCount: 0, contentType: 'unknown' }
        };
        continue;
      }

      try {
        const parsed = await this.parseSinglePageContent(data.content!, 'concentration_page');
        results.concentrations![name] = {
          ...parsed,
          sourceUrl: data.url,
          validation: data.validation!
        };
        
        results.coursesFound += parsed.coursesFound;
        parsed.categories.forEach(cat => categoriesSet.add(cat));
        
      } catch (error) {
        console.warn(`Warning: Failed to parse ${name}:`, error);
        results.concentrations![name] = { 
          ...this.getEmptyParseResult(),
          error: error instanceof Error ? error.message : 'Unknown error',
          sourceUrl: data.url,
          validation: { isValid: false, courseCount: 0, contentType: 'unknown' }
        };
      }
    }

    results.categories = Array.from(categoriesSet);
    return results;
  }

  private async parseSinglePageContent(content: string, pattern: string): Promise<Types.ParseResult> {
    const $ = cheerio.load(content);
    
    const results: Types.ParseResult = {
      pattern: pattern,
      categoryRequirements: {},
      selectionRequirements: {},
      genEdRequirements: {},
      flexibleRequirements: {},
      footnotes: {},
      coursesFound: 0,
      categories: [],
      extractedCourses: []
    };

    // Extract all course codes first
    const allCourses = this.extractAllCourseCodes(content);
    results.extractedCourses = allCourses;
    results.coursesFound = allCourses.length;

    // Parse different content structures
    await this.parseCategoryBlocks($, results);
    await this.parseSelectionRequirements($, results);
    await this.parseFootnotes($, results);
    await this.parseFlexibleRequirements($, results);
    await this.parseGenEdRequirements($, results, content);

    // Extract program/concentration names
    results.programName = this.extractProgramName($);
    results.concentrationName = this.extractConcentrationName($);

    console.log(`   📊 Parsed: ${results.coursesFound} courses, ${Object.keys(results.categoryRequirements).length} categories`);
    
    return results;
  }

  private getEmptyParseResult(): Types.ParseResult {
    return {
      pattern: '',
      categoryRequirements: {},
      selectionRequirements: {},
      genEdRequirements: {},
      flexibleRequirements: {},
      footnotes: {},
      coursesFound: 0,
      categories: [],
      extractedCourses: []
    };
  }

  private async parseCategoryBlocks($: CheerioAPI, results: Types.ParseResult): Promise<void> {
    // Look for bold headers followed by course content
    $('strong, b, h3, h4').each((i, header) => {
      const headerText = $(header).text().trim();
      
      // Skip if not a category header
      if (headerText.length < 3 || headerText.length > 100) return;
      
      const categoryName = this.normalizeCategoryName(headerText);
      
      if (this.isCategoryHeader(headerText)) {
        results.categories.push(categoryName);
        
        // Find courses after this header
        const categoryContent = this.extractCategoryContent($, header);
        const categoryCourses = this.extractCourseCodes(categoryContent);
        const creditMatch = categoryContent.match(/\b(\d+)\s*$/);
        
        if (categoryCourses.length > 0) {
          results.categoryRequirements[categoryName] = {
            name: headerText,
            courses: categoryCourses,
            creditsRequired: creditMatch ? parseInt(creditMatch[1]) : null,
            alternativeCourses: this.parseAlternatives(categoryContent),
            selectionRule: this.detectSelectionRule(categoryContent)
          };
        }
      }
    });
  }

  private extractCategoryContent($: CheerioAPI, header: cheerio.Element): string {
    let content = '';
    let currentElement = $(header).parent();
    
    // Traverse until we find the next category header or end of content
    while (currentElement.length && !this.isNextCategoryHeader(currentElement)) {
      content += currentElement.text() + ' ';
      currentElement = currentElement.next();
    }
    
    return content;
  }

  private async parseSelectionRequirements($: CheerioAPI, results: Types.ParseResult): Promise<void> {
    // Look for "Select X of the following" patterns
    const selectionRegex = /select\s+(one|two|three|four|five|\d+)\s+of\s+the\s+following:?\s*(\d+)?/gi;
    
    $('*').each((i, el) => {
      const text = $(el).text();
      const match = text.match(selectionRegex);
      
      if (match) {
        const quantity = this.convertQuantityToNumber(match[1]);
        const credits = match[2] ? parseInt(match[2]) : null;
        
        // Extract courses following this selection requirement
        const followingContent = this.getFollowingContent($, el);
        const courses = this.extractCourseCodes(followingContent);
        
        if (courses.length > 0) {
          const categoryName = `selection_${Object.keys(results.selectionRequirements).length + 1}`;
          
          results.selectionRequirements[categoryName] = {
            name: match[0],
            selectionRule: `choose_${quantity}`,
            creditsRequired: credits,
            options: courses,
            sourceText: followingContent
          };
          
          results.categories.push(categoryName);
        }
      }
    });
  }

  private getFollowingContent($: CheerioAPI, element: cheerio.Element): string {
    let content = '';
    let currentElement = $(element).next();
    let depth = 0;
    
    while (currentElement.length && depth < 5) {
      const text = currentElement.text();
      if (this.hasCourseCodes(text)) {
        content += text + ' ';
      }
      currentElement = currentElement.next();
      depth++;
    }
    
    return content;
  }

  private async parseFootnotes($: CheerioAPI, results: Types.ParseResult): Promise<void> {
    // Look for footnote definitions
    const footnotePattern = /^(\d+):?\s*(.+)/gm;
    const pageText = $.text();
    const matches = pageText.matchAll(footnotePattern);
    
    for (const match of matches) {
      const footnoteNum = parseInt(match[1]);
      const footnoteContent = match[2];
      
      if (footnoteNum > 0 && footnoteNum < 20) {
        const courses = this.extractCourseCodes(footnoteContent);
        
        results.footnotes[footnoteNum] = {
          content: footnoteContent,
          rule_type: this.detectFootnoteRuleType(footnoteContent),
          mapped_courses: courses,
          course_count: courses.length
        };
      }
    }
  }

  private async parseFlexibleRequirements($: CheerioAPI, results: Types.ParseResult): Promise<void> {
    // Look for flexible requirements like "Any HUM 6", "Free Electives 15"
    const flexiblePattern = /(any\s+\w+|free\s+electives?|electives?)\s*(\d+)/gi;
    const pageText = $.text();
    const matches = pageText.matchAll(flexiblePattern);
    
    for (const match of matches) {
      const categoryType = match[1].toLowerCase().trim();
      const credits = parseInt(match[2]);
      
      const categoryName = this.mapFlexibleCategory(categoryType);
      
      results.flexibleRequirements[categoryName] = {
        name: match[1],
        creditsRequired: credits,
        selectionRule: 'flexible',
        category_filter: categoryName,
        sourceText: match[0]
      };
      
      results.categories.push(categoryName);
    }
  }

  private extractGenEdCategory($: CheerioAPI, content: string, genEdType: string, config: Types.GenEdConfig): Types.GenEdCategoryResult {
    const result: Types.GenEdCategoryResult = {
      found: false,
      displayName: '',
      creditsRequired: null,
      selectionRule: 'flexible',
      courseIds: [],
      courseCodes: [],
      constraints: {},
      sourceText: ''
    };

    // Look for explicit mentions of this gen ed type
    const patterns = config.keywords.map(keyword => new RegExp(keyword, 'gi'));
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Found this gen ed type, now extract details
        result.found = true;
        result.displayName = this.normalizeGenEdName(matches[0]);
        
        // Try to extract credit requirement from nearby text
        const contextText = this.extractContextAroundMatch(content, pattern);
        result.sourceText = contextText;
        
        // Extract credits from context
        const creditMatch = contextText.match(/(\d+)\s*(?:credit|hour|hr)/i);
        if (creditMatch) {
          result.creditsRequired = parseInt(creditMatch[1]);
        } else {
          // Use common credit amounts for this gen ed type
          result.creditsRequired = config.expectedCredits[0];
        }

        // Extract specific courses if mentioned
        const coursesInContext = this.extractCourseCodes(contextText);
        result.courseCodes = coursesInContext.filter(course => 
          config.commonCourses.some(prefix => course.startsWith(prefix))
        );

        // Determine selection rule
        if (contextText.toLowerCase().includes('any ')) {
          result.selectionRule = 'any_from_category';
        } else if (result.courseCodes.length > 1) {
          result.selectionRule = 'choose_from_list';
        } else if (result.courseCodes.length === 1) {
          result.selectionRule = 'required';
        }

        break; // Found this gen ed type, move on
      }
    }

    return result;
  }

  private parseFlexibleGenEd($: CheerioAPI, results: Types.ParseResult, content: string): void {
    // Look for "Any HUM 6", "Any SS 9" style requirements
    const flexiblePattern = /any\s+(hum|ss|humanities|social\s*science)\s*(\d+)/gi;
    const matches = content.matchAll(flexiblePattern);

    for (const match of matches) {
      const genEdType = this.normalizeGenEdType(match[1]);
      const credits = parseInt(match[2]);

      if (genEdType && !results.genEdRequirements[genEdType]) {
        results.genEdRequirements[genEdType] = {
          name: `Any ${genEdType.toUpperCase()}`,
          credits_required: credits,
          selection_rule: 'any_from_category',
          options: [], // Will be populated with all courses in this category
          course_codes: [],
          constraints: {
            category_filter: genEdType,
            minimum_level: '1000'
          },
          source_text: match[0]
        };
      }
    }
  }

  private normalizeGenEdType(text: string): string {
    const normalized = text.toLowerCase().replace(/\s+/g, '_');
    const mapping: Record<string, string> = {
      'hum': 'humanities',
      'humanities': 'humanities',
      'ss': 'social_science',
      'social_science': 'social_science',
      'social science': 'social_science'
    };
    return mapping[normalized] || normalized;
  }

  private normalizeGenEdName(text: string): string {
    const mapping: Record<string, string> = {
      'hum': 'Humanities',
      'ss': 'Social Science',
      'humanities': 'Humanities',
      'social science': 'Social Science',
      'wellness': 'Wellness',
      'constitution': 'Constitution Requirement',
      'ethics': 'Ethics Requirement'
    };
    return mapping[text.toLowerCase()] || text;
  }

  private extractContextAroundMatch(content: string, pattern: RegExp, contextSize: number = 200): string {
    const match = content.match(pattern);
    if (!match) return '';
    
    const matchIndex = content.indexOf(match[0]);
    const start = Math.max(0, matchIndex - contextSize);
    const end = Math.min(content.length, matchIndex + match[0].length + contextSize);
    
    return content.slice(start, end);
  }

  private validateGenEdCompleteness(results: Types.ParseResult): void {
    const warnings: string[] = [];
    const foundGenEd = Object.keys(results.genEdRequirements);

    // Check for common missing gen ed requirements
    if (!foundGenEd.includes('humanities') && !foundGenEd.includes('social_science')) {
      warnings.push('No general education requirements detected - this may indicate incomplete parsing');
    }

    // Check for unusually high credit requirements (may indicate parsing error)
    for (const [genEdType, genEdData] of Object.entries(results.genEdRequirements)) {
      if (genEdData.credits_required > 15) {
        warnings.push(`${genEdType} has unusually high credit requirement: ${genEdData.credits_required}`);
      }
    }

    if (warnings.length > 0) {
      results.genEdWarnings = warnings;
    }
  }

  private extractCourseCodes(text: string): string[] {
    const courseRegex = /\b([A-Z]{2,4})\s?(\d{4}[A-Z]?)\b/g;
    const matches = text.matchAll(courseRegex);
    
    const courses = Array.from(matches).map(match => 
      `${match[1].toUpperCase()} ${match[2].toUpperCase()}`
    );
    
    // Remove duplicates and filter false positives
    const uniqueCourses = [...new Set(courses)].filter(course => {
      return !course.match(/^(HTTP|HTML|CSS|API|URL|PDF|FAQ)\s/i);
    });
    
    return uniqueCourses;
  }

  private parseAlternatives(text: string): string[] {
    // Find "or COURSE" patterns
    const orPattern = /or\s+([A-Z]{2,4}\s?\d{4}[A-Z]?)/g;
    const alternatives: string[] = [];
    
    const matches = text.matchAll(orPattern);
    for (const match of matches) {
      alternatives.push(match[1].replace(/\s+/g, ' ').toUpperCase());
    }
    
    return alternatives;
  }

  // Utility methods
  private normalizeCategoryName(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private isCategoryHeader(text: string): boolean {
    const categoryKeywords = [
      'requirement', 'core', 'major', 'elective', 'field of study',
      'wellness', 'mathematics', 'science', 'humanities', 'writing',
      'social science', 'technology', 'institutional priority'
    ];
    
    const lowerText = text.toLowerCase();
    return categoryKeywords.some(keyword => lowerText.includes(keyword));
  }

  private isNextCategoryHeader(element: cheerio.Cheerio<cheerio.Element>): boolean {
    const text = element.text().trim();
    return this.isCategoryHeader(text) && text.length > 5;
  }

  private hasCourseCodes(text: string): boolean {
    return /\b[A-Z]{2,4}\s?\d{4}[A-Z]?\b/.test(text);
  }

  private detectSelectionRule(text: string): Types.SelectionRule {
    if (text.match(/\bor\b/i)) return 'choose_one_alternative';
    if (text.match(/select\s+(one|1)/i)) return 'choose_one';
    if (text.match(/select\s+(two|2)/i)) return 'choose_two';
    if (text.match(/select\s+(three|3)/i)) return 'choose_three';
    return 'required';
  }

  private detectFootnoteRuleType(content: string): Types.FootnoteRuleType {
    if (content.includes('must be chosen from')) return 'course_options';
    if (content.includes('minimum grade')) return 'grade_requirement';
    if (content.includes('maximum') && content.includes('credit')) return 'credit_limit';
    if (content.includes('if') && content.includes('then')) return 'conditional_rule';
    return 'general_rule';
  }

  private convertQuantityToNumber(quantity: string): number {
    const numberMap: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    if (numberMap[quantity.toLowerCase()]) {
      return numberMap[quantity.toLowerCase()];
    }
    
    const num = parseInt(quantity);
    return isNaN(num) ? 1 : num;
  }

  private mapFlexibleCategory(categoryType: string): string {
    const categoryMap: Record<string, string> = {
      'hum': 'humanities',
      'humanities': 'humanities',
      'ss': 'social_science',
      'social science': 'social_science',
      'free': 'free_electives'
    };
    
    return categoryMap[categoryType] || categoryType;
  }

  private extractProgramName($: CheerioAPI): string {
    // Try to extract from page title or main heading
    const titleSelectors = ['h1', 'title', '.page-title', '.program-title'];
    
    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text.includes('Bachelor') || text.includes('Master') || text.includes('Doctor')) {
          return text;
        }
      }
    }
    
    // Fallback to first heading
    const firstHeading = $('h1, h2').first().text().trim();
    return firstHeading || 'Unknown Program';
  }

  private extractConcentrationName($: CheerioAPI): string | undefined {
    const programName = this.extractProgramName($);
    
    // Look for "Program - Concentration" pattern
    const match = programName.match(/.*?\s*-\s*(.+)$/);
    if (match) {
      return match[1].trim();
    }
    
    return undefined;
  }
}

// =====================================================
// 4. COURSE MAPPER CLASS
// =====================================================

class CourseMapper implements Types.CourseMapperInterface {
  public courseCache: Map<string, Types.CourseInfo>;
  public mappingStats: Types.MappingStats;

  constructor() {
    this.courseCache = new Map(); // code -> {id, title, credits}
    this.mappingStats = {
      totalLookups: 0,
      creditValidationIssues: 0,
      mappingQualityScore: 0
    };
  }

  async init(): Promise<void> {
    console.log('📚 Loading course mapping cache...');
    
    try {
      // Load existing cache first
      const { data: cached, error: cacheError } = await supabase
        .from('course_mapping_cache')
        .select('course_code, course_id');
      
      if (!cacheError && cached) {
        cached.forEach((item: any) => {
          if (item.course_id) {
            this.courseCache.set(item.course_code, { id: item.course_id, credits: 0 });
          }
        });
        console.log(`📋 Loaded ${cached.length} cached mappings`);
      }
      
      // Load all courses for fresh mappings
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, code, title, credits');
      
      if (coursesError) throw coursesError;
      
      if (courses) {
        courses.forEach((course: any) => {
          this.courseCache.set(course.code, {
            id: course.id,
            title: course.title,
            credits: course.credits
          });
        });
      }
      
      console.log(`✅ Course mapper initialized with ${courses?.length || 0} courses`);
      
    } catch (error) {
      console.error('❌ Failed to initialize course mapper:', error);
      throw error;
    }
  }

  async mapToDatabase(parseResult: Types.ParseResult): Promise<Types.MappingResult> {
    console.log('   🗂️  Mapping course codes with credit validation...');

    const mappingResult: Types.MappingResult = {
      programName: parseResult.programName || 'Unknown Program',
      concentrationName: parseResult.concentrationName,
      pattern: parseResult.pattern,
      mappedRequirements: {},
      creditValidationIssues: [],
      unmappedCourses: [],
      mappedCount: 0,
      totalCourses: parseResult.coursesFound,
      qualityScore: 0
    };

    // Map different types of requirements
    if (parseResult.categoryRequirements) {
      for (const [categoryName, categoryData] of Object.entries(parseResult.categoryRequirements)) {
        const mapped = await this.mapCategoryWithValidation(categoryName, categoryData);
        mappingResult.mappedRequirements[categoryName] = mapped;
        mappingResult.mappedCount += mapped.courseIds.length;
        mappingResult.unmappedCourses.push(...mapped.unmappedCourses);

        if (mapped.creditValidationIssue) {
          mappingResult.creditValidationIssues.push({
            category: categoryName,
            expected: categoryData.creditsRequired || 0,
            actual: mapped.actualCredits || 0,
            courses: mapped.courseDetails
          });
        }
      }
    }

    // Map selection requirements
    if (parseResult.selectionRequirements) {
      for (const [categoryName, categoryData] of Object.entries(parseResult.selectionRequirements)) {
        const mapped = await this.mapSelectionRequirement(categoryName, categoryData);
        mappingResult.mappedRequirements[categoryName] = mapped;
        mappingResult.mappedCount += mapped.courseIds.length;
        mappingResult.unmappedCourses.push(...mapped.unmappedCourses);
      }
    }

    // Map gen ed requirements
    if (parseResult.genEdRequirements) {
      for (const [genEdType, genEdData] of Object.entries(parseResult.genEdRequirements)) {
        const mapped = await this.mapGenEdRequirement(genEdType, genEdData);
        mappingResult.mappedRequirements[`gen_ed_${genEdType}`] = mapped;
        mappingResult.mappedCount += mapped.courseIds.length;
        mappingResult.unmappedCourses.push(...mapped.unmappedCourses);
      }
    }

    // Map flexible requirements
    if (parseResult.flexibleRequirements) {
      for (const [categoryName, categoryData] of Object.entries(parseResult.flexibleRequirements)) {
        mappingResult.mappedRequirements[categoryName] = {
          name: categoryData.name,
          courseIds: [],
          courseDetails: [],
          selectionRule: categoryData.selectionRule,
          creditsRequired: categoryData.creditsRequired,
          categoryFilter: categoryData.category_filter,
          unmappedCourses: []
        };
      }
    }

    // Remove duplicates from unmapped courses
    mappingResult.unmappedCourses = [...new Set(mappingResult.unmappedCourses)];

    // Calculate quality score
    mappingResult.qualityScore = this.calculateMappingQuality(mappingResult);

    return mappingResult;
  }

  async mapCategoryWithValidation(categoryName: string, categoryData: Types.CategoryRequirement): Promise<Types.MappedCategory> {
    const courseIds: number[] = [];
    const courseDetails: Types.CourseDetails[] = [];
    let totalActualCredits = 0;
    let unmappedCourses: string[] = [];

    for (const courseCode of categoryData.courses || []) {
      const courseInfo = this.courseCache.get(courseCode);
      
      if (courseInfo) {
        courseIds.push(courseInfo.id);
        courseDetails.push({
          code: courseCode,
          id: courseInfo.id,
          credits: courseInfo.credits
        });
        totalActualCredits += courseInfo.credits || 0;
      } else {
        unmappedCourses.push(courseCode);
      }
    }

    // Validate credits if requirement specifies amount
    const expectedCredits = categoryData.creditsRequired;
    const creditValidationIssue = expectedCredits && 
      Math.abs(totalActualCredits - expectedCredits) > 1; // Allow 1-credit tolerance

    return {
      name: categoryData.name,
      courseIds: courseIds,
      courseDetails: courseDetails,
      selectionRule: categoryData.selectionRule || 'all_required',
      expectedCredits: expectedCredits,
      actualCredits: totalActualCredits,
      creditValidationIssue: creditValidationIssue,
      unmappedCourses: unmappedCourses,
      alternativeCourses: categoryData.alternativeCourses || []
    };
  }

  private async mapSelectionRequirement(categoryName: string, categoryData: Types.SelectionRequirement): Promise<Types.MappedCategory> {
    const courseIds: number[] = [];
    const courseDetails: Types.CourseDetails[] = [];
    let unmappedCourses: string[] = [];

    for (const courseCode of categoryData.options || []) {
      const courseInfo = this.courseCache.get(courseCode);
      
      if (courseInfo) {
        courseIds.push(courseInfo.id);
        courseDetails.push({
          code: courseCode,
          id: courseInfo.id,
          credits: courseInfo.credits
        });
      } else {
        unmappedCourses.push(courseCode);
      }
    }

    return {
      name: categoryData.name,
      courseIds: courseIds,
      courseDetails: courseDetails,
      selectionRule: categoryData.selectionRule as Types.SelectionRule,
      expectedCredits: categoryData.creditsRequired,
      unmappedCourses: unmappedCourses,
      sourceText: categoryData.sourceText
    };
  }

  private async mapGenEdRequirement(genEdType: string, genEdData: Types.GenEdRequirement): Promise<Types.MappedCategory> {
    const courseIds: number[] = [];
    const courseDetails: Types.CourseDetails[] = [];
    let unmappedCourses: string[] = [];

    for (const courseCode of genEdData.course_codes || []) {
      const courseInfo = this.courseCache.get(courseCode);
      
      if (courseInfo) {
        courseIds.push(courseInfo.id);
        courseDetails.push({
          code: courseCode,
          id: courseInfo.id,
          credits: courseInfo.credits
        });
      } else {
        unmappedCourses.push(courseCode);
      }
    }

    return {
      name: genEdData.name,
      creditsRequired: genEdData.credits_required,
      selectionRule: genEdData.selection_rule,
      courseIds: courseIds,
      courseDetails: courseDetails,
      constraints: genEdData.constraints || {},
      unmappedCourses: unmappedCourses,
      sourceText: genEdData.source_text
    };
  }

  private calculateMappingQuality(mappingResult: Types.MappingResult): number {
    const totalCategories = Object.keys(mappingResult.mappedRequirements).length;
    const totalCourses = mappingResult.totalCourses;
    const mappedCourses = mappingResult.mappedCount;
    const creditIssues = mappingResult.creditValidationIssues.length;

    // Quality score: 100 - penalties
    let score = 100;
    
    // Penalty for unmapped courses (major issue)
    const unmappedPenalty = ((totalCourses - mappedCourses) / totalCourses) * 40;
    score -= unmappedPenalty;
    
    // Penalty for credit validation issues (moderate issue)
    const creditPenalty = totalCategories > 0 ? (creditIssues / totalCategories) * 20 : 0;
    score -= creditPenalty;
    
    // Bonus for high mapping rate
    if (mappedCourses / totalCourses > 0.95) {
      score += 10;
    }

    return Math.max(0, Math.round(score));
  }

  // Enhanced validation specifically for GT's common patterns
  private validateGTSpecificPatterns(mappingResult: Types.MappingResult): Types.GTValidationIssue[] {
    const issues: Types.GTValidationIssue[] = [];
    
    // Check for common GT gen ed requirements
    const genEdCategories = ['humanities', 'social_science', 'wellness'];
    const foundGenEd = genEdCategories.filter(cat => 
      Object.keys(mappingResult.mappedRequirements).some(key => 
        key.toLowerCase().includes(cat)
      )
    );

    if (foundGenEd.length < 2 && mappingResult.pattern !== 'threads') {
      issues.push({
        type: 'missing_gen_ed',
        message: 'Missing expected general education categories',
        severity: 'warning'
      });
    }

    // Check for unusually high credit requirements (may indicate parsing error)
    for (const [categoryName, categoryData] of Object.entries(mappingResult.mappedRequirements)) {
      if (categoryData.expectedCredits && categoryData.expectedCredits > 20 && categoryData.courseIds.length < 3) {
        issues.push({
          type: 'high_credit_few_courses',
          category: categoryName,
          message: `${categoryData.expectedCredits} credits with only ${categoryData.courseIds.length} courses`,
          severity: 'warning'
        });
      }
    }

    return issues;
  }
}

// =====================================================
// 5. DATABASE UPDATER CLASS
// =====================================================

class DatabaseUpdater implements Types.DatabaseUpdaterInterface {
  async createSession(sessionId: string, stats: Types.ScrapingStats): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .insert({
          session_id: sessionId,
          total_programs: stats.totalPrograms,
          session_metadata: {
            started_at: new Date().toISOString(),
            scraper_version: '1.0.0'
          }
        });

      if (error) throw error;
      console.log(`📊 Created scraping session: ${sessionId}`);

    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, stats: Types.ScrapingStats): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .update({
          successful_programs: stats.successfulPrograms,
          failed_programs: stats.failedPrograms,
          session_metadata: {
            scraper_version: '1.0.0',
            last_updated: new Date().toISOString(),
            partial_programs: stats.partialPrograms
          }
        })
        .eq('session_id', sessionId);

      if (error) throw error;

    } catch (error) {
      console.error('Warning: Failed to update session:', error);
    }
  }

  async updateProgram(program: Types.Program, mappingResult: Types.MappingResult, pattern: string): Promise<Types.DatabaseUpdateResult> {
    try {
      // Extract program and concentration names
      const programName = mappingResult.programName || program.name;
      const concentrationName = mappingResult.concentrationName;
      
      let baseProgramName = programName;
      if (concentrationName) {
        baseProgramName = programName.replace(` - ${concentrationName}`, '');
      }

      // Find or create degree program record
      let degreeProgram = await this.findDegreeProgram(programName, baseProgramName, concentrationName);
      
      if (!degreeProgram) {
        degreeProgram = await this.createDegreeProgram(programName, baseProgramName, concentrationName, program);
      }

      // Update requirements
      const { error: updateError } = await supabase
        .from('degree_programs')
        .update({
          requirements: mappingResult.mappedRequirements,
          scraping_metadata: {
            last_scraped: new Date().toISOString(),
            source_url: program.url,
            pattern_detected: pattern,
            courses_mapped: mappingResult.mappedCount,
            unmapped_courses: mappingResult.unmappedCourses
          }
        })
        .eq('id', degreeProgram.id);

      if (updateError) throw updateError;

      // Save footnotes if any
      if (mappingResult.mappedRequirements.footnotes) {
        await this.saveFootnotes(degreeProgram.id, mappingResult.mappedRequirements.footnotes);
      }

      console.log(`   💾 Updated database record: ${degreeProgram.id}`);
      
      return { degreeProgram, updated: true };

    } catch (error) {
      console.error('❌ Failed to update program:', error);
      throw error;
    }
  }

  async logResult(sessionId: string, resultData: Types.ScrapingResultData): Promise<void> {
    try {
      const { error } = await supabase
        .from('scraping_results')
        .insert({
          session_id: sessionId,
          ...resultData
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Warning: Failed to log result:', error);
    }
  }

  private async findDegreeProgram(programName: string, baseProgramName: string, concentrationName?: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('degree_programs')
        .select('*')
        .eq('name', programName)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      }

      // Try alternative matching
      if (concentrationName) {
        const { data: altData, error: altError } = await supabase
          .from('degree_programs')
          .select('*')
          .eq('base_program_name', baseProgramName)
          .eq('concentration_name', concentrationName)
          .limit(1);

        if (!altError && altData && altData.length > 0) {
          return altData[0];
        }
      }

      return null;

    } catch (error) {
      console.warn('Warning: Error finding degree program:', error);
      return null;
    }
  }

  private async createDegreeProgram(programName: string, baseProgramName: string, concentrationName: string | undefined, program: Types.Program): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('degree_programs')
        .insert({
          name: programName,
          base_program_name: baseProgramName,
          concentration_name: concentrationName,
          degree_type: this.inferDegreeType(programName),
          total_credits: 120, // Default, will be updated later
          requirements: {},
          gen_ed_requirements: {},
          requires_concentration: !!concentrationName,
          scraping_metadata: {
            created_by_scraper: true,
            source_url: program.url,
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`   ➕ Created new degree program: ${data.id} - ${programName}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create degree program:', error);
      throw error;
    }
  }

  private async saveFootnotes(degreeId: number, footnotes: Record<number, Types.FootnoteData>): Promise<void> {
    try {
      // Delete existing footnotes
      await supabase
        .from('program_footnotes')
        .delete()
        .eq('degree_program_id', degreeId);

      // Insert new footnotes
      const footnoteRecords = Object.entries(footnotes).map(([num, data]) => ({
        degree_program_id: degreeId,
        footnote_number: parseInt(num),
        footnote_content: data.content,
        course_codes_mentioned: data.mapped_courses || [],
        rule_type: data.rule_type,
        parsed_data: data
      }));

      if (footnoteRecords.length > 0) {
        const { error } = await supabase
          .from('program_footnotes')
          .insert(footnoteRecords);

        if (error) throw error;
      }

    } catch (error) {
      console.warn('Warning: Failed to save footnotes:', error);
    }
  }

  private inferDegreeType(programName: string): Types.DegreeType {
    if (programName.includes('Bachelor')) return 'BS';
    if (programName.includes('Master')) return 'MS';
    if (programName.includes('Doctor') || programName.includes('PhD')) return 'PhD';
    if (programName.includes('Minor')) return 'minor';
    return 'BS'; // Default
  }
}

// =====================================================
// 6. MAIN EXECUTION AND USAGE
// =====================================================

async function main(): Promise<Types.ProcessingResult[]> {
  const scraper = new GTCatalogScraper();
  
  try {
    await scraper.init();
    
    // Example program list - replace with actual GT catalog discovery
    const programs: Types.Program[] = [
      {
        name: 'Computer Science - BS',
        url: 'https://catalog.gatech.edu/programs/computer-science-bs/'
      },
      {
        name: 'Applied Physics - BS',
        url: 'https://catalog.gatech.edu/programs/applied-physics-bs/'
      },
      {
        name: 'Business Administration - BS',
        url: 'https://catalog.gatech.edu/programs/business-administration-bs/'
      },
      {
        name: 'Biomedical Engineering - BS',
        url: 'https://catalog.gatech.edu/programs/biomedical-engineering-bs/'
      },
      {
        name: 'Atmospheric and Oceanic Sciences - BS',
        url: 'https://catalog.gatech.edu/programs/atmospheric-oceanic-sciences-bs/'
      }
      // Add more programs as needed
    ];
    
    const results = await scraper.scrapeAllPrograms(programs);
    
    // Print final statistics
    const stats = scraper.stats;
    console.log('\n🎯 Final Results:');
    console.log(`✅ Successful: ${stats.successfulPrograms}/${stats.totalPrograms}`);
    console.log(`⚠️  Partial: ${stats.partialPrograms}/${stats.totalPrograms}`);
    console.log(`❌ Failed: ${stats.failedPrograms}/${stats.totalPrograms}`);
    
    return results;
    
  } catch (error) {
    console.error('💥 Critical error:', error);
    throw error;
  } finally {
    await scraper.close();
  }
}

// =====================================================
// 7. UTILITY FUNCTIONS FOR PROGRAM DISCOVERY
// =====================================================

async function discoverAllPrograms(): Promise<Types.Program[]> {
  console.log('🔍 Discovering all GT programs...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://catalog.gatech.edu/programs/#bachelorstext');
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const programs: Types.Program[] = [];
    
    // Extract BS programs
    $('a[href*="/programs/"][href*="-bs"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && text) {
        programs.push({
          name: text,
          url: `https://catalog.gatech.edu${href}`,
          type: 'BS'
        });
      }
    });
    
    console.log(`📋 Discovered ${programs.length} BS programs`);
    return programs;
    
  } catch (error) {
    console.error('❌ Failed to discover programs:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Export classes and functions
export {
  GTCatalogScraper,
  NavigationDetector,
  ContentParser,
  CourseMapper,
  DatabaseUpdater,
  main,
  discoverAllPrograms
};

// Run if called directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}