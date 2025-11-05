/**
 * Flexible Course Service
 * Handles user_flexible_mappings for "choose X from Y" requirements
 * Manages user selections for flexible requirement sections
 */

import { userDataService } from '@/lib/database/userDataService';

export interface FlexibleRequirement {
  id: string;
  path: string;
  name: string;
  description: string;
  requireCount: number; // How many courses to choose
  options: FlexibleCourseOption[];
  userSelections: UserSelection[];
  isComplete: boolean;
  progressText: string;
}

export interface FlexibleCourseOption {
  courseId: number;
  courseCode: string;
  courseTitle: string;
  credits: number;
  prerequisites: string[];
  isSelected: boolean;
  isCompleted: boolean;
}

export interface UserSelection {
  mappingId: number;
  courseId: number;
  courseCode: string;
  dateSelected: Date;
  isCompleted: boolean;
}

class FlexibleCourseService {
  /**
   * Get all flexible requirements for user's degree program
   */
  async getFlexibleRequirements(): Promise<FlexibleRequirement[]> {
    try {
      // Get user's flexible mappings
      const mappings = await userDataService.getFlexibleMappings();
      // Get user's degree program (use userDataService)
      const userProfile = await userDataService.getUserProfile();
      const majorName = userProfile?.major;
      if (!majorName) return [];

      // Query degree program via API route to avoid client-side RLS issues
      const resp = await fetch(`/api/degree-programs?major=${encodeURIComponent(majorName)}`);
      if (!resp.ok) return [];
      const program = await resp.json();
      if (!program) return [];

      // Parse requirements to find flexible sections
  const requirements = Array.isArray(program.requirements) ? program.requirements : [];
      const flexibleRequirements: FlexibleRequirement[] = [];

  requirements.forEach((section: any, sectionIndex: number) => {
        if (section.type === 'flexible' || section.selectFrom) {
          const requirementPath = `requirements[${sectionIndex}]`;
          const userSelectionsForSection = mappings.filter(m => m.requirement_path === requirementPath);

          // Get course options
          const courseOptions: FlexibleCourseOption[] = (section.options || section.courses || []).map((course: any) => {
            const isSelected = userSelectionsForSection.some(selection => selection.selected_course_id === course.id);
            
            return {
              courseId: course.id,
              courseCode: course.code,
              courseTitle: course.title,
              credits: course.credits || 3,
              prerequisites: course.prerequisites || [],
              isSelected,
              isCompleted: false, // Would need to check against completions
            };
          });

          // Create user selections
          const userSelections: UserSelection[] = userSelectionsForSection.map(mapping => {
            const option = courseOptions.find(opt => opt.courseId === mapping.selected_course_id);
            return {
              mappingId: mapping.id,
              courseId: mapping.selected_course_id,
              courseCode: option?.courseCode || `COURSE-${mapping.selected_course_id}`,
              dateSelected: new Date(mapping.created_at || Date.now()),
              isCompleted: false, // Would need to check against completions
            };
          });

          const requireCount = section.selectCount || section.minCount || 1;
          const isComplete = userSelections.length >= requireCount;
          const progressText = `${userSelections.length}/${requireCount} selected`;

          flexibleRequirements.push({
            id: `flexible-${sectionIndex}`,
            path: requirementPath,
            name: section.name || `Flexible Requirement ${sectionIndex + 1}`,
            description: section.description || `Choose ${requireCount} courses from the available options`,
            requireCount,
            options: courseOptions,
            userSelections,
            isComplete,
            progressText,
          });
        }
      });

      return flexibleRequirements;
    } catch (error) {
      console.error('Error getting flexible requirements:', error);
      return [];
    }
  }

