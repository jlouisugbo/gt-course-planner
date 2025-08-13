/**
 * GPA Calculation Service
 * Handles all GPA calculations using real database data
 * Replaces placeholder GPA calculations with accurate computation
 */

import { userDataService, UserCourseCompletion } from '@/lib/database/userDataService';
import { createComponentLogger } from '@/lib/security/logger';

export interface GPAData {
  currentGPA: number;
  cumulativeGPA: number;
  totalCredits: number;
  qualityPoints: number;
  semesterGPAs: SemesterGPA[];
  trendAnalysis: GPATrend;
}

export interface SemesterGPA {
  semester: string;
  year: number;
  gpa: number;
  credits: number;
  courses: CourseGrade[];
  qualityPoints: number;
}

export interface CourseGrade {
  courseCode: string;
  grade: string;
  credits: number;
  qualityPoints: number;
}

export interface GPATrend {
  direction: 'improving' | 'declining' | 'stable';
  changeFromLastSemester: number;
  averageGPA: number;
  projectedNextSemester: number;
}

class GPACalculationService {
  // Grade point mapping
  private readonly gradePoints: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'WF': 0.0, 'I': 0.0
  };

  /**
   * Calculate comprehensive GPA data from database
   */
  async calculateComprehensiveGPA(): Promise<GPAData> {
    try {
      const completions = await userDataService.getCourseCompletions();
      const completedCourses = completions.filter(c => 
        c.status === 'completed' && 
        c.grade && 
        this.gradePoints.hasOwnProperty(c.grade)
      );

      if (completedCourses.length === 0) {
        return this.getEmptyGPAData();
      }

      // Calculate semester-by-semester GPAs
      const semesterGPAs = this.calculateSemesterGPAs(completedCourses);
      
      // Calculate cumulative GPA
      const { cumulativeGPA, totalCredits, qualityPoints } = this.calculateCumulativeGPA(completedCourses);
      
      // Analyze trends
      const trendAnalysis = this.analyzeTrend(semesterGPAs);

      return {
        currentGPA: cumulativeGPA,
        cumulativeGPA,
        totalCredits,
        qualityPoints,
        semesterGPAs,
        trendAnalysis,
      };
    } catch (error) {
      const logger = createComponentLogger('GPA_SERVICE');
      logger.error('Error calculating comprehensive GPA', error, {
        operation: 'calculateComprehensiveGPA',
        note: 'Academic data calculation failed'
      });
      return this.getEmptyGPAData();
    }
  }

  /**
   * Calculate GPA for each semester
   */
  calculateSemesterGPAs(completions: UserCourseCompletion[]): SemesterGPA[] {
    // Group by semester
    const semesterGroups: Record<string, UserCourseCompletion[]> = {};
    
    completions.forEach(completion => {
      if (!semesterGroups[completion.semester]) {
        semesterGroups[completion.semester] = [];
      }
      semesterGroups[completion.semester].push(completion);
    });

    // Calculate GPA for each semester
    const semesterGPAs: SemesterGPA[] = Object.entries(semesterGroups).map(([semester, courses]) => {
      const courseGrades: CourseGrade[] = courses.map(course => {
        const gradePoints = this.gradePoints[course.grade] || 0;
        const qualityPoints = gradePoints * course.credits;
        
        return {
          courseCode: `course-${course.course_id}`, // This would be actual course code in real implementation
          grade: course.grade,
          credits: course.credits,
          qualityPoints,
        };
      });

      const totalCredits = courseGrades.reduce((sum, course) => sum + course.credits, 0);
      const totalQualityPoints = courseGrades.reduce((sum, course) => sum + course.qualityPoints, 0);
      const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

      // Extract year from semester string
      const yearMatch = semester.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

      return {
        semester,
        year,
        gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
        credits: totalCredits,
        courses: courseGrades,
        qualityPoints: totalQualityPoints,
      };
    });

    // Sort by year and semester
    return semesterGPAs.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      
      // Sort by semester within year (Spring, Summer, Fall)
      const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
      const aSeason = a.semester.split(' ')[0] as keyof typeof seasonOrder;
      const bSeason = b.semester.split(' ')[0] as keyof typeof seasonOrder;
      
      return (seasonOrder[aSeason] || 0) - (seasonOrder[bSeason] || 0);
    });
  }

  /**
   * Calculate cumulative GPA
   */
  calculateCumulativeGPA(completions: UserCourseCompletion[]): {
    cumulativeGPA: number;
    totalCredits: number;
    qualityPoints: number;
  } {
    let totalQualityPoints = 0;
    let totalCredits = 0;

    completions.forEach(completion => {
      const gradePoints = this.gradePoints[completion.grade] || 0;
      totalQualityPoints += gradePoints * completion.credits;
      totalCredits += completion.credits;
    });

    const cumulativeGPA = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

    return {
      cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
      totalCredits,
      qualityPoints: totalQualityPoints,
    };
  }

  /**
   * Analyze GPA trends
   */
  analyzeTrend(semesterGPAs: SemesterGPA[]): GPATrend {
    if (semesterGPAs.length === 0) {
      return {
        direction: 'stable',
        changeFromLastSemester: 0,
        averageGPA: 0,
        projectedNextSemester: 0,
      };
    }

    if (semesterGPAs.length === 1) {
      return {
        direction: 'stable',
        changeFromLastSemester: 0,
        averageGPA: semesterGPAs[0].gpa,
        projectedNextSemester: semesterGPAs[0].gpa,
      };
    }

    // Calculate average GPA
    const averageGPA = semesterGPAs.reduce((sum, semester) => sum + semester.gpa, 0) / semesterGPAs.length;

    // Compare last two semesters
    const lastSemester = semesterGPAs[semesterGPAs.length - 1];
    const previousSemester = semesterGPAs[semesterGPAs.length - 2];
    const changeFromLastSemester = lastSemester.gpa - previousSemester.gpa;

    // Determine trend direction
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(changeFromLastSemester) > 0.1) {
      direction = changeFromLastSemester > 0 ? 'improving' : 'declining';
    }

    // Simple projection based on recent trend
    const recentSemesters = semesterGPAs.slice(-3); // Last 3 semesters
    const recentTrend = recentSemesters.length > 1 
      ? (recentSemesters[recentSemesters.length - 1].gpa - recentSemesters[0].gpa) / (recentSemesters.length - 1)
      : 0;
    
    const projectedNextSemester = Math.max(0, Math.min(4.0, lastSemester.gpa + recentTrend));

    return {
      direction,
      changeFromLastSemester: Math.round(changeFromLastSemester * 100) / 100,
      averageGPA: Math.round(averageGPA * 100) / 100,
      projectedNextSemester: Math.round(projectedNextSemester * 100) / 100,
    };
  }

  /**
   * Calculate what GPA is needed in remaining semesters to achieve target
   */
  async calculateRequiredGPA(targetGPA: number, remainingSemesters: number, creditsPerSemester: number = 15): Promise<{
    requiredGPA: number;
    isAchievable: boolean;
    analysis: string;
  }> {
    try {
      const currentGPAData = await this.calculateComprehensiveGPA();
      
      if (currentGPAData.totalCredits === 0) {
        return {
          requiredGPA: targetGPA,
          isAchievable: true,
          analysis: `You need to maintain a ${targetGPA.toFixed(2)} GPA to achieve your target.`
        };
      }

      const currentQualityPoints = currentGPAData.qualityPoints;
      const currentCredits = currentGPAData.totalCredits;
      const futureCredits = remainingSemesters * creditsPerSemester;
      const totalFutureCredits = currentCredits + futureCredits;
      
      // Calculate required quality points for target GPA
      const requiredTotalQualityPoints = targetGPA * totalFutureCredits;
      const requiredFutureQualityPoints = requiredTotalQualityPoints - currentQualityPoints;
      const requiredFutureGPA = futureCredits > 0 ? requiredFutureQualityPoints / futureCredits : 0;

      const isAchievable = requiredFutureGPA <= 4.0 && requiredFutureGPA >= 0;
      
      let analysis = '';
      if (requiredFutureGPA < 0) {
        analysis = `Your target GPA of ${targetGPA.toFixed(2)} is not achievable. Your current GPA of ${currentGPAData.currentGPA.toFixed(2)} already exceeds this target.`;
      } else if (requiredFutureGPA > 4.0) {
        analysis = `Your target GPA of ${targetGPA.toFixed(2)} is not achievable. You would need a ${requiredFutureGPA.toFixed(2)} GPA in remaining semesters.`;
      } else {
        analysis = `To achieve your target GPA of ${targetGPA.toFixed(2)}, you need to maintain a ${requiredFutureGPA.toFixed(2)} GPA over the next ${remainingSemesters} semesters.`;
      }

      return {
        requiredGPA: Math.max(0, Math.min(4.0, requiredFutureGPA)),
        isAchievable,
        analysis,
      };
    } catch (error) {
      const logger = createComponentLogger('GPA_SERVICE');
      logger.error('Error calculating required GPA', error, {
        operation: 'calculateRequiredGPAForGoal'
      });
      return {
        requiredGPA: targetGPA,
        isAchievable: false,
        analysis: 'Unable to calculate required GPA due to an error.',
      };
    }
  }

  /**
   * Get empty GPA data structure
   */
  private getEmptyGPAData(): GPAData {
    return {
      currentGPA: 0,
      cumulativeGPA: 0,
      totalCredits: 0,
      qualityPoints: 0,
      semesterGPAs: [],
      trendAnalysis: {
        direction: 'stable',
        changeFromLastSemester: 0,
        averageGPA: 0,
        projectedNextSemester: 0,
      },
    };
  }

  /**
   * Format GPA for display
   */
  formatGPA(gpa: number): string {
    return gpa.toFixed(2);
  }

  /**
   * Get GPA color based on value
   */
  getGPAColor(gpa: number): string {
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.5) return 'text-yellow-600';
    if (gpa >= 2.0) return 'text-orange-600';
    return 'text-red-600';
  }
}

// Export singleton instance
export const gpaCalculationService = new GPACalculationService();
export default gpaCalculationService;