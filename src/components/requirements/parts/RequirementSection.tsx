"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Target } from "lucide-react";
import { VisualDegreeProgram, VisualMinorProgram } from "@/types/requirements";
import { RequirementCategory } from "./RequirementCategory";
import { cn } from "@/lib/utils";

interface RequirementSectionProps {
    program: VisualDegreeProgram | VisualMinorProgram;
    type: 'degree' | 'minor';
    completedCourses?: Set<string>;
    plannedCourses?: Set<string>;
    completedGroups?: Set<string>;
    onCourseToggle?: (courseCode: string) => void;
    onGroupCompletion?: (groupId: string, isSatisfied: boolean) => void;
}

export const RequirementSection: React.FC<RequirementSectionProps> = ({ program, type, completedCourses, plannedCourses, completedGroups, onCourseToggle, onGroupCompletion }) => {
    // Calculate actual progress based on completed courses
    const calculateProgress = (category: any): number => {
        if (!completedCourses || !category.courses || category.courses.length === 0) {
            return 0;
        }
        
        let totalRequired = 0;
        let totalCompleted = 0;
        
        category.courses.forEach((course: any) => {
            if (course.courseType === 'regular' || course.courseType === 'flexible') {
                totalRequired += 1;
                if (completedCourses.has(course.code)) {
                    totalCompleted += 1;
                }
            } else if (course.courseType === 'or_group') {
                totalRequired += 1;
                if (course.groupCourses?.some((subCourse: any) => completedCourses.has(subCourse.code))) {
                    totalCompleted += 1;
                }
            } else if (course.courseType === 'and_group') {
                const requiredCount = course.groupCourses?.length || 0;
                const completedCount = course.groupCourses?.filter((subCourse: any) => 
                    completedCourses.has(subCourse.code)
                ).length || 0;
                totalRequired += requiredCount;
                totalCompleted += completedCount;
            } else if (course.courseType === 'selection') {
                const requiredCount = course.selectionCount || 1;
                const completedCount = Math.min(
                    course.selectionOptions?.filter((option: any) => completedCourses.has(option.code)).length || 0,
                    requiredCount
                );
                totalRequired += requiredCount;
                totalCompleted += completedCount;
            }
        });
        
        return totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;
    };

    const totalCategories = program.requirements.length;
    const completedCategories = program.requirements.filter(category => calculateProgress(category) >= 100).length;
    const overallProgress = totalCategories > 0 ? (completedCategories / totalCategories) * 100 : 0;

    return (
        <div className="space-y-1">
            {/* Compact Program Header */}
            <Card className={`bg-gradient-to-br ${
                type === 'degree' 
                    ? 'from-blue-50/50 to-slate-50/50 border-blue-200' 
                    : 'from-yellow-50/50 to-slate-50/50 border-yellow-200'
            } shadow-sm border`}>
                <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                type === 'degree' 
                                    ? 'bg-gradient-to-br from-[#003057] to-[#004080]' 
                                    : 'bg-gradient-to-br from-[#B3A369] to-[#D4C284]'
                            }`}>
                                <Target className="h-2.5 w-2.5 text-white" />
                            </div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold text-slate-900">
                                    {program.name}
                                </h3>
                                <p className="text-xs text-slate-600">
                                    {completedCategories}/{totalCategories} sections
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress 
                                value={overallProgress} 
                                className={`h-1 w-20 ${type === 'degree' ? 'bg-blue-100' : 'bg-yellow-100'} rounded-full`}
                            />
                            <div className={`text-sm font-bold ${
                                overallProgress >= 100 ? 'text-green-600' :
                                overallProgress >= 75 ? 'text-blue-600' :
                                overallProgress >= 50 ? 'text-yellow-600' : 'text-slate-600'
                            }`}>
                                {Math.round(overallProgress)}%
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Area with Vertical Requirements and Footnotes */}
            <div className="flex gap-2">
                {/* Vertical Requirements Container */}
                <div className="flex-1">
                    <div className="space-y-1">
                        {program.requirements.map((category, index) => {
                            const progress = calculateProgress(category);
                            const isComplete = progress >= 100;
                            
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    className="w-full"
                                >
                                    <Card className={`transition-all duration-200 hover:shadow-sm border w-full ${
                                        isComplete 
                                            ? 'bg-green-50/30 border-green-300' 
                                            : 'bg-white border-slate-200 hover:border-blue-300'
                                    }`}>
                                        <CardHeader className="p-1.5 pb-0.5">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-1.5">
                                                    <div className={`w-3 h-3 rounded flex items-center justify-center ${
                                                        isComplete 
                                                            ? 'bg-green-500' 
                                                            : 'bg-slate-300'
                                                    }`}>
                                                        {isComplete ? (
                                                            <CheckCircle className="h-2 w-2 text-white" />
                                                        ) : (
                                                            <Circle className="h-2 w-2 text-slate-600" />
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-semibold",
                                                        isComplete ? "text-green-700" : "text-slate-900"
                                                    )}>{category.name}</span>
                                                    <Badge 
                                                        variant={isComplete ? "default" : "outline"} 
                                                        className={`text-[10px] h-3.5 px-1 ${
                                                            isComplete 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {category.courses.filter((c: any) => completedCourses?.has(c.code)).length}/{category.courses.length}
                                                    </Badge>
                                                </CardTitle>
                                                <div className="flex items-center gap-1">
                                                    {!isComplete && (
                                                        <Progress value={progress} className="h-0.5 w-12 rounded-full bg-slate-100" />
                                                    )}
                                                    <div className={`text-xs font-bold ${
                                                        isComplete ? 'text-green-600' : 'text-slate-600'
                                                    }`}>
                                                        {Math.round(progress)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-1.5 pt-0.5">
                                            <RequirementCategory 
                                                category={category}
                                                programType={type}
                                                completedCourses={completedCourses}
                                                plannedCourses={plannedCourses}
                                                completedGroups={completedGroups}
                                                onCourseToggle={onCourseToggle}
                                                onGroupCompletion={onGroupCompletion}
                                            />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Compact Footnotes Sidebar - Hidden on mobile, visible on large screens */}
                {program.footnotes && program.footnotes.length > 0 && (
                    <div className="hidden lg:block lg:w-48 flex-shrink-0">
                        <Card className="bg-slate-50/50 border-slate-200 sticky top-2 h-fit">
                            <CardHeader className="p-2 pb-1">
                                <CardTitle className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                    <span className="text-sm">📝</span>
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 pt-1">
                                <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
                                    {program.footnotes.map((footnote) => (
                                        <div key={footnote.number} className="text-xs text-slate-600 bg-white rounded p-1.5 border border-slate-100">
                                            <span className="font-semibold">{footnote.number}.</span> {footnote.text}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};