  /**
   * Select a course for a flexible requirement
   */
  async selectCourse(requirementPath: string, courseId: number, degreeProgramId?: number): Promise<boolean> {
    try {
      // Get degree program ID if not provided
      let programId = degreeProgramId;
      if (!programId) {
        const userProfile = await userDataService.getUserProfile();
        const major = userProfile?.major;
        if (!major) return false;

        try {
          const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(major)}`);
          if (!response.ok) return false;
          const program = await response.json();
          programId = program?.id;
        } catch (err) {
          console.error('Error fetching degree program for major:', err);
          return false;
        }
      }

      // Save the selection
      const success = await userDataService.saveFlexibleMapping({
        degree_program_id: programId,
        requirement_path: requirementPath,
        selected_course_id: courseId,
      });

      if (success) {
        console.log(`✅ Selected course ${courseId} for requirement ${requirementPath}`);
      }

      return success;
    } catch (error) {
      console.error('Error selecting course:', error);
      return false;
    }
  }

  /**
   * Deselect a course for a flexible requirement
   */
  async deselectCourse(requirementPath: string, courseId: number): Promise<boolean> {
    try {
      // Use userDataService to delete the mapping
      const success = await userDataService.deleteFlexibleMapping(requirementPath, courseId);
      if (!success) return false;

      console.log(`✅ Deselected course ${courseId} from requirement ${requirementPath}`);
      return true;
    } catch (error) {
      console.error('Error deselecting course:', error);
      return false;
    }
  }

  /**
   * Get user's progress on flexible requirements
   */
  async getFlexibleProgress(): Promise<{
    totalRequirements: number;
    completedRequirements: number;
    progressPercentage: number;
    incompleteRequirements: FlexibleRequirement[];
  }> {
    try {
      const requirements = await this.getFlexibleRequirements();
      
      const totalRequirements = requirements.length;
      const completedRequirements = requirements.filter(req => req.isComplete).length;
      const progressPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
      const incompleteRequirements = requirements.filter(req => !req.isComplete);

      return {
        totalRequirements,
        completedRequirements,
        progressPercentage,
        incompleteRequirements,
      };
    } catch (error) {
      console.error('Error getting flexible progress:', error);
      return {
        totalRequirements: 0,
        completedRequirements: 0,
        progressPercentage: 0,
        incompleteRequirements: [],
      };
    }
  }

  /**
   * Validate user selections against requirements
   */
  async validateSelections(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const requirements = await this.getFlexibleRequirements();
      const errors: string[] = [];
      const warnings: string[] = [];

      requirements.forEach(requirement => {
        // Check if requirement has enough selections
        if (requirement.userSelections.length < requirement.requireCount) {
          errors.push(`${requirement.name}: Need ${requirement.requireCount - requirement.userSelections.length} more selections`);
        }

        // Check for too many selections
        if (requirement.userSelections.length > requirement.requireCount) {
          warnings.push(`${requirement.name}: You've selected more courses than required`);
        }

        // Check for prerequisites (simplified check)
        requirement.userSelections.forEach(selection => {
          const option = requirement.options.find(opt => opt.courseId === selection.courseId);
          if (option && option.prerequisites.length > 0) {
            warnings.push(`${requirement.name}: Course ${selection.courseCode} has prerequisites`);
          }
        });
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating selections:', error);
      return {
        isValid: false,
        errors: ['Failed to validate selections'],
        warnings: [],
      };
    }
  }

  /**
   * Get recommended courses for a flexible requirement
   */
  async getRecommendations(requirementPath: string): Promise<FlexibleCourseOption[]> {
    try {
      const requirements = await this.getFlexibleRequirements();
      const requirement = requirements.find(req => req.path === requirementPath);
      
      if (!requirement) return [];

      // Simple recommendation: return unselected options sorted by popularity
      // In a real implementation, this could use ML or more sophisticated logic
      return requirement.options
        .filter(option => !option.isSelected)
        .sort((a, b) => {
          // Prioritize courses with fewer prerequisites
          const aDifficulty = a.prerequisites.length;
          const bDifficulty = b.prerequisites.length;
          return aDifficulty - bDifficulty;
        })
        .slice(0, 5); // Top 5 recommendations
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const flexibleCourseService = new FlexibleCourseService();
export default flexibleCourseService;