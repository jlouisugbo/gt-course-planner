"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { Course } from '@/types/courses';
import { getRecommendedCourses } from '@/lib/prereqUtils';
import { motion } from 'framer-motion';

interface RecommendedCoursesProps {
    allCourses: Course[];
    completedCourses: Set<string>;
    plannedCourses: Set<string>;
    programCourses: Set<string>;
    onViewCourse: (course: Course) => void;
    onAddToPlan: (course: Course) => void;
}

export const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({
    allCourses,
    completedCourses,
    plannedCourses,
    programCourses,
    onViewCourse,
    onAddToPlan
}) => {
    const recommendedCourses = useMemo(() => {
        return getRecommendedCourses(
            allCourses,
            completedCourses,
            plannedCourses,
            programCourses
        );
    }, [allCourses, completedCourses, plannedCourses, programCourses]);

    if (recommendedCourses.length === 0) {
        return (
            <Card className="border-2 border-dashed border-slate-200">
                <CardContent className="p-6 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No Recommendations Yet</h3>
                    <p className="text-sm text-slate-500">
                        Complete some prerequisite courses to see personalized recommendations
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-25">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-lg">Recommended for You</span>
                        <p className="text-sm text-slate-600 font-normal">
                            Based on your completed courses and degree program
                        </p>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>{recommendedCourses.length} courses ready to take</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Prerequisites Met
                    </Badge>
                </div>

                <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {recommendedCourses.slice(0, 6).map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="bg-white border hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <h4 className="font-semibold text-slate-900 truncate">
                                                    {course.code}
                                                </h4>
                                                <Badge variant="secondary" className="text-xs">
                                                    {course.credits}cr
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                {course.title}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewCourse(course);
                                                    }}
                                                    className="text-xs px-2 py-1 h-7"
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddToPlan(course);
                                                    }}
                                                    className="text-xs px-2 py-1 h-7 bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Add to Plan
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {recommendedCourses.length > 6 && (
                    <div className="text-center pt-3 border-t">
                        <p className="text-sm text-slate-600">
                            +{recommendedCourses.length - 6} more courses available
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};