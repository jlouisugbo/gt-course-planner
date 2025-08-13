import React from 'react';
import { motion } from 'framer-motion';
import { RequirementsCategory } from './RequirementsCategory';
import { VisualRequirementCategory } from '@/types/requirements';

interface RequirementsFilters {
  searchQuery: string;
  showCompleted: boolean;
  showIncomplete: boolean;
  selectedSemester: string;
  courseType: string;
}

interface RequirementsCategoryListProps {
  sections: VisualRequirementCategory[];
  completedCourses: Set<string>;
  plannedCourses?: Set<string>;
  filters: RequirementsFilters;
  onToggleCourse: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

export const RequirementsCategoryList: React.FC<RequirementsCategoryListProps> = ({
  sections,
  completedCourses,
  plannedCourses = new Set(),
  filters,
  onToggleCourse,
  footnotes = []
}) => {
  const filterCourses = (section: VisualRequirementCategory) => {
    if (!filters.searchQuery && 
        filters.showCompleted && 
        filters.showIncomplete && 
        filters.selectedSemester === 'all' && 
        filters.courseType === 'all') {
      return section.courses;
    }
    
    return section.courses.filter(course => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          course.code.toLowerCase().includes(query) ||
          course.title.toLowerCase().includes(query) ||
          (course.description && course.description.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }
      
      // Completion filter
      const isCompleted = completedCourses.has(course.code);
      if (!filters.showCompleted && isCompleted) return false;
      if (!filters.showIncomplete && !isCompleted) return false;
      
      // Course type filter
      if (filters.courseType !== 'all' && course.type !== filters.courseType) {
        return false;
      }
      
      return true;
    });
  };

  const filteredSections = sections.map(section => ({
    ...section,
    courses: filterCourses(section)
  })).filter(section => section.courses.length > 0);

  return (
    <div className="space-y-6">
      {filteredSections.map((section, index) => (
        <motion.div
          key={`${section.id}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <RequirementsCategory
            section={section}
            completedCourses={completedCourses}
            plannedCourses={plannedCourses}
            onToggleCourse={onToggleCourse}
            footnotes={footnotes}
          />
        </motion.div>
      ))}
      
      {filteredSections.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-lg text-muted-foreground mb-2">No requirements match your current filters</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
        </motion.div>
      )}
    </div>
  );
};