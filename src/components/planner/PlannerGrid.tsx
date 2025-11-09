"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Trash2,
  Info,
  BookOpen,
} from "lucide-react";
import { useSemesters } from "@/hooks/useSemesters";
import { useAddCourse, useRemoveCourse } from "@/hooks/useSemesterMutations";
import { usePlannerUIStore } from "@/hooks/usePlannerUIStore";
import { useDrag, useDrop } from 'react-dnd';
import { attachConnectorRef } from '@/components/dnd/dnd-compat';
import { DragTypes } from '@/types';
import { cn } from '@/lib/utils';
import { CriticalErrorBoundary } from "@/components/error/GlobalErrorBoundary";

// Course Info Modal Component
const CourseInfoModal = memo<{ course: any }>(function CourseInfoModal({ course }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {course.code} - {course.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="font-semibold mb-1.5">Course Details</h4>
              <div className="space-y-1.5 text-sm">
                <p><strong>Credits:</strong> {course.credits || 3}</p>
                <p><strong>College:</strong> {course.college || 'N/A'}</p>
                <p><strong>Type:</strong> {course.course_type || 'N/A'}</p>
                {course.prerequisites && (
                  <p><strong>Prerequisites:</strong> {course.prerequisites}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Offering Info</h4>
              <div className="space-y-1 text-sm">
                {course.semester_offered && (
                  <p><strong>Offered:</strong> {course.semester_offered}</p>
                )}
                {course.typical_enrollment && (
                  <p><strong>Typical Enrollment:</strong> {course.typical_enrollment}</p>
                )}
              </div>
            </div>
          </div>
          {course.description && (
            <div>
              <h4 className="font-semibold mb-1">Description</h4>
              <p className="text-sm text-gray-600">{course.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Compact Draggable Course Card Component
const DraggableCourseCard: React.FC<{
    course: any;
    semesterId: number;
    isCompleted: boolean;
    isCurrent: boolean;
    onRemove: (semesterId: number, courseId: number) => void;
}> = memo(({ course, semesterId, isCompleted, isCurrent, onRemove }) => {
    const { setDraggedCourse } = usePlannerUIStore();

    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: DragTypes.PLANNED_COURSE,
        item: {
            type: DragTypes.PLANNED_COURSE,
            id: course.id || course.code,
            course,
            semesterId
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: () => {
            setDraggedCourse(null);
        }
    }), [course, semesterId]);

    return (
        <div
            ref={attachConnectorRef<HTMLDivElement>(dragRef as any)}
            className={cn(
                "group cursor-move transition-opacity duration-150",
                isDragging && "opacity-50"
            )}
        >
            <div
                className={cn(
                    "p-1.5 rounded border transition-all duration-200 hover:shadow-sm",
                    isDragging && "opacity-50",
                    isCompleted && "bg-green-50 border-green-200",
                    isCurrent && "bg-yellow-50 border-yellow-200",
                    !isCompleted && !isCurrent && "bg-white border-gray-200 hover:border-[#B3A369]/30"
                )}
            >
                <div className="space-y-0">
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="font-medium text-xs text-[#003057] truncate">
                                {course.code}
                            </span>
                            <Badge variant="secondary" className="text-xs h-4 px-1.5">
                                {course.credits || 3}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <CourseInfoModal course={course} />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof course.id === 'number') {
                                      onRemove(semesterId, course.id);
                                    }
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 pl-4">
                        {course.title || course.name || 'Course Title'}
                    </p>
                </div>
            </div>
        </div>
    );
});

DraggableCourseCard.displayName = 'DraggableCourseCard';

interface PlannerGridProps {
    semesters?: Record<string, any>;
    userProfile?: any;
    isLoading?: boolean;
    isInitialized?: boolean;
}

export const PlannerGrid: React.FC<PlannerGridProps> = memo(({
    semesters: propSemesters,
    userProfile,
    isLoading: propIsLoading,
    isInitialized
}) => {
    // Fetch semesters from API if not provided via props
    const { data: apiSemesters, isLoading: isLoadingSemesters } = useSemesters();
    const addCourseMutation = useAddCourse();
    const removeCourseMutation = useRemoveCourse();

    // Use prop semesters if provided, otherwise use API data
    const semesters = propSemesters || apiSemesters || {};
    const isLoading = propIsLoading !== undefined ? propIsLoading : isLoadingSemesters;

    const safeSemesters = useMemo(() => {
        return semesters && typeof semesters === 'object' ? semesters : {};
    }, [semesters]);

    // Group semesters by academic year (Fall 20XX, Spring 20XX+1, Summer 20XX+1)
    const academicYears = useMemo(() => {
        const semestersArray = Object.values(safeSemesters)
            .filter(semester =>
                semester &&
                typeof semester === 'object' &&
                typeof semester.year === 'number' &&
                typeof semester.season === 'string'
            );

        const yearGroups: Record<number, any[]> = {};

        semestersArray.forEach(semester => {
            const academicYear = semester.season === 'Fall' ? semester.year : semester.year - 1;
            if (!yearGroups[academicYear]) {
                yearGroups[academicYear] = [];
            }
            yearGroups[academicYear].push(semester);
        });

        // Sort each year's semesters: Fall, Spring, Summer
        Object.keys(yearGroups).forEach(year => {
            yearGroups[parseInt(year)].sort((a, b) => {
                const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
                return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
            });
        });

        return Object.keys(yearGroups)
            .map(year => parseInt(year))
            .sort((a, b) => a - b)
            .map(year => ({
                academicYear: year,
                semesters: yearGroups[year]
            }));
    }, [safeSemesters]);

    // Memoized remove course handler using mutation
    const handleRemoveCourse = useCallback(
        (semesterId: number, courseId: number) => {
            removeCourseMutation.mutate({ semesterId, courseId });
        },
        [removeCourseMutation]
    );

    // Modern semester card component - memoized to prevent re-renders during drag
    const ModernSemesterCard: React.FC<{ semester: any }> = memo(({ semester }) => {
        const [{ isOver }, dropRef] = useDrop(() => ({
            accept: [DragTypes.COURSE, DragTypes.PLANNED_COURSE],
            drop: (item: any) => {
                // Handle course drop using mutation
                if (item.course) {
                    const courseToAdd = {
                        ...item.course,
                        semesterId: semester.id,
                        status: 'planned' as const
                    };

                    // Add to new semester
                    addCourseMutation.mutate({
                        semesterId: semester.id,
                        course: courseToAdd
                    });

                    // If moving from another semester, remove from old location
                    if (item.semesterId && item.semesterId !== semester.id) {
                        removeCourseMutation.mutate({
                            semesterId: item.semesterId,
                            courseId: item.course.id
                        });
                    }
                }
            },
            collect: (monitor) => ({
                isOver: monitor.isOver(),
            }),
        }), [semester.id, addCourseMutation, removeCourseMutation]);

        // Memoize semester calculations
        const semesterData = useMemo(() => {
            const totalCredits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
            const courses = Array.isArray(semester.courses) ? semester.courses : [];
            return {
                totalCredits,
                courses,
                isOverloaded: totalCredits > 18,
                isLight: totalCredits < 12,
                isCompleted: Boolean(semester.isCompleted),
                isCurrent: Boolean(semester.isActive)
            };
        }, [semester]);

        const { totalCredits, courses, isOverloaded, isLight, isCompleted, isCurrent } = semesterData;

        return (
            <div className="h-full">
                <Card 
                    ref={attachConnectorRef<HTMLDivElement>(dropRef as any)}
                    className={cn(
                        "h-full transition-all duration-200 relative focus-within:ring-2 focus-within:ring-blue-500/20",
                        isOver && "ring-2 ring-[#B3A369] ring-opacity-50",
                        isCurrent && "border-[#B3A369] shadow-lg",
                        isCompleted && "border-green-300 bg-green-50/30"
                    )}
                    role="region"
                    aria-label={`${semester.season} ${semester.year} semester with ${courses.length} courses, ${totalCredits} credits${isCurrent ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            // Focus on first course or add course button
                            const firstInteractable = e.currentTarget.querySelector('button, [tabindex="0"]') as HTMLElement;
                            firstInteractable?.focus();
                        }
                    }}
                >
                    <CardHeader className="pb-1.5 pt-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <CardTitle
                                    className={cn(
                                        "text-base sm:text-lg mb-1 break-words truncate",
                                        isCurrent && "text-[#B3A369]",
                                        isCompleted && "text-green-700"
                                    )}
                                    id={`semester-title-${semester.id}`}
                                >
                                    {semester.season} {semester.year}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-1">
                                    {isCurrent && (
                                        <Badge className="bg-[#B3A369] text-white text-xs">
                                            Current
                                        </Badge>
                                    )}
                                    {isCompleted && (
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                            Complete
                                        </Badge>
                                    )}
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs",
                                            isOverloaded && "border-red-300 text-red-700",
                                            isLight && "border-yellow-300 text-yellow-700"
                                        )}
                                        role="status"
                                        aria-label={`${totalCredits} credits ${isOverloaded ? '(overloaded)' : isLight ? '(light load)' : ''}`}
                                    >
                                        {totalCredits} credits
                                    </Badge>
                                </div>
                            </div>
                            {isOverloaded && (
                                <AlertTriangle
                                    className="h-4 w-4 text-orange-500 flex-shrink-0"
                                    aria-label="Credit overload warning"
                                    role="img"
                                />
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0 pb-2.5">
                        <div
                            className="space-y-0.5 min-h-[160px]"
                            role="list"
                            aria-labelledby={`semester-title-${semester.id}`}
                        >
                            {courses.map((course: any, courseIndex: number) => (
                                <DraggableCourseCard
                                    key={`${course.code}-${semester.id}` || courseIndex}
                                    course={course}
                                    semesterId={semester.id}
                                    isCompleted={isCompleted}
                                    isCurrent={isCurrent}
                                    onRemove={handleRemoveCourse}
                                />
                            ))}

                            {/* Drop zone when empty */}
                            {courses.length === 0 && (
                                <div
                                    className={cn(
                                        "flex flex-col items-center justify-center py-3 border-2 border-dashed rounded-lg transition-colors min-h-[80px]",
                                        isOver ? "border-[#B3A369] bg-[#B3A369]/5" : "border-gray-300"
                                    )}
                                >
                                    <Plus
                                        className={cn(
                                            "h-5 w-5 mb-0 transition-colors",
                                            isOver ? "text-[#B3A369]" : "text-muted-foreground"
                                        )}
                                    />
                                    <p className={cn(
                                        "text-xs transition-colors text-center",
                                        isOver ? "text-[#B3A369]" : "text-muted-foreground"
                                    )}>
                                        {isOver ? 'Drop course here' : 'Drag courses here'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    });

    ModernSemesterCard.displayName = 'ModernSemesterCard';

    // Show loading state
    if (isLoading || !isInitialized) {
        return (
            <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">Loading Your Academic Plan</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        Setting up your personalized course schedule...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (academicYears.length === 0) {
        return (
            <Card className="h-full">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Semesters Planned</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        Set up your academic profile to generate your semester plan
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <CriticalErrorBoundary>
            <div className="space-y-5">
                {/* Academic Year Layout - Fall/Spring/Summer in rows */}
                <div className="space-y-5">
                    {academicYears.map((yearGroup) => (
                        <div key={yearGroup.academicYear} className="space-y-2">
                            <h3 className="text-lg font-semibold text-gt-navy border-b pb-0.5">
                                Academic Year {yearGroup.academicYear}-{yearGroup.academicYear + 1}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                {yearGroup.semesters.map((semester) => (
                                    <ModernSemesterCard
                                        key={semester.id || `${semester.season}-${semester.year}`}
                                        semester={semester}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            {/* Add Semester Button */}
            <div className="flex justify-center">
                <Button
                    variant="outline"
                    className="border-dashed border-2 border-[#B3A369] text-[#B3A369] hover:bg-[#B3A369]/5 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] w-full max-w-sm flex flex-col items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Add new semester for course planning"
                >
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                    <span className="text-sm sm:text-base font-medium">Add New Semester</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Plan your next semester</span>
                </Button>
            </div>
            </div>
        </CriticalErrorBoundary>
    );
});

PlannerGrid.displayName = 'PlannerGrid';
