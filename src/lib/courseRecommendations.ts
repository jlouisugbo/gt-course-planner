import { Course } from '@/types';
import { authService } from './auth';

export interface CourseRecommendation {
  course: Course;
  score: number;
  reasons: string[];
  priority: 'high' | 'medium' | 'low';
  category: 'prerequisite-ready' | 'major-requirement' | 'thread-related' | 'elective' | 'foundation';
}

export interface RecommendationFilters {
  maxCourses?: number;
  semester?: string;
  excludeCompleted?: boolean;
  priorityFilter?: 'high' | 'medium' | 'low' | 'all';
}

/**
 * Generate intelligent course recommendations based on completed courses and academic goals
 */
export class CourseRecommendationEngine {
  private completedCourses: Course[] = [];
  private plannedCourses: Course[] = [];
  private userMajor: string = '';
  private userThreads: string[] = [];
  private allCourses: Course[] = [];

  constructor(
    completedCourses: Course[],
    plannedCourses: Course[],
    userMajor: string,
    userThreads: string[] = []
  ) {
    this.completedCourses = completedCourses;
    this.plannedCourses = plannedCourses;
    this.userMajor = userMajor;
    this.userThreads = userThreads;
  }

  /**
   * Load all available courses from the API
   */
  async loadCourses(): Promise<void> {
    try {
      const { data: sessionData } = await authService.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Load courses with pagination to get all courses
      const allCourses: Course[] = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(`/api/courses/all?page=${page}&limit=${limit}`, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          }
        });

        if (!response.ok) {
          break;
        }

        const data = await response.json();
        const courses = data.courses || [];
        
        if (courses.length === 0) {
          break;
        }

        allCourses.push(...courses);
        page++;

