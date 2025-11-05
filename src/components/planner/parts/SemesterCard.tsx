// SemesterCard.tsx - With comprehensive safety checks
"use client";

import React, { useState } from "react";
import { useDrop } from "react-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle } from "lucide-react";
import { PlannedCourse, SemesterData, Course } from "@/types/courses";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import CourseManager from "@/components/courses/CourseManager";
import CourseDetailsModal from "./CourseDetailsModal";
import CourseCard from "./PlannerCourseCard";
import { DragItem, DropResult } from "@/types";

interface SemesterCardProps {
    semester?: SemesterData | null;
}

const SemesterCard: React.FC<SemesterCardProps> = ({ semester }) => {
    // Hooks must be called before any conditional returns
    const { removeCourseFromSemester, moveCourse, addCourseToSemester } = usePlannerStore();
    const [showCourseManager, setShowCourseManager] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<PlannedCourse | null>(null);
    
    const [{ isOver, canDrop }, drop] = useDrop<
        DragItem,
        DropResult,
        { isOver: boolean; canDrop: boolean }
    >({
        accept: ['COURSE', 'PLANNED_COURSE'],
        drop: (item): DropResult => {
            try {
                if (
                    item?.type === 'PLANNED_COURSE' &&
                    typeof item.id === 'number' &&
                    typeof item.semesterId === 'number' &&
                    item.semesterId !== (semester?.id || 0) &&
                    moveCourse
                ) {
                    moveCourse(item.id, item.semesterId, semester?.id || 0);
                } else if (
                    item?.type === 'COURSE' && 
                    item.course && 
                    typeof item.course === 'object' &&
                    addCourseToSemester
                ) {
                    addCourseToSemester({
                        ...item.course,
                        semesterId: semester?.id || 0,
                        status: 'planned',
                        year: semester?.year || new Date().getFullYear(),
                        season: semester?.season || 'Fall'
                    });
                }
            } catch (error) {
                console.error('Error handling drop:', error);
            }
            return { 
                targetSemesterId: semester?.id || 0,
                targetType: 'semester' as const
            };
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    });

    // Early return if no semester provided
    if (!semester) {
        return null;
    }

    // Safe property access with fallbacks
    const semesterId = typeof semester.id === 'number' ? semester.id : 0;
    const semesterSeason = semester.season || 'Unknown';
    const semesterYear = typeof semester.year === 'number' ? semester.year : new Date().getFullYear();
    const semesterCourses = Array.isArray(semester.courses) ? semester.courses : [];
    const semesterTotalCredits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
    const semesterMaxCredits = typeof semester.maxCredits === 'number' ? semester.maxCredits : 18;
    const semesterIsActive = Boolean(semester.isActive);

    // Additional validation
    if (typeof semester !== 'object') {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                    <div className="flex items-center text-red-600">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Invalid semester data</span>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const isOverloaded = semesterTotalCredits > semesterMaxCredits;
    const isLight = semesterTotalCredits < 12 && semesterCourses.length > 0;
    const isDragOver = isOver && canDrop;

    
    // Handle course details modal - need to convert PlannedCourse to Course format
    const handleViewDetails = (plannedCourse: PlannedCourse) => {
        if (plannedCourse && typeof plannedCourse === 'object') {
            setSelectedCourse(plannedCourse);
        }
    };

    // Safe course removal
    const handleRemoveCourse = (courseId: number) => {
        if (removeCourseFromSemester && typeof courseId === 'number' && typeof semesterId === 'number') {
            removeCourseFromSemester(courseId, semesterId);
        }
    };

    const selectedCourseForModal = selectedCourse
        ? ({
              id: selectedCourse.id || 0,
              code: selectedCourse.code || 'Unknown',
              title: selectedCourse.title || 'No title',
              credits: typeof selectedCourse.credits === 'number' ? selectedCourse.credits : 0,
              description: selectedCourse.description || "No description available",
              difficulty: typeof selectedCourse.difficulty === 'number' ? selectedCourse.difficulty : 3,
              college: selectedCourse.college || "Unknown College",
              prerequisites: Array.isArray(selectedCourse.prerequisites) ? selectedCourse.prerequisites : [],
              offerings: selectedCourse.offerings || { fall: true, spring: true, summer: false },
              course_type: (selectedCourse as any).course_type || (selectedCourse as any).type || 'elective',
              department: typeof selectedCourse.code === 'string' ? (selectedCourse.code.split(' ')[0] || 'GEN') : 'GEN',
          } as Course)
        : null;

    return (
        <>
            <Card
                ref={drop as any}
                className={cn(
                    "semester-column transition-all duration-200 h-full border-slate-300",
                    semesterIsActive && "ring-2 ring-[#B3A369]",
                    isDragOver && "ring-2 ring-[#B3A369] bg-[#B3A369]/5",
                    isOverloaded && "border-red-400",
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900">
                            {semesterSeason} {semesterYear}
                        </CardTitle>
                        {semesterIsActive && (
                            <Badge className="text-xs" variant="secondary">
                                Current
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span
                            className={cn(
                                "font-semibold text-xs",
                                isOverloaded
                                    ? "text-red-600"
                                    : isLight
                                      ? "text-amber-600"
                                      : "text-slate-600",
                            )}
                        >
                            {semesterTotalCredits} / {semesterMaxCredits} Credits
                        </span>

                        {isOverloaded && (
                            <div className="flex items-center space-x-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-xs">Overloaded</span>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 min-h-[350px]">
                    <AnimatePresence>
                        {semesterCourses.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                                    isDragOver
                                        ? "border-[#B3A369] bg-[#B3A369]/5 text-[#B3A369]"
                                        : "border-slate-300",
                                )}
                                onClick={() => setShowCourseManager(true)}
                            >
                                <Plus className="h-8 w-8 mb-2" />
                                <p className="text-sm font-medium">
                                    Drop courses here
                                </p>
                                <p className="text-xs">or click to add</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-2">
                                {semesterCourses
                                    .filter(course => course && typeof course === 'object')
                                    .map((course, index) => (
                                    <motion.div
                                        key={course?.id || `course-${index}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        layout
                                    >
                                        <CourseCard
                                            course={course}
                                            onRemove={() => handleRemoveCourse(course.id)}
                                            onViewDetails={() => handleViewDetails(course)}
                                            compact={true}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {semesterCourses.length > 0 && (
                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-slate-300 h-10 hover:border-[#B3A369] hover:bg-[#B3A369]/5 text-slate-600 text-sm"
                            onClick={() => setShowCourseManager(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Course
                        </Button>
                    )}
                </CardContent>
            </Card>

            {showCourseManager && (
                <CourseManager
                    semesterId={semesterId}
                    onClose={() => setShowCourseManager(false)}
                />
            )}

            {selectedCourseForModal && (
                <CourseDetailsModal
                    course={selectedCourseForModal}
                    isOpen={!!selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    onAddCourse={() => {
                        setSelectedCourse(null);
                    }}
                />
            )}
        </>
    );
};

export default SemesterCard;