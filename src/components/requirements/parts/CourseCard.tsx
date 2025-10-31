"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { VisualCourse, EnhancedCourse } from "@/types/requirements";
import { CourseModal } from "./CourseModal";

interface CourseCardProps {
    course: VisualCourse;
    programType: 'degree' | 'minor';
    isOption?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({ 
    course, 
    programType, 
    isOption = false 
}) => {
    const [enhancedCourse, setEnhancedCourse] = useState<EnhancedCourse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                setError(null);

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
                    console.error('Error fetching course:', courseError);
                    setError('Course not found');
                    setEnhancedCourse({
                        ...course,
                        credits: 3, // fallback
                        description: 'Course details not available'
                    });
                } else {
                    // Merge course data with original course structure
                    setEnhancedCourse({
                        ...course,
                        credits: courseData.credits,
                        description: courseData.description,
                        prerequisites: courseData.prerequisites,
                        college: (courseData.colleges as any)?.[0]?.name || 'Unknown College',
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
    }, [course]);

    const handleCardClick = () => {
        if (enhancedCourse && !loading) {
            setShowModal(true);
        }
    };

    const getCardTheme = () => {
        if (isOption) {
            return 'border-orange-200 bg-orange-50 hover:border-orange-300';
        }
        return programType === 'degree' 
            ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
            : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300';
    };

    const getBadgeColor = () => {
        if (isOption) return 'bg-orange-100 text-orange-800';
        return programType === 'degree' 
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800';
    };

    if (loading) {
        return (
            <Card className={`${getCardTheme()} transition-all py-2 duration-200`}>
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
                    className={`${getCardTheme()} py-2 transition-all duration-300 cursor-pointer group relative overflow-hidden border-2 hover:shadow-xl`}
                    onClick={handleCardClick}
                >
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    
                    <CardContent className="p-5 relative">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 font-bold text-lg text-slate-900 hover:bg-transparent group-hover:text-blue-600 transition-colors duration-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardClick();
                                        }}
                                    >
                                        {enhancedCourse.code}
                                    </Button>
                                    {isOption && (
                                        <Badge variant="outline" className="text-xs bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-200 font-medium">
                                            Option
                                        </Badge>
                                    )}
                                    {enhancedCourse.footnoteRefs.length > 0 && (
                                        <Badge variant="outline" className="text-xs bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200">
                                            Note {enhancedCourse.footnoteRefs.map(ref => `${ref}`).join(',')}
                                        </Badge>
                                    )}
                                </div>
                                
                                <h4 className="font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-snug"
                                    title={enhancedCourse.title}
                                    style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        wordBreak: 'break-word'
                                    }}>
                                    {enhancedCourse.title}
                                </h4>
                                
                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                    <div className="flex items-center space-x-1.5 bg-slate-50 rounded-full px-3 py-1">
                                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                                        <span className="font-medium">{enhancedCourse.credits || 3} credits</span>
                                    </div>
                                    {enhancedCourse.department && (
                                        <div className="flex items-center space-x-1.5 bg-slate-50 rounded-full px-3 py-1">
                                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                                            <span className="font-medium">{enhancedCourse.department}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {enhancedCourse.description && (
                                    <p className="text-sm text-slate-600 leading-relaxed"
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            wordBreak: 'break-word'
                                        }}>
                                        {enhancedCourse.description}
                                    </p>
                                )}
                            </div>
                            
                            <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-2">
                                <Badge className={`${getBadgeColor()} shadow-sm font-semibold px-3 py-1.5 text-sm`}>
                                    {enhancedCourse.credits || 3}cr
                                </Badge>
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 group-hover:scale-125 transition-transform duration-300" />
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