/**
 * Enhanced Requirements Hook - Phase 2.1.2
 * Comprehensive degree requirement tracking with progress calculation
 * Supports multiple requirement types, flexible options, and completion tracking
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { userDataService, UserCourseCompletion } from '@/lib/database/userDataService';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { 
  VisualRequirementCategory,
  DegreeProgram,
  DegreeRequirement,
  RequirementProgress,
  DegreeProgressSummary,
  CategoryProgress,
  ThreadProgress,
  RequirementCalculationResponse,
  RequirementDisplaySettings,
  FlexibleOption
} from '@/types/requirements';

export interface EnhancedRequirementProgress {
  categoryId: string;
  categoryName: string;
  requiredCredits: number;
  completedCredits: number;
  progressPercentage: number;
  completedCourses: string[];
  plannedCourses: string[];
  satisfiedRequirements: string[];
  remainingRequirements: {
    path: string;
    name: string;
    credits: number;
    options: string[];
  }[];
}

export const useRequirements = (
  settings: RequirementDisplaySettings = {
    groupByCategory: true,
    showCompletedRequirements: true,
    showProgressBars: true,
    showCourseDetails: false,
    sortBy: 'category',
    expandedCategories: []
  }
) => {
  const { user: authUser } = useAuth();
  const { fetchDegreeProgramRequirements, fetchMinorProgramsRequirements, getAllCourses, semesters } = usePlannerStore();
  
  const [completions, setCompletions] = useState<UserCourseCompletion[]>([]);
  const [degreeProgram, setDegreeProgram] = useState<any>(null);
  const [minorPrograms, setMinorPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data when user changes
  useEffect(() => {
    const loadRequirementsData = async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_COMPLETED_COURSES, DEMO_REQUIREMENTS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useRequirements: Using mock data, NO API calls');

          // Convert demo requirements to proper format
          const mockCompletions: UserCourseCompletion[] = DEMO_COMPLETED_COURSES.map((course: any) => ({
            id: course.id,
            user_id: -1,
            course_id: course.id,
            status: 'completed' as const,
            grade: course.grade || 'A',
            semester: course.semesterId?.toString() || 'Fall 2024',
            credits: course.credits,
            completed_at: new Date().toISOString(),
          }));

          // Mock degree program with requirements
          const mockDegreeProgram = {
            id: 1,
            name: 'Computer Science',
            code: 'CS',
            requirements: DEMO_REQUIREMENTS.map((req: any) => ({
              id: req.id,
              name: req.name,
              description: req.category,
              minCredits: req.credits_required,
              courses: req.courses.map((c: any) => ({
                id: c.code,
                code: c.code,
                title: c.title,
                credits: c.credits,
              }))
            }))
          };

          setCompletions(mockCompletions);
          setDegreeProgram(mockDegreeProgram);
          setMinorPrograms([]);
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      if (!authUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [
          courseCompletions,
          degree,
          minors
        ] = await Promise.all([
          userDataService.getCourseCompletions(),
          fetchDegreeProgramRequirements(),
          fetchMinorProgramsRequirements()
        ]);

        setCompletions(courseCompletions);
        setDegreeProgram(degree);
        setMinorPrograms(minors);

      } catch (err) {
        console.error('Error loading requirements data:', err);
        setError('Failed to load requirements data');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequirementsData();
  }, [authUser, fetchDegreeProgramRequirements, fetchMinorProgramsRequirements]);

  // Convert course completions to course codes for easy lookup
  const completedCourseCodes = useMemo(() => {
    return new Set(
      completions
        .filter(c => c.status === 'completed')
        .map(c => (c as any).courses?.code || `course-${c.course_id}`)
    );
  }, [completions]);

  // Get planned courses from Zustand store
  const plannedCourseCodes = useMemo(() => {
    const plannedCourses = getAllCourses().filter(c => c.status === 'planned');
    return new Set(plannedCourses.map(c => c.code));
  }, [getAllCourses]);

  // Process degree requirements with actual completion data
  const processedDegreeRequirements = useMemo((): VisualRequirementCategory[] => {
    if (!degreeProgram?.requirements) return [];

    return degreeProgram.requirements.map((section: any, index: number) => {
      const sectionId = section.id || `section-${index}`;
      
      // Calculate completion for this section
      const sectionCourses = section.courses || [];
      const completedInSection = sectionCourses.filter((course: any) => 
        completedCourseCodes.has(course.code)
      );
      const plannedInSection = sectionCourses.filter((course: any) => 
        plannedCourseCodes.has(course.code) && !completedCourseCodes.has(course.code)
      );

      const completedCredits = completedInSection.reduce((sum: number, course: any) => 
        sum + (course.credits || 3), 0
      );
      const minCredits = section.minCredits || sectionCourses.reduce((sum: number, course: any) => 
        sum + (course.credits || 3), 0
      );

      return {
        id: sectionId,
        name: section.name || `Section ${index + 1}`,
        description: section.description || '',
        courses: sectionCourses.map((course: any, courseIndex: number) => ({
          ...course,
          id: course.id || `${sectionId}-course-${courseIndex}`,
          credits: course.credits || 3,
        })),
        minCredits,
        completedCredits,
        isCompleted: completedCredits >= minCredits,
        progressPercentage: minCredits > 0 ? Math.min((completedCredits / minCredits) * 100, 100) : 0,
        completedCourses: completedInSection.map((c: any) => c.code),
        plannedCourses: plannedInSection.map((c: any) => c.code),
      };
    });
  }, [degreeProgram, completedCourseCodes, plannedCourseCodes]);

  // Process minor requirements
  const processedMinorRequirements = useMemo((): VisualRequirementCategory[] => {
    if (!minorPrograms || minorPrograms.length === 0) return [];

    return minorPrograms.flatMap((minor: any, minorIndex: number) => {
      if (!minor.requirements) return [];

      return minor.requirements.map((section: any, sectionIndex: number) => {
        const sectionId = `minor-${minorIndex}-section-${sectionIndex}`;
        
        const sectionCourses = section.courses || [];
        const completedInSection = sectionCourses.filter((course: any) => 
          completedCourseCodes.has(course.code)
        );
        const plannedInSection = sectionCourses.filter((course: any) => 
          plannedCourseCodes.has(course.code) && !completedCourseCodes.has(course.code)
        );

        const completedCredits = completedInSection.reduce((sum: number, course: any) => 
          sum + (course.credits || 3), 0
        );
        const minCredits = section.minCredits || sectionCourses.reduce((sum: number, course: any) => 
          sum + (course.credits || 3), 0
        );

        return {
          id: sectionId,
          name: `${minor.name}: ${section.name || `Section ${sectionIndex + 1}`}`,
          description: section.description || `${minor.name} requirement section`,
          courses: sectionCourses.map((course: any, courseIndex: number) => ({
            ...course,
            id: course.id || `${sectionId}-course-${courseIndex}`,
            credits: course.credits || 3,
          })),
          minCredits,
          completedCredits,
          isCompleted: completedCredits >= minCredits,
          progressPercentage: minCredits > 0 ? Math.min((completedCredits / minCredits) * 100, 100) : 0,
          completedCourses: completedInSection.map((c: any) => c.code),
          plannedCourses: plannedInSection.map((c: any) => c.code),
        };
      });
    });
  }, [minorPrograms, completedCourseCodes, plannedCourseCodes]);

  // Combine all requirements
  const allRequirements = useMemo(() => {
    return [
      ...processedDegreeRequirements,
      ...processedMinorRequirements,
    ];
  }, [processedDegreeRequirements, processedMinorRequirements]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (allRequirements.length === 0) {
      return {
        totalSections: 0,
        completedSections: 0,
        totalCredits: 0,
        completedCredits: 0,
        progressPercentage: 0,
      };
    }

    const totalSections = allRequirements.length;
    const completedSections = allRequirements.filter(req => req.isCompleted).length;
    const totalCredits = allRequirements.reduce((sum, req) => sum + (req.minCredits || 0), 0);
    const completedCredits = allRequirements.reduce((sum, req) => sum + (req.completedCredits || 0), 0);
    const progressPercentage = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

    return {
      totalSections,
      completedSections,
      totalCredits,
      completedCredits,
      progressPercentage,
    };
  }, [allRequirements]);

  // Function to mark course as completed in database
  const markCourseCompleted = async (courseCode: string, grade: string = 'A', semester?: string) => {
    try {
      // Find course ID (this would need to be enhanced with actual course lookup)
      const currentSemester = semester || `${new Date().getFullYear()}-fall`;
      
      // For now, we'll create a completion record with a placeholder course ID
      // In a real implementation, you'd lookup the course ID from the courses table
      const success = await userDataService.saveCourseCompletion({
        course_id: 1, // This would be the actual course ID
        grade,
        semester: currentSemester,
        credits: 3,
        status: 'completed',
      });

      if (success) {
        // Refresh data
        const updatedCompletions = await userDataService.getCourseCompletions();
        setCompletions(updatedCompletions);
      }

      return success;
    } catch (error) {
      console.error('Error marking course as completed:', error);
      return false;
    }
  };

  // PHASE 2.1.2 ENHANCEMENTS - Advanced requirement tracking

  // Calculate estimated graduation semester (moved before useMemo to avoid temporal dead zone)
  const calculateGraduationSemester = useCallback((remainingCredits: number): string => {
    const currentYear = new Date().getFullYear();
    const averageCreditsPerSemester = 15;
    const remainingSemesters = Math.ceil(remainingCredits / averageCreditsPerSemester);
    const currentMonth = new Date().getMonth();
    
    // Determine current/next semester
    const isFallSemester = currentMonth >= 8; // August onwards
    const yearOffset = Math.floor(remainingSemesters / 2);
    const isEvenSemester = remainingSemesters % 2 === 0;
    
    const graduationYear = currentYear + yearOffset + (isEvenSemester && !isFallSemester ? 1 : 0);
    const graduationSemester = (remainingSemesters % 2 === 1) ? 'Spring' : 'Fall';
    
    return `${graduationSemester} ${graduationYear}`;
  }, []);

  // Enhanced progress summary with Phase 2 features
  const enhancedProgressSummary = useMemo((): DegreeProgressSummary | null => {
    if (!degreeProgram || allRequirements.length === 0) return null;

    const totalCreditsRequired = overallProgress.totalCredits;
    const totalCreditsCompleted = overallProgress.completedCredits;
    
    // Calculate in-progress and planned credits
    const semesterCourses = Object.values(semesters).flatMap(s => s?.courses || []);
    const inProgressCredits = semesterCourses
      .filter(c => c.status === 'in-progress')
      .reduce((sum, c) => sum + (c.credits || 3), 0);
    const plannedCredits = semesterCourses
      .filter(c => c.status === 'planned')
      .reduce((sum, c) => sum + (c.credits || 3), 0);

    // Generate warnings and recommendations
    const warnings: string[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];

    allRequirements.forEach(req => {
      if (req.progressPercentage < 25 && req.minCredits > 9) {
        warnings.push(`${req.name}: Very low progress (${Math.round(req.progressPercentage)}%)`);
      }
      if (req.completedCredits === 0 && req.minCredits > 6) {
        blockers.push(`${req.name}: No courses completed yet`);
      }
    });

    if (totalCreditsCompleted < totalCreditsRequired * 0.5) {
      recommendations.push('Focus on completing core requirements first');
    }
    if (overallProgress.completedSections < overallProgress.totalSections * 0.3) {
      recommendations.push('Consider spreading course completions across requirement categories');
    }

    return {
      degreeProgramId: degreeProgram.id || 1,
      degreeProgram: {
        id: degreeProgram.id || 1,
        name: degreeProgram.name || 'Computer Science',
        code: degreeProgram.code || 'CS',
        college: degreeProgram.college || 'College of Computing',
        totalCredits: totalCreditsRequired,
        minGpa: degreeProgram.minGpa || 2.0,
        isActive: true
      },
      totalCreditsRequired,
      totalCreditsCompleted,
      totalCreditsInProgress: inProgressCredits,
      totalCreditsPlanned: plannedCredits,
      overallCompletionPercentage: overallProgress.progressPercentage,
      estimatedGraduationSemester: calculateGraduationSemester(totalCreditsRequired - totalCreditsCompleted),
      requirementProgress: allRequirements.map(req => ({
        requirement: {
          id: parseInt(req.id.replace(/\D/g, '')) || 1,
          degreeProgramId: 1,
          requirementType: 'major' as const,
          requirementName: req.name,
          description: req.description,
          requiredCredits: req.minCredits || 0,
          requiredCourses: req.courses.map(c => c.code),
          flexibleOptions: [],
          sortOrder: 0,
          isRequired: true
        },
        progress: {
          id: 1,
          userId: authUser?.id || 1,
          requirementId: parseInt(req.id.replace(/\D/g, '')) || 1,
          completedCredits: req.completedCredits || 0,
          completedCourses: req.completedCourses || [],
          inProgressCourses: [],
          plannedCourses: req.plannedCourses || [],
          isSatisfied: req.isCompleted,
          completionPercentage: Math.round(req.progressPercentage)
        },
        status: req.isCompleted ? 'completed' as const : 
               req.progressPercentage > 0 ? 'in-progress' as const : 'not-started' as const,
        remainingCredits: Math.max(0, (req.minCredits || 0) - (req.completedCredits || 0)),
        remainingCourses: req.courses
          .filter(c => !req.completedCourses.includes(c.code))
          .map(c => c.code),
        availableOptions: [],
        nextCourses: req.courses
          .filter(c => !req.completedCourses.includes(c.code))
          .slice(0, 3)
          .map(c => c.code)
      })),
      categoryProgress: [],
      threadProgress: [],
      warnings,
      blockers,
      recommendations
    };
  }, [degreeProgram, allRequirements, overallProgress, semesters, authUser, calculateGraduationSemester]);

  // Enhanced actions for Phase 2
  const refreshRequirements = useCallback(async () => {
    setIsLoading(true);
    try {
      const [courseCompletions, degree, minors] = await Promise.all([
        userDataService.getCourseCompletions(),
        fetchDegreeProgramRequirements(),
        fetchMinorProgramsRequirements()
      ]);

      setCompletions(courseCompletions);
      setDegreeProgram(degree);
      setMinorPrograms(minors);
    } catch (err) {
      console.error('Error refreshing requirements:', err);
      setError('Failed to refresh requirements data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDegreeProgramRequirements, fetchMinorProgramsRequirements]);

  const exportProgress = useCallback(async (format: 'json' | 'csv'): Promise<Blob> => {
    if (!enhancedProgressSummary) throw new Error('No progress data available');

    const data = format === 'json' 
      ? JSON.stringify(enhancedProgressSummary, null, 2)
      : convertToCSV(enhancedProgressSummary);

    return new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
  }, [enhancedProgressSummary]);

  const convertToCSV = (summary: DegreeProgressSummary): string => {
    const headers = ['Requirement', 'Credits Required', 'Credits Completed', 'Completion %', 'Status'];
    const rows = summary.requirementProgress.map(progress => [
      progress.requirement.requirementName,
      progress.requirement.requiredCredits,
      progress.progress.completedCredits,
      progress.progress.completionPercentage,
      progress.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Filtered requirements based on settings
  const filteredRequirements = useMemo(() => {
    let filtered = [...allRequirements];

    if (!settings.showCompletedRequirements) {
      filtered = filtered.filter(req => !req.isCompleted);
    }

    switch (settings.sortBy) {
      case 'completion':
        filtered.sort((a, b) => a.progressPercentage - b.progressPercentage);
        break;
      case 'priority':
        filtered.sort((a, b) => {
          if (a.isCompleted && !b.isCompleted) return 1;
          if (!a.isCompleted && b.isCompleted) return -1;
          return b.progressPercentage - a.progressPercentage;
        });
        break;
      case 'category':
      default:
        // Already sorted by position
        break;
    }

    return filtered;
  }, [allRequirements, settings]);

  const getNextRecommendedCourses = useCallback((limit = 5): string[] => {
    const recommendations = new Set<string>();
    
    allRequirements
      .filter(req => !req.isCompleted && req.progressPercentage < 100)
      .slice(0, 3)
      .forEach(req => {
        req.courses
          .filter(c => !req.completedCourses.includes(c.code))
          .slice(0, 2)
          .forEach(c => recommendations.add(c.code));
      });

    return Array.from(recommendations).slice(0, limit);
  }, [allRequirements]);

  const getCriticalPath = useCallback(() => {
    return allRequirements
      .filter(req => !req.isCompleted && req.minCredits >= 6)
      .sort((a, b) => (b.minCredits - b.completedCredits) - (a.minCredits - a.completedCredits))
      .slice(0, 5);
  }, [allRequirements]);

  return {
    // Legacy API (maintained for backwards compatibility)
    degreeRequirements: processedDegreeRequirements,
    minorRequirements: processedMinorRequirements,
    allRequirements,
    completedCourseCodes,
    plannedCourseCodes,
    overallProgress,
    
    // Phase 2 Enhanced API
    progressSummary: enhancedProgressSummary,
    filteredRequirements,
    
    // Helper functions
    getNextRecommendedCourses,
    getCriticalPath,
    calculateGraduationSemester,
    
    // State
    isLoading,
    error,
    
    // Enhanced Actions
    markCourseCompleted,
    refreshRequirements,
    exportProgress,
    refresh: refreshRequirements, // Alias for backwards compatibility
  };
};