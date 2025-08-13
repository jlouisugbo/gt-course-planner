"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Trash2
} from "lucide-react";
import { useUserAwarePlannerStore } from "@/hooks/useUserAwarePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable, useDraggable } from '@dnd-kit/core';
// import { DragTypes } from '@/types'; // Currently unused
import { cn } from '@/lib/utils';
import { CriticalErrorBoundary } from "@/components/error/GlobalErrorBoundary";

// Draggable Course Card Component
const DraggableCourseCard: React.FC<{
    course: any;
    semesterId: number;
    isCompleted: boolean;
    isCurrent: boolean;
    onRemove: (semesterId: number, courseId: number | string) => void;
}> = memo(({ course, semesterId, isCompleted, isCurrent, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: course.id || course.code,
        data: {
            course,
            semesterId,
        },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group"
            role="listitem"
        >
            <div 
                className={cn(
                    "p-3 rounded-lg border transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20",
                    "hover:shadow-sm cursor-move",
                    isDragging && "opacity-50",
                    isCompleted && "bg-green-50 border-green-200",
                    isCurrent && "bg-yellow-50 border-yellow-200",
                    !isCompleted && !isCurrent && "bg-white border-gray-200 hover:border-[#B3A369]/30"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${course.code} ${course.title}, ${course.credits} credits. Press Enter to interact.`}
                {...attributes}
                {...listeners}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <GripVertical 
                                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                                aria-hidden="true"
                            />
                            <span className="font-medium text-sm text-[#003057] break-words">
                                {course.code || 'Course Code'}
                            </span>
                            <Badge 
                                variant="secondary" 
                                className="text-xs flex-shrink-0"
                                aria-label={`${course.credits || 3} credit hours`}
                            >
                                {course.credits || 3}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                            {course.title || course.name || 'Course Title'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity min-h-[44px] min-w-[44px] p-0 text-red-500 hover:text-red-700 flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(semesterId, course.id || course.code);
                        }}
                        aria-label={`Remove ${course.code} from semester`}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
});

DraggableCourseCard.displayName = 'DraggableCourseCard';

export const PlannerGrid: React.FC = memo(() => {
    const plannerStore = useUserAwarePlannerStore();
    const { semesters, removeCourseFromSemester } = plannerStore;

    const safeSemesters = useMemo(() => {
        return semesters && typeof semesters === 'object' ? semesters : {};
    }, [semesters]);


    // Process semesters into sorted array
    const sortedSemesters = useMemo(() => {
        return Object.values(safeSemesters)
            .filter(semester => 
                semester && 
                typeof semester === 'object' &&
                typeof semester.year === 'number' &&
                typeof semester.season === 'string'
            )
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
                return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
            });
    }, [safeSemesters]);

    // Memoized remove course handler
    const handleRemoveCourse = useCallback(
        (semesterId: number, courseId: number | string) => {
            if (removeCourseFromSemester) {
                removeCourseFromSemester(semesterId, courseId);
            }
        },
        [removeCourseFromSemester]
    );

    // Modern semester card component - memoized for performance
    const ModernSemesterCard: React.FC<{ semester: any; index: number }> = memo(({ semester, index }) => {
        const { isOver, setNodeRef } = useDroppable({
            id: `semester-${semester.id}`,
        });

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
            >
                <Card 
                    ref={setNodeRef}
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
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <CardTitle 
                                    className={cn(
                                        "text-base sm:text-lg mb-1 break-words",
                                        isCurrent && "text-[#B3A369]",
                                        isCompleted && "text-green-700"
                                    )}
                                    id={`semester-title-${semester.id}`}
                                >
                                    {semester.season} {semester.year}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
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

                    <CardContent className="pt-0">
                        <div 
                            className="space-y-2 min-h-[200px]"
                            role="list"
                            aria-labelledby={`semester-title-${semester.id}`}
                        >
                            <AnimatePresence>
                                {courses.map((course: any, courseIndex: number) => (
                                    <DraggableCourseCard
                                        key={course.id || courseIndex}
                                        course={course}
                                        semesterId={semester.id}
                                        isCompleted={isCompleted}
                                        isCurrent={isCurrent}
                                        onRemove={handleRemoveCourse}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Drop zone when empty */}
                            {courses.length === 0 && (
                                <div 
                                    className={cn(
                                        "flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg transition-colors min-h-[120px]",
                                        isOver ? "border-[#B3A369] bg-[#B3A369]/5" : "border-gray-300"
                                    )}
                                    role="status"
                                    aria-live="polite"
                                    aria-label={isOver ? `Ready to drop course in ${semester.season} ${semester.year}` : `Empty semester: ${semester.season} ${semester.year}`}
                                >
                                    <Plus 
                                        className={cn(
                                            "h-8 w-8 mb-2 transition-colors",
                                            isOver ? "text-[#B3A369]" : "text-muted-foreground"
                                        )} 
                                        aria-hidden="true"
                                    />
                                    <p className={cn(
                                        "text-sm transition-colors text-center",
                                        isOver ? "text-[#B3A369]" : "text-muted-foreground"
                                    )}>
                                        {isOver ? 'Drop course here' : 'Drag courses here'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    });

    ModernSemesterCard.displayName = 'ModernSemesterCard';

    if (sortedSemesters.length === 0) {
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
            <div className="space-y-6">
                {/* Semester Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedSemesters.map((semester, index) => (
                        <ModernSemesterCard
                            key={semester.id || `${semester.season}-${semester.year}`}
                            semester={semester}
                            index={index}
                        />
                    ))}
                </div>

            {/* Add Semester Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sortedSemesters.length * 0.1 }}
                className="flex justify-center"
            >
                <Button
                    variant="outline"
                    className="border-dashed border-2 border-[#B3A369] text-[#B3A369] hover:bg-[#B3A369]/5 min-h-[120px] w-full max-w-sm flex flex-col items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500/20"
                    aria-label="Add new semester for course planning"
                >
                    <Plus className="h-8 w-8" aria-hidden="true" />
                    <span className="font-medium">Add New Semester</span>
                    <span className="text-xs text-muted-foreground">Plan your next semester</span>
                </Button>
            </motion.div>
            </div>
        </CriticalErrorBoundary>
    );
});

PlannerGrid.displayName = 'PlannerGrid';