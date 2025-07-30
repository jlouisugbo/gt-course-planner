"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, BookOpen, Clock, AlertCircle, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { VisualCourse, EnhancedCourse } from "@/types/requirements";
import { CourseModal } from "./CourseModal";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { getUnlockedCourses } from "@/lib/prereqUtils";

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
    const { semesters } = usePlannerStore();
    const [enhancedCourse, setEnhancedCourse] = useState<EnhancedCourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // For flexible courses, don't fetch from database
                if (isFlexible) {
                    setEnhancedCourse({
                        ...course,
                        credits: 3, // fallback
                        description: 'Flexible requirement - choose from approved courses'
                    } as EnhancedCourse);
                    setLoading(false);
                    return;
                }

                // Query the course details from the database with college join
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select(`
                        code, title, credits, description, prerequisites, course_type, college_id,
                        colleges!college_id(name)
                    `)
                    .eq('code', course.code)
                    .single();

                if (courseError) {
                    // Don't log 400 errors as errors - just handle gracefully
                    if (courseError.code !== 'PGRST116') {
                        console.warn(`Course ${course.code} not found in database:`, courseError.message);
                    }
                    
                    // Create a fallback course with the basic information we have
                    setEnhancedCourse({
                        ...course,
                        title: course.title || `${course.code} (Course details unavailable)`,
                        credits: 3, // fallback
                        description: `Course ${course.code} - Details not available in course catalog`,
                        prerequisites: '[]',
                        college: 'Unknown',
                        department: course.code.split(' ')[0] // Extract department from course code
                    } as EnhancedCourse);
                    setError(null); // Don't show as error to user
                } else {
                    // Merge course data with original course structure
                    setEnhancedCourse({
                        ...course,
                        title: courseData.title || course.title,
                        credits: courseData.credits || 3,
                        description: courseData.description || `${course.code} course description not available`,
                        prerequisites: JSON.stringify(courseData.prerequisites || []),
                        college: (courseData.colleges as any)?.name || 'Unknown College',
                        department: courseData.code?.split(' ')[0] || 'Unknown'
                    } as EnhancedCourse);
                }
            } catch (err) {
                console.error('Error in fetchCourseDetails:', err);
                setError('Failed to load course details');
                setEnhancedCourse({
                    ...course,
                    credits: 3, // fallback
                    description: 'Course details not available'
                } as EnhancedCourse);
            } finally {
                setLoading(false);
            }
        };

        if (course.code && course.code !== 'OR_GROUP' && course.code !== 'SELECT_GROUP') {
            fetchCourseDetails();
        } else {
            setLoading(false);
            setEnhancedCourse(course as EnhancedCourse);
        }
    }, [course, isFlexible]);

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

    const getBadgeColor = () => {
        if (isCompleted) return 'bg-green-100 text-green-800';
        if (isCourseActuallyPlanned) return 'bg-blue-100 text-blue-800';
        if (isFlexible) return 'bg-amber-100 text-amber-800';
        if (isOption) return 'bg-orange-100 text-orange-800';
        return programType === 'degree' 
            ? 'bg-slate-100 text-slate-800'
            : 'bg-yellow-100 text-yellow-800';
    };

    if (loading) {
        return (
            <Card className={`py-1 ${getCardTheme()} transition-all duration-200`}>
                <CardContent className="py-1">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                        <div>
                            <div className="font-medium text-xs text-slate-900">{course.code}</div>
                            <div className="text-xs text-slate-600">Loading...</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error && !enhancedCourse) {
        return (
            <Card className="py-1 border-red-200 bg-red-50">
                <CardContent className="py-1">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <div>
                            <div className="font-medium text-xs text-slate-900">{course.code}</div>
                            <div className="text-xs text-red-600">{error}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!enhancedCourse) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ 
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2, ease: "easeOut" }
                }}
                transition={{ duration: 0.3 }}
            >
                <Card 
                    className={cn(
                        `py-1 w-48 ${getCardTheme()} transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 hover:shadow-xl`,
                        isCompleted && "ring-2 ring-green-200"
                    )}
                    onClick={handleCardClick}
                >
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    
                    <CardContent className="py-1 relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {/* Enhanced Checkbox */}
                                {onToggleComplete && (
                                    <div 
                                        onClick={handleCheckboxToggle}
                                        className="group cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200",
                                            isCompleted 
                                                ? "bg-green-600 border-green-600 shadow-sm" 
                                                : "border-slate-300 hover:border-green-400 bg-white group-hover:bg-green-50"
                                        )}>
                                            {isCompleted && (
                                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-1 mb-0.5">
                                        {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />}
                                        {isCourseActuallyPlanned && !isCompleted && <Calendar className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                                        {isFlexible && <Sparkles className="h-3 w-3 text-amber-600 flex-shrink-0" />}
                                        
                                        <span className={cn(
                                            "font-bold text-xs cursor-pointer hover:text-blue-600 transition-colors truncate",
                                            isCompleted ? "text-green-700 line-through" : 
                                            isCourseActuallyPlanned ? "text-blue-700" :
                                            isFlexible ? "text-amber-800" : "text-slate-900"
                                        )}>
                                            {enhancedCourse.code}
                                        </span>
                                        
                                        <span className="text-xs text-slate-500">({enhancedCourse.credits || 3}cr)</span>
                                        
                                        {isOption && <Badge variant="outline" className="text-xs px-1 py-0 h-3 bg-orange-100 text-orange-700">Opt</Badge>}
                                        {isFlexible && <Badge variant="outline" className="text-xs px-1 py-0 h-3 bg-amber-100 text-amber-700">Flex</Badge>}
                                    </div>
                                    
                                    <h4 className={cn(
                                        "font-medium text-xs line-clamp-1 leading-tight",
                                        isCompleted ? "text-green-600 line-through" : 
                                        isCourseActuallyPlanned ? "text-blue-600" :
                                        isFlexible ? "text-amber-700" : "text-slate-700"
                                    )}>
                                        {enhancedCourse.title}
                                    </h4>
                                </div>
                            </div>
                            
                            <div className="ml-1 flex-shrink-0">
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    isCompleted ? "bg-green-500" :
                                    isCourseActuallyPlanned ? "bg-blue-500" :
                                    isFlexible ? "bg-amber-500" :
                                    "bg-slate-400"
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
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