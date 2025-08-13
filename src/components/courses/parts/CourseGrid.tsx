import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseCard } from './CourseCard';
import { Course } from '@/types';
import { CourseGridSkeleton } from '@/components/ui/loading';
import { useNavigationShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CourseGridProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  selectedIndex?: number;
  onSelectionChange?: (index: number) => void;
  enableKeyboardNavigation?: boolean;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  onCourseClick,
  isLoading = false,
  emptyMessage = "No courses found.",
  selectedIndex = -1,
  onSelectionChange,
  enableKeyboardNavigation = false
}) => {
  // Keyboard navigation
  const handleMoveUp = () => {
    if (!onSelectionChange || courses.length === 0) return;
    const colsPerRow = 3; // lg:grid-cols-3
    const newIndex = Math.max(0, selectedIndex - colsPerRow);
    onSelectionChange(newIndex);
  };

  const handleMoveDown = () => {
    if (!onSelectionChange || courses.length === 0) return;
    const colsPerRow = 3;
    const newIndex = Math.min(courses.length - 1, selectedIndex + colsPerRow);
    onSelectionChange(newIndex);
  };

  const handleMoveLeft = () => {
    if (!onSelectionChange || courses.length === 0) return;
    const newIndex = Math.max(0, selectedIndex - 1);
    onSelectionChange(newIndex);
  };

  const handleMoveRight = () => {
    if (!onSelectionChange || courses.length === 0) return;
    const newIndex = Math.min(courses.length - 1, selectedIndex + 1);
    onSelectionChange(newIndex);
  };

  const handleSelect = () => {
    if (selectedIndex >= 0 && selectedIndex < courses.length) {
      onCourseClick(courses[selectedIndex]);
    }
  };

  useNavigationShortcuts({
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    onMoveLeft: handleMoveLeft,
    onMoveRight: handleMoveRight,
    onSelect: handleSelect,
    disabled: !enableKeyboardNavigation
  });

  if (isLoading) {
    return <CourseGridSkeleton count={6} />;
  }

  if (courses.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-muted-foreground text-lg">{emptyMessage}</div>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search criteria or filters.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                delay: Math.min(index * 0.05, 0.3), 
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: -20,
              transition: { duration: 0.2 }
            }}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
            className={`${
              selectedIndex === index 
                ? 'ring-2 ring-gt-gold ring-offset-2 ring-offset-white'
                : ''
            } focus-within:ring-2 focus-within:ring-gt-navy focus-within:ring-offset-2`}
            tabIndex={enableKeyboardNavigation ? 0 : -1}
          >
            <CourseCard
              course={course}
              onClick={() => {
                onSelectionChange?.(index);
                onCourseClick(course);
              }}
              index={index}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};