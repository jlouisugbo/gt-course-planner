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
    onToggleComplete?: (courseCode: string) => void;
}

export const CompletableCourseCard: React.FC<CompletableCourseCardProps> = ({ 
    course, 
    programType, 
    isOption = false,
    isCompleted = false,
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
    
    const isPlanned = !!plannedCourseInfo;

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
                    });
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
                        description: course.description || `Course ${course.code} - Details not available in course catalog`,
                        prerequisites: [],
                        college: 'Unknown',
                        department: course.code.split(' ')[0] // Extract department from course code
                    });
                    setError(null); // Don't show as error to user
                } else {
                    // Merge course data with original course structure
                    setEnhancedCourse({
                        ...course,
                        title: courseData.title || course.title,
                        credits: courseData.credits || 3,
                        description: courseData.description || course.description || `${course.code} course description not available`,
                        prerequisites: courseData.prerequisites || [],
                        college: courseData.colleges?.name || 'Unknown College',
                        department: courseData.code?.split(' ')[0] || 'Unknown'
                    });
                }
            } catch (err) {
                console.error('Error in fetchCourseDetails:', err);
                setError('Failed to load course details');
                setEnhancedCourse({
                    ...course,
                    credits: 3, // fallback
                    description: 'Course details not available'
                });
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
        if (isPlanned) {
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
        if (isPlanned) return 'bg-blue-100 text-blue-800';
        if (isFlexible) return 'bg-amber-100 text-amber-800';
        if (isOption) return 'bg-orange-100 text-orange-800';
        return programType === 'degree' 
            ? 'bg-slate-100 text-slate-800'
            : 'bg-yellow-100 text-yellow-800';
    };

    if (loading) {
        return (
            <Card className={`${getCardTheme()} transition-all duration-200`}>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        <div>
                            <div className="font-medium text-slate-900">{course.code}</div>
                            <div className="text-sm text-slate-600">Loading course details...</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error && !enhancedCourse) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div>
                            <div className="font-medium text-slate-900">{course.code}</div>
                            <div className="text-sm text-red-600">{error}</div>
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
                        `${getCardTheme()} transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 hover:shadow-xl`,
                        isCompleted && "ring-2 ring-green-200"
                    )}
                    onClick={handleCardClick}
                >
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    
                    <CardContent className="p-2 relative">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                                {/* Checkbox */}
                                {onToggleComplete && (
                                    <div onClick={handleCheckboxToggle} className="mt-1">
                                        <Checkbox
                                            checked={isCompleted}
                                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                    </div>
                                )}
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-1 mb-1">
                                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                        {isPlanned && <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                        {isFlexible && <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0" />}
                                        
                                        <span className={cn(
                                            "font-bold text-sm cursor-pointer hover:text-blue-600 transition-colors",
                                            isCompleted ? "text-green-700 line-through" : 
                                            isPlanned ? "text-blue-700" :
                                            isFlexible ? "text-amber-800" : "text-slate-900"
                                        )}>
                                            {enhancedCourse.code}
                                        </span>
                                        
                                        {isPlanned && <span className="text-xs text-blue-600">📅</span>}
                                        {isOption && <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-orange-100 text-orange-700">Opt</Badge>}
                                        {isFlexible && <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-amber-100 text-amber-700">Flex</Badge>}
                                    </div>
                                    
                                    <h4 className={cn(
                                        "font-medium text-xs mb-1 line-clamp-1 leading-tight",
                                        isCompleted ? "text-green-700 line-through" : 
                                        isPlanned ? "text-blue-700" :
                                        isFlexible ? "text-amber-800" : "text-slate-900"
                                    )}>
                                        {enhancedCourse.title}
                                    </h4>
                                    
                                    <div className="flex items-center space-x-2 text-xs text-slate-600 mb-1">
                                        <span>{enhancedCourse.credits || 3}cr</span>
                                        {enhancedCourse.department && <span>• {enhancedCourse.department}</span>}
                                        {isCompleted && enhancedCourse.postrequisites && enhancedCourse.postrequisites.length > 0 && (
                                            <span className="text-green-600">• Unlocks courses</span>
                                        )}
                                    </div>
                                    
                                </div>
                            </div>
                            
                            <div className="ml-2 flex-shrink-0">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isCompleted ? "bg-green-500" :
                                    isPlanned ? "bg-blue-500" :
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
                />
            )}
        </>
    );
};