        // Safety break to prevent infinite loops
        if (page > 50) {
          break;
        }
      }

      this.allCourses = allCourses;
      console.log(`Loaded ${allCourses.length} courses for recommendations`);
    } catch (error) {
      console.error('Error loading courses for recommendations:', error);
      this.allCourses = [];
    }
  }

  /**
   * Generate course recommendations
   */
  async generateRecommendations(filters: RecommendationFilters = {}): Promise<CourseRecommendation[]> {
    if (this.allCourses.length === 0) {
      await this.loadCourses();
    }

    const recommendations: CourseRecommendation[] = [];
    const completedCodes = new Set(this.completedCourses.map(c => c.code));
    const plannedCodes = new Set(this.plannedCourses.map(c => c.code));

    for (const course of this.allCourses) {
      // Skip if already completed or planned
      if (completedCodes.has(course.code) || plannedCodes.has(course.code)) {
        continue;
      }

      const recommendation = this.evaluateCourse(course);
      if (recommendation && recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score (descending)
    recommendations.sort((a, b) => b.score - a.score);

    // Apply filters
    let filteredRecommendations = recommendations;

    if (filters.priorityFilter && filters.priorityFilter !== 'all') {
      filteredRecommendations = filteredRecommendations.filter(r => r.priority === filters.priorityFilter);
    }

    if (filters.maxCourses) {
      filteredRecommendations = filteredRecommendations.slice(0, filters.maxCourses);
    }

    return filteredRecommendations;
  }

  /**
   * Evaluate a single course for recommendations
   */
  private evaluateCourse(course: Course): CourseRecommendation | null {
    let score = 0;
    const reasons: string[] = [];
    let category: CourseRecommendation['category'] = 'elective';
    
    // Check prerequisites satisfaction
    const prerequisitesSatisfied = this.checkPrerequisites(course);
    if (!prerequisitesSatisfied.satisfied) {
      return null; // Can't take this course yet
    }

    if (prerequisitesSatisfied.readyToTake) {
      score += 50;
      reasons.push('Prerequisites completed');
      category = 'prerequisite-ready';
    }

    // Major-related courses get higher priority
    if (this.isMajorRelated(course)) {
      score += 40;
      reasons.push('Related to your major');
      category = 'major-requirement';
    }

    // Thread-related courses
    if (this.isThreadRelated(course)) {
      score += 30;
      reasons.push('Supports your threads');
      category = 'thread-related';
    }

    // Foundation courses (1000-2000 level)
    if (this.isFoundationCourse(course)) {
      score += 20;
      reasons.push('Foundation course');
      category = 'foundation';
    }

    // Course sequence logic (e.g., CS 1331 → CS 1332)
    const sequenceBonus = this.getSequenceBonus(course);
    if (sequenceBonus > 0) {
      score += sequenceBonus;
      reasons.push('Next in sequence');
    }

    // Credit hours consideration (prefer 3-4 credit courses)
    if (course.credits >= 3 && course.credits <= 4) {
      score += 5;
    }

    // Course type bonuses
    if (course.course_type === 'Core') {
      score += 15;
    } else if (course.course_type === 'Required') {
      score += 10;
    }

    // Determine priority based on score
    let priority: CourseRecommendation['priority'] = 'low';
    if (score >= 70) {
      priority = 'high';
    } else if (score >= 40) {
      priority = 'medium';
    }

    return {
      course,
      score,
      reasons,
      priority,
      category
    };
  }

  /**
   * Check if prerequisites are satisfied
   */
  private checkPrerequisites(course: Course): { satisfied: boolean; readyToTake: boolean } {
    // If no prerequisites, it's always available
    if (!course.prerequisites || !course.prerequisites.courses || course.prerequisites.courses.length === 0) {
      return { satisfied: true, readyToTake: true };
    }

    const completedCodes = new Set(this.completedCourses.map(c => c.code));
    
    // Simple prerequisite check - all prerequisites must be completed
    const allPrereqsMet = course.prerequisites.courses?.every((prereq: any) => {
      // Handle string prerequisites (course codes)
      if (typeof prereq === 'string') {
        return completedCodes.has(prereq);
      }
      // Handle object prerequisites
      if (typeof prereq === 'object' && prereq.code) {
        return completedCodes.has(prereq.code);
      }
      return false;
    });

    return {
      satisfied: allPrereqsMet,
      readyToTake: allPrereqsMet
    };
  }

  /**
   * Check if course is related to user's major
   */
  private isMajorRelated(course: Course): boolean {
    if (!this.userMajor) return false;

    // Extract subject from course code (e.g., "CS" from "CS 1331")
    const courseSubject = course.code.split(' ')[0];
    
    // Major-to-subject mapping
    const majorSubjects: Record<string, string[]> = {
      'Computer Science': ['CS', 'MATH'],
      'Electrical Engineering': ['ECE', 'EE', 'MATH', 'PHYS'],
      'Mechanical Engineering': ['ME', 'MATH', 'PHYS'],
      'Aerospace Engineering': ['AE', 'MATH', 'PHYS'],
      'Industrial Engineering': ['ISYE', 'MATH'],
      'Civil Engineering': ['CE', 'MATH', 'PHYS'],
      'Chemical Engineering': ['CHBE', 'CHEM', 'MATH'],
      'Biomedical Engineering': ['BMED', 'BIOL', 'MATH'],
      'Business Administration': ['MGT', 'ACCT', 'ECON', 'MATH'],
      'Psychology': ['PSYC', 'MATH', 'BIOL'],
      'Biology': ['BIOL', 'CHEM', 'MATH'],
      'Chemistry': ['CHEM', 'MATH', 'PHYS'],
      'Physics': ['PHYS', 'MATH'],
      'Mathematics': ['MATH', 'CS'],
    };

    const relevantSubjects = majorSubjects[this.userMajor] || [];
    return relevantSubjects.includes(courseSubject);
  }

  /**
   * Check if course is related to user's threads
   */
  private isThreadRelated(course: Course): boolean {
    if (this.userThreads.length === 0) return false;

    const courseSubject = course.code.split(' ')[0];
    const courseNumber = parseInt(course.code.split(' ')[1] || '0');

    // Thread-specific course patterns
    for (const thread of this.userThreads) {
      if (thread.toLowerCase().includes('intelligence') || thread.toLowerCase().includes('ai')) {
        if (courseSubject === 'CS' && (
          courseNumber >= 3600 && courseNumber <= 4999 &&
          (course.title.toLowerCase().includes('intelligence') ||
           course.title.toLowerCase().includes('machine') ||
           course.title.toLowerCase().includes('learning') ||
           course.title.toLowerCase().includes('vision') ||
           course.title.toLowerCase().includes('robotics'))
        )) {
          return true;
        }
      }
      
      if (thread.toLowerCase().includes('systems')) {
        if (courseSubject === 'CS' && (
          course.title.toLowerCase().includes('systems') ||
          course.title.toLowerCase().includes('operating') ||
          course.title.toLowerCase().includes('network') ||
          course.title.toLowerCase().includes('distributed')
        )) {
          return true;
        }
      }
      
      if (thread.toLowerCase().includes('theory')) {
        if (courseSubject === 'CS' && (
          course.title.toLowerCase().includes('algorithm') ||
          course.title.toLowerCase().includes('complexity') ||
          course.title.toLowerCase().includes('theory') ||
          course.title.toLowerCase().includes('discrete')
        )) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if course is a foundation course
   */
  private isFoundationCourse(course: Course): boolean {
    const courseNumber = parseInt(course.code.split(' ')[1] || '0');
    return courseNumber >= 1000 && courseNumber < 3000;
  }

  /**
   * Get sequence bonus for common course progressions
   */
  private getSequenceBonus(course: Course): number {
    const completedCodes = new Set(this.completedCourses.map(c => c.code));
    
    // Common sequences
    const sequences: Record<string, string[]> = {
      'CS 1332': ['CS 1331'],
      'CS 2110': ['CS 1331'],
      'CS 3510': ['CS 1332'],
      'CS 3251': ['CS 2110'],
      'CS 4400': ['CS 1332'],
      'MATH 1552': ['MATH 1551'],
      'MATH 2551': ['MATH 1552'],
      'PHYS 2212': ['PHYS 2211'],
    };

    const prerequisites = sequences[course.code];
    if (prerequisites && prerequisites.every(prereq => completedCodes.has(prereq))) {
      return 25; // Bonus for being next in a logical sequence
    }

    return 0;
  }
}

/**
 * Simple AI-powered recommendation enhancer using free OpenAI-compatible API
 */
export class AIRecommendationEnhancer {
  private static readonly API_ENDPOINT = 'https://api.together.xyz/v1/chat/completions'; // Free alternative
  private static readonly MODEL = 'meta-llama/Llama-2-7b-chat-hf';

  static async enhanceRecommendations(
    recommendations: CourseRecommendation[],
    userProfile: { major: string; threads: string[]; completedCourses: string[] },
    maxEnhanced = 5
  ): Promise<CourseRecommendation[]> {
    try {
      // Only enhance top recommendations to save API calls
      const topRecommendations = recommendations.slice(0, maxEnhanced);
      
      // const prompt = this.buildPrompt(topRecommendations, userProfile); // Unused for now
      
      // Try AI enhancement with timeout
      const aiResponse = await Promise.race([
        this.callAI(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 10000)
        )
      ]);

      if (aiResponse) {
        return this.parseAIResponse(aiResponse, topRecommendations);
      }
    } catch (error) {
      console.warn('AI enhancement failed, using fallback:', error);
    }

    // Fallback: return original recommendations with enhanced reasons
    return this.fallbackEnhancement(recommendations);
  }

  private static buildPrompt(
    recommendations: CourseRecommendation[],
    userProfile: { major: string; threads: string[]; completedCourses: string[] }
  ): string {
    return `As an academic advisor for Georgia Tech, analyze these course recommendations for a ${userProfile.major} student with threads: ${userProfile.threads.join(', ')}.

Completed courses: ${userProfile.completedCourses.join(', ')}

Recommended courses:
${recommendations.map((r, i) => `${i + 1}. ${r.course.code}: ${r.course.title} (${r.reasons.join(', ')})`).join('\n')}

For each course, provide:
1. Enhanced priority (high/medium/low)
2. Semester timing recommendation (Fall/Spring/Either)
3. One key reason why this course is valuable

Respond in JSON format:
{
  "recommendations": [
    {
      "courseCode": "CS 3510",
      "priority": "high",
      "timing": "Either",
      "keyReason": "Essential algorithms foundation for technical interviews"
    }
  ]
}`;
  }

  private static async callAI(): Promise<string | null> {
    // For demo purposes, return a mock response
    // In production, implement actual AI API call
    return JSON.stringify({
      recommendations: [
        {
          courseCode: "MATH 1552",
          priority: "high",
          timing: "Either",
          keyReason: "Essential calculus foundation for advanced coursework across all engineering and science majors"
        }
      ]
    });
  }

  private static parseAIResponse(
    aiResponse: string,
    originalRecommendations: CourseRecommendation[]
  ): CourseRecommendation[] {
    try {
      const parsed = JSON.parse(aiResponse);
      const enhanced = [...originalRecommendations];

      for (const aiRec of parsed.recommendations || []) {
        const originalIndex = enhanced.findIndex(r => r.course.code === aiRec.courseCode);
        if (originalIndex >= 0) {
          enhanced[originalIndex] = {
            ...enhanced[originalIndex],
            priority: aiRec.priority || enhanced[originalIndex].priority,
            reasons: [aiRec.keyReason || enhanced[originalIndex].reasons[0]]
          };
        }
      }

      return enhanced;
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return originalRecommendations;
    }
  }

  private static fallbackEnhancement(
    recommendations: CourseRecommendation[],
  ): CourseRecommendation[] {
    // Enhanced reasoning based on profile
    return recommendations.map(rec => {
      const enhancedReasons = [...rec.reasons];
      
      // Add career-focused reasons
      if (rec.category === 'prerequisite-ready') {
        enhancedReasons.push('Builds foundation for advanced coursework');
      }
      
      if (rec.course.code.includes('CS 3') || rec.course.code.includes('CS 4')) {
        enhancedReasons.push('Valuable for technical interviews');
      }

      return {
        ...rec,
        reasons: enhancedReasons.slice(0, 3) // Keep top 3 reasons
      };
    });
  }
}