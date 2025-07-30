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
        <div className="space-y-4">
            {/* Program Header with Progress Bar */}
            <Card className={`py-1 bg-gradient-to-br ${
                type === 'degree' 
                    ? 'from-blue-50 via-blue-25 to-slate-50 border-blue-200' 
                    : 'from-yellow-50 via-yellow-25 to-slate-50 border-yellow-200'
            } shadow-md border`}>
                <CardContent className="py-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                type === 'degree' 
                                    ? 'bg-gradient-to-br from-[#003057] to-[#004080]' 
                                    : 'bg-gradient-to-br from-[#B3A369] to-[#D4C284]'
                            }`}>
                                <Target className="h-3 w-3 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {program.name}
                                </h3>
                                <p className="text-xs text-slate-600">
                                    {type === 'degree' ? 'Bachelor\'s Degree Requirements' : 'Minor Requirements'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xl font-bold ${
                                type === 'degree' ? 'text-blue-700' : 'text-yellow-700'
                            }`}>
                                {completedCategories}<span className="text-slate-400 text-sm">/{totalCategories}</span>
                            </div>
                            <p className="text-xs text-slate-600">Categories Complete</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">Overall Progress</span>
                            <span className={`font-bold ${
                                overallProgress >= 100 ? 'text-green-600' :
                                overallProgress >= 75 ? 'text-blue-600' :
                                overallProgress >= 50 ? 'text-yellow-600' : 'text-slate-600'
                            }`}>
                                {Math.round(overallProgress)}%
                            </span>
                        </div>
                        <Progress 
                            value={overallProgress} 
                            className={`h-2 ${type === 'degree' ? 'bg-blue-100' : 'bg-yellow-100'} rounded-full`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Area with Vertical Requirements and Footnotes */}
            <div className="flex gap-4">
                {/* Vertical Requirements Container */}
                <div className="flex-1">
                    <div className="space-y-3">
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
                                    <Card className={`py-1 transition-all duration-200 hover:shadow-lg border-2 w-full h-auto ${
                                        isComplete 
                                            ? 'ring-2 ring-green-300 bg-gradient-to-br from-green-50 to-green-25 border-green-200' 
                                            : 'hover:ring-2 hover:ring-blue-200 bg-white border-slate-200 hover:border-blue-300'
                                    }`}>
                                        <CardHeader className="py-1">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="flex items-start space-x-2">
                                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center mt-0.5 ${
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
                                                    <div className="flex-1">
                                                        <span className={cn(
                                                            "text-xs font-bold leading-tight",
                                                            isComplete ? "text-green-700 line-through" : "text-slate-900"
                                                        )}>{category.name}</span>
                                                        <div className="flex items-center space-x-1 mt-0.5">
                                                            <Badge 
                                                                variant={isComplete ? "default" : "outline"} 
                                                                className={`text-xs px-1 py-0 h-3 ${
                                                                    isComplete 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-slate-100 text-slate-700'
                                                                }`}
                                                            >
                                                                {category.courses.length}
                                                            </Badge>
                                                            {isComplete && (
                                                                <Badge className="text-xs px-1 py-0 h-3 bg-green-500 text-white">
                                                                    ✓ Complete
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardTitle>
                                                <div className={`text-sm font-bold ${
                                                    isComplete ? 'text-green-600' : 'text-slate-600'
                                                }`}>
                                                    {Math.round(progress)}%
                                                </div>
                                            </div>
                                            {!isComplete && (
                                                <Progress value={progress} className="h-1 rounded-full bg-slate-100 mt-1" />
                                            )}
                                        </CardHeader>
                                        <CardContent className="py-1 flex-1">
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

                {/* Always Visible Footnotes Sidebar */}
                {program.footnotes && program.footnotes.length > 0 && (
                    <div className="w-72 flex-shrink-0">
                        <Card className="py-1 bg-slate-50 border-slate-200 sticky top-4 h-fit">
                            <CardHeader className="py-1">
                                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
                                    <div className="w-4 h-4 bg-slate-300 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-xs font-bold text-slate-600">i</span>
                                    </div>
                                    Footnotes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-1">
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {program.footnotes.map((footnote) => (
                                        <div key={footnote.number} className="text-xs text-slate-700 bg-white rounded py-2 px-2 border border-slate-200">
                                            <span className="font-semibold text-slate-800">{footnote.number}.</span> {footnote.text}
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