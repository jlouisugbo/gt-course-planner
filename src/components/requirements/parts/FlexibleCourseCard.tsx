"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { FlexibleCourse } from "@/types/requirements";

interface FlexibleCourseCardProps {
    course: FlexibleCourse;
    programType: 'degree' | 'minor';
}

export const FlexibleCourseCard: React.FC<FlexibleCourseCardProps> = ({
    course
}) => {
    return (
        <Card className="border-amber-200 bg-amber-50 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                        <div>
                            <CardTitle className="text-lg text-amber-800">
                                {course.title}
                            </CardTitle>
                            <p className="text-sm text-amber-700 mt-1">
                                Flexible requirement - choose from eligible courses
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge className="bg-amber-100 text-amber-800 border-0">
                            Flexible
                        </Badge>
                        {course.footnoteRefs && course.footnoteRefs.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {course.footnoteRefs.join(',')}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0">
                <div className="bg-white/80 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="font-mono text-amber-700 font-semibold">
                                {course.code}
                            </span>
                            <span className="text-slate-700">
                                Choose from approved courses in this category
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-amber-200">
                        <div className="text-sm text-amber-700">
                            Consult your academic advisor for eligible course options
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};