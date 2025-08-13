/**
 * User Data Service - Comprehensive database integration layer
 * Connects all user-related tables for proper data flow
 */

import { supabase } from '@/lib/supabaseClient';
import { UserData as MainUserData } from '@/types/user';
import { createComponentLogger } from '@/lib/security/logger';

// Types for database tables
export interface UserCourseCompletion {
  id: number;
  user_id: number;
  course_id: number;
  grade: string;
  semester: string;
  credits: number;
  status: 'completed' | 'in_progress' | 'withdrawn';
  completed_at: string;
}

export interface UserSemesterPlan {
  id: number;
  user_id: number;
  semester_id: string;
  course_id: number;
  position: number;
  credits: number;
  status: 'planned' | 'registered' | 'completed';
}

export interface UserRequirementProgress {
  id: number;
  user_id: number;
  degree_program_id: number;
  requirement_path: string;
  requirement_type: string;
  is_satisfied: boolean;
  satisfied_by_course_id?: number;
  credits_earned: number;
  credits_required: number;
}

export interface UserFlexibleMapping {
  id: number;
  user_id: number;
  degree_program_id: number;
  requirement_path: string;
  selected_course_id: number;
  created_at?: string;
  updated_at?: string;
}

// Re-export the main UserData interface for consistency
export type UserData = MainUserData;

class UserDataService {
  /**
   * Get current user's database ID from auth
   */
  async getCurrentUserId(): Promise<number | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return null;
      }

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return null;
      }

      return userRecord?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Get complete user profile data
   */
  async getUserProfile(): Promise<UserData | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return null;

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select(`
          id, auth_id, full_name, email, gt_username, major, 
          selected_threads, minors, graduation_year, degree_program_id,
          completed_courses, completed_groups, has_detailed_gpa,
          plan_settings, semester_gpas
        `)
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        // Don't log PGRST116 errors (no rows returned) - these are normal when user profile doesn't exist yet
        if (userError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', userError);
        }
        return null;
      }

      return userRecord;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Get all course completions for current user
   */
  async getCourseCompletions(): Promise<UserCourseCompletion[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_course_completions')
        .select(`
          id, user_id, course_id, grade, semester, credits, status, completed_at,
          courses!inner(id, code, title)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching course completions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCourseCompletions:', error);
      return [];
    }
  }

  /**
   * Get semester plans for current user
   */
  async getSemesterPlans(): Promise<UserSemesterPlan[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_semester_plans')
        .select(`
          id, user_id, semester_id, course_id, position, credits, status,
          courses!inner(id, code, title, credits)
        `)
        .eq('user_id', userId)
        .order('semester_id');

      if (error) {
        console.error('Error fetching semester plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSemesterPlans:', error);
      return [];
    }
  }

  /**
   * Get requirement progress for current user
   */
  async getRequirementProgress(degreeProgramId?: number): Promise<UserRequirementProgress[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      let query = supabase
        .from('user_requirement_progress')
        .select('*')
        .eq('user_id', userId);

      if (degreeProgramId) {
        query = query.eq('degree_program_id', degreeProgramId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching requirement progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRequirementProgress:', error);
      return [];
    }
  }

  /**
   * Get flexible mappings for current user
   */
  async getFlexibleMappings(): Promise<UserFlexibleMapping[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_flexible_mappings')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching flexible mappings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFlexibleMappings:', error);
      return [];
    }
  }

  /**
   * Save/update course completion
   */
  async saveCourseCompletion(completion: Partial<UserCourseCompletion>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('user_course_completions')
        .upsert({
          ...completion,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id,semester'
        });

      if (error) {
        console.error('Error saving course completion:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveCourseCompletion:', error);
      return false;
    }
  }

  /**
   * Save/update semester plan
   */
  async saveSemesterPlan(plan: Partial<UserSemesterPlan>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('user_semester_plans')
        .upsert({
          ...plan,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,semester_id,course_id'
        });

      if (error) {
        console.error('Error saving semester plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveSemesterPlan:', error);
      return false;
    }
  }

  /**
   * Update requirement progress
   */
  async updateRequirementProgress(progress: Partial<UserRequirementProgress>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('user_requirement_progress')
        .upsert({
          ...progress,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,degree_program_id,requirement_path'
        });

      if (error) {
        console.error('Error updating requirement progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateRequirementProgress:', error);
      return false;
    }
  }

  /**
   * Save flexible mapping
   */
  async saveFlexibleMapping(mapping: Partial<UserFlexibleMapping>): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('user_flexible_mappings')
        .upsert({
          ...mapping,
          user_id: userId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,requirement_path,selected_course_id'
        });

      if (error) {
        console.error('Error saving flexible mapping:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveFlexibleMapping:', error);
      return false;
    }
  }

  /**
   * Calculate GPA from actual course completions
   */
  async calculateRealGPA(): Promise<{ currentGPA: number; totalCredits: number; semesterGPAs: Array<{semester: string, gpa: number, credits: number}> }> {
    try {
      const completions = await this.getCourseCompletions();
      const completedCourses = completions.filter(c => c.status === 'completed' && c.grade);

      if (completedCourses.length === 0) {
        return { currentGPA: 0, totalCredits: 0, semesterGPAs: [] };
      }

      // Grade to GPA mapping
      const gradeMap: Record<string, number> = {
        'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
      };

      // Calculate overall GPA
      let totalPoints = 0;
      let totalCredits = 0;

      completedCourses.forEach(course => {
        const points = gradeMap[course.grade] || 0;
        totalPoints += points * course.credits;
        totalCredits += course.credits;
      });

      const currentGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

      // Calculate semester GPAs
      const semesterData: Record<string, { points: number; credits: number }> = {};

      completedCourses.forEach(course => {
        if (!semesterData[course.semester]) {
          semesterData[course.semester] = { points: 0, credits: 0 };
        }
        const points = gradeMap[course.grade] || 0;
        semesterData[course.semester].points += points * course.credits;
        semesterData[course.semester].credits += course.credits;
      });

      const semesterGPAs = Object.entries(semesterData).map(([semester, data]) => ({
        semester,
        gpa: data.credits > 0 ? data.points / data.credits : 0,
        credits: data.credits
      }));

      return { currentGPA, totalCredits, semesterGPAs };
    } catch (error) {
      const logger = createComponentLogger('USER_DATA_SERVICE');
      logger.error('Error calculating real GPA', error, {
        operation: 'calculateRealGPA',
        note: 'Academic data calculation failed'
      });
      return { currentGPA: 0, totalCredits: 0, semesterGPAs: [] };
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    try {
      const [
        userProfile,
        courseCompletions,
        semesterPlans,
        requirementProgress,
        flexibleMappings,
        gpaData
      ] = await Promise.all([
        this.getUserProfile(),
        this.getCourseCompletions(),
        this.getSemesterPlans(),
        this.getRequirementProgress(),
        this.getFlexibleMappings(),
        this.calculateRealGPA()
      ]);

      return {
        userProfile,
        courseCompletions,
        semesterPlans,
        requirementProgress,
        flexibleMappings,
        gpaData
      };
    } catch (error) {
      console.error('Error getting comprehensive dashboard data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userDataService = new UserDataService();
export default userDataService;