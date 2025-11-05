"use client";

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Search, X, BookOpen, Filter } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '@/types';
import { cn } from '@/lib/utils';
import { PlannedCourse } from '@/types';
import { isDemoMode } from '@/lib/demo-mode';
import { getDemoAvailableCourses } from '@/lib/demo-data';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';

interface DraggableSidebarCourseProps {
  course: PlannedCourse;
}

/**
 * Individual draggable course card in the sidebar
 */
const DraggableSidebarCourse: React.FC<DraggableSidebarCourseProps> = memo(({ course }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DragTypes.COURSE,
    item: {
      type: DragTypes.COURSE,
      id: course.id || course.code,
      course,
      semesterId: 0 // Not placed yet
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      className={cn(
        "group cursor-move transition-all duration-200",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg border bg-white hover:shadow-md transition-all",
          isDragging ? "border-[#B3A369] bg-[#B3A369]/5" : "border-gray-200 hover:border-[#B3A369]/50"
        )}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              <span className="font-semibold text-sm text-[#003057] truncate">
                {course.code}
              </span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5 flex-shrink-0">
                {course.credits || 3}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
            {course.title || 'Course Title'}
          </p>
          {course.college && (
            <p className="text-xs text-muted-foreground/80 pl-6 truncate">
              {typeof course.college === 'string' ? course.college.replace('College of ', '') : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

DraggableSidebarCourse.displayName = 'DraggableSidebarCourse';

interface CourseSidebarProps {
  courses?: PlannedCourse[];
}

/**
 * Sidebar showing available courses that can be dragged to semesters
 * In demo mode, shows DEMO_AVAILABLE_COURSES
 */
export const CourseSidebar: React.FC<CourseSidebarProps> = memo(({ courses: propCourses }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const plannerStore = useUserAwarePlannerStore();

  // Use demo courses if in demo mode, otherwise use prop courses
  const availableCourses = isDemoMode() ? getDemoAvailableCourses() : (propCourses || []);

  // Get all courses currently in semesters
  const semesterCourses = React.useMemo(() => {
    const courseCodes = new Set<string>();
    if (plannerStore.semesters) {
      Object.values(plannerStore.semesters).forEach((semester: any) => {
        if (semester?.courses && Array.isArray(semester.courses)) {
          semester.courses.forEach((course: any) => {
            courseCodes.add(course.code);
          });
        }
      });
    }
    return courseCodes;
  }, [plannerStore.semesters]);

  // Filter courses based on search query AND exclude courses already in semesters
  const filteredCourses = availableCourses.filter(course => {
    // Don't show courses that are already in a semester
    if (semesterCourses.has(course.code)) {
      return false;
    }

    const matchesSearch = searchQuery === '' ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.title && course.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' ||
      (course.college && typeof course.college === 'string' &&
       course.college.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['All', ...new Set(
    availableCourses
      .map(c => c.college)
      .filter((c): c is string => typeof c === 'string')
      .map(c => c.replace('College of ', ''))
  )];

  // Drop zone for returning courses to sidebar
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: [DragTypes.PLANNED_COURSE],
    drop: (item: any) => {
      // Remove course from semester when dropped back to sidebar
      if (item.semesterId && item.semesterId !== 0) {
        plannerStore.removeCourseFromSemester(item.semesterId, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [plannerStore]);

  return (
    <Card ref={dropRef} className={cn(
      "h-full sticky top-4 transition-all",
      isOver && "ring-2 ring-[#B3A369] ring-opacity-50"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-[#003057]">
          <BookOpen className="h-5 w-5 text-[#B3A369]" />
          Available Courses
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Drag courses to your semesters
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-6 text-xs px-2",
                selectedCategory === category && "bg-[#003057] hover:bg-[#003057]/90"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Course List */}
        <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <DraggableSidebarCourse
                key={course.id || course.code}
                course={course}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No courses found' : 'No available courses'}
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs mt-1"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Course Count */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {filteredCourses.length} of {availableCourses.length} courses
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

CourseSidebar.displayName = 'CourseSidebar';
