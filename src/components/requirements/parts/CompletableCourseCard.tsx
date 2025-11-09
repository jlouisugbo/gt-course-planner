"use client";

import React, { useState, useMemo } from "react";
// import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useCourseByCode } from "@/hooks/useCourses";
import { VisualCourse, EnhancedCourse } from "@/types/requirements";
import { CourseModal } from "./CourseModal";
import { cn } from "@/lib/utils";
import { useSemesters } from "@/hooks/useSemesters";

interface CompletableCourseCardProps {
    course: VisualCourse;
    programType: 'degree' | 'minor';
    isOption?: boolean;
    isCompleted?: boolean;
    isPlanned?: boolean;
    onToggleComplete?: (courseCode: string) => void;
}

export const CompletableCourseCard: React.FC<CompletableCourseCardProps> = ({
    course,
    programType,
    isOption = false,
    isCompleted = false,
    isPlanned = false,
    onToggleComplete
}) => {
    const { data: semesters } = useSemesters();
    const [showModal, setShowModal] = useState(false);

    const isFlexible = course.courseType === 'flexible';

    // Check if course is planned in any semester
    const plannedCourseInfo = React.useMemo(() => {
        if (!semesters || !course.code) return null;

        const allPlannedCourses = Object.values(semesters)
            .filter(semester => semester && Array.isArray(semester.courses))
            .flatMap(semester =>
                semester.courses.map(plannedCourse => ({
                    ...plannedCourse,
                    semesterInfo: semester
                }))
            );

        const plannedCourse = allPlannedCourses.find(planned => planned.code === course.code);
        return plannedCourse || null;
    }, [semesters, course.code]);

    const isCourseActuallyPlanned = isPlanned || !!plannedCourseInfo;

    // Determine if we should fetch course details
    const shouldFetch = !isFlexible && course.code && course.code !== 'OR_GROUP' && course.code !== 'SELECT_GROUP';

    // Use hook to fetch course details
    const {
        course: courseData,
        isLoading: loading,
        isError
    } = useCourseByCode(shouldFetch ? course.code : '');

    // Build enhanced course from hook data or fallback
    const enhancedCourse = useMemo<EnhancedCourse | null>(() => {
        // For flexible courses
        if (isFlexible) {
            return {
                ...course,
                credits: 3,
                description: 'Flexible requirement - choose from approved courses'
            } as EnhancedCourse;
        }

        // For non-real courses
        if (!shouldFetch) {
            return course as EnhancedCourse;
        }

        // If error or no data, create fallback
        if (isError || !courseData) {
            return {
                ...course,
                title: course.title || `${course.code} (Course details unavailable)`,
                credits: 3,
                description: `Course ${course.code} - Details not available in course catalog`,
                prerequisites: '[]',
                college: 'Unknown',
                department: course.code.split(' ')[0]
            } as EnhancedCourse;
        }

        // Merge course data with original course structure
        return {
            ...course,
            title: courseData.title || course.title,
            credits: courseData.credits || 3,
            description: courseData.description || `${course.code} course description not available`,
            prerequisites: JSON.stringify(courseData.prerequisites || []),
            college: (courseData as any).colleges?.name || 'Unknown College',
            department: courseData.code?.split(' ')[0] || 'Unknown'
        } as EnhancedCourse;
    }, [course, courseData, isError, isFlexible, shouldFetch]);

    const handleCardClick = () => {
        if (enhancedCourse && !loading) {
            setShowModal(true);
        }
    };

    const handleCheckboxToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleComplete) {
            onToggleComplete(course.code);
        }
    };

    const getCardTheme = () => {
        if (isCompleted) {
            return 'border-green-200 bg-green-50 hover:border-green-300';
        }
        if (isCourseActuallyPlanned) {
            return 'border-blue-300 bg-blue-50 hover:border-blue-400';
        }
        if (isFlexible) {
            return 'border-amber-200 bg-amber-50 hover:border-amber-300';
        }
        if (isOption) {
            return 'border-orange-200 bg-orange-50 hover:border-orange-300';
        }
        return programType === 'degree' 
            ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
            : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300';
    };


    if (loading) {
        return (
            <div className={`px-2 py-0.5 rounded border ${getCardTheme()} transition-all duration-200`}>
                <div className="flex items-center space-x-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-500" />
                    <span className="font-medium text-[11px] text-slate-900">{course.code}</span>
                </div>
            </div>
        );
    }


    if (!enhancedCourse) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ 
                    scale: 1.01,
                    transition: { duration: 0.15, ease: "easeOut" }
                }}
                transition={{ duration: 0.2 }}
            >
                <div
                    className={cn(
                        `glass-light px-2 py-0.5 rounded border ${getCardTheme()} transition-all duration-200 cursor-pointer group relative overflow-hidden hover:shadow-md hover:glass`,
                        isCompleted && "ring-2 ring-green-200"
                    )}
                    onClick={handleCardClick}
                >
                    <div className="flex items-center space-x-2">
                        {/* Accessible Checkbox */}
                        {onToggleComplete && (
                            <div
                                onClick={handleCheckboxToggle}
                                className="cursor-pointer p-1"
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all duration-150",
                                    isCompleted
                                        ? "bg-green-600 border-green-600"
                                        : "border-slate-400 hover:border-green-500 bg-white"
                                )}>
                                    {isCompleted && (
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Course Code and Credits */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                            {isCourseActuallyPlanned && !isCompleted && <Calendar className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}

                            <span className={cn(
                                "font-semibold text-xs",
                                isCompleted ? "text-green-700 line-through" :
                                isCourseActuallyPlanned ? "text-blue-700" :
                                isFlexible ? "text-amber-700" : "text-slate-900"
                            )}>
                                {enhancedCourse.code}
                            </span>

                            <span className="text-xs text-slate-500">({enhancedCourse.credits || 3})</span>

                            {isFlexible && <Badge className="text-[10px] px-1 h-4 bg-amber-100 text-amber-700 border-0">F</Badge>}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Course Detail Modal */}
            {showModal && enhancedCourse && (
                <CourseModal
                    course={enhancedCourse}
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    programType={programType}
                    isCompleted={isCompleted}
                    isPlanned={isCourseActuallyPlanned}
                    onToggleComplete={onToggleComplete}
                    onAddToPlanner={onToggleComplete} // For now, use the same function
                />
            )}
        </>
    );
};