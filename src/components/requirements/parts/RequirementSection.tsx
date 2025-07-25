"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Target } from "lucide-react";
import { VisualDegreeProgram, VisualMinorProgram } from "@/types/requirements";
import { RequirementCategory } from "./RequirementCategory";

interface RequirementSectionProps {
    program: VisualDegreeProgram | VisualMinorProgram;
    type: 'degree' | 'minor';
    completedCourses?: Set<string>;
    completedGroups?: Set<string>;
    onCourseToggle?: (courseCode: string) => void;
    onGroupCompletion?: (groupId: string, isSatisfied: boolean) => void;
}

export const RequirementSection: React.FC<RequirementSectionProps> = ({ program, type, completedCourses, completedGroups, onCourseToggle, onGroupCompletion }) => {
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
        <div className="space-y-3">
            {/* Compact Program Overview */}
            <Card className={`bg-gradient-to-br ${
                type === 'degree' 
                    ? 'from-blue-50 via-blue-25 to-slate-50 border-blue-200' 
                    : 'from-yellow-50 via-yellow-25 to-slate-50 border-yellow-200'
            } shadow-md border`}>
                <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                type === 'degree' 
                                    ? 'bg-gradient-to-br from-[#003057] to-[#004080]' 
                                    : 'bg-gradient-to-br from-[#B3A369] to-[#D4C284]'
                            }`}>
                                <Target className="h-3 w-3 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {program.name}
                                </h3>
                                <p className="text-xs text-slate-600">
                                    {type === 'degree' ? 'Degree' : 'Minor'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-lg font-bold ${
                                type === 'degree' ? 'text-blue-700' : 'text-yellow-700'
                            }`}>
                                {completedCategories}<span className="text-slate-400 text-sm">/{totalCategories}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-700">Progress</span>
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
                    
                    {/* Compact Footnotes */}
                    {program.footnotes && program.footnotes.length > 0 && (
                        <div className={`mt-4 pt-3 border-t ${
                            type === 'degree' ? 'border-blue-200' : 'border-yellow-200'
                        }`}>
                            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center">
                                <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-slate-600">i</span>
                                </div>
                                Notes
                            </h4>
                            <div className="space-y-1">
                                {program.footnotes.map((footnote) => (
                                    <div key={footnote.number} className="text-xs text-slate-700 bg-white/50 rounded p-2 border border-slate-200">
                                        <span className="font-semibold text-slate-800">{footnote.number}.</span> {footnote.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ultra Compact Requirement Categories */}
            <div className="space-y-2">
                {program.requirements.map((category, index) => {
                    const progress = calculateProgress(category);
                    const isComplete = progress >= 100;
                    
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <Card className={`transition-all duration-200 py-2 gap-1 hover:shadow-md border ${
                                isComplete 
                                    ? 'ring-1 ring-green-300 bg-gradient-to-br from-green-50 to-green-25 border-green-200' 
                                    : 'hover:ring-1 hover:ring-blue-200 bg-white border-slate-200 hover:border-blue-300'
                            }`}>
                                <CardHeader className="pb-1 px-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center space-x-2">
                                            <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
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
                                            <div>
                                                <span className="text-md font-bold text-slate-900">{category.name}</span>
                                                <Badge 
                                                    variant={isComplete ? "default" : "outline"} 
                                                    className={`text-xs px-1 py-0 h-3 ml-1 ${
                                                        isComplete 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {category.courses.length}
                                                </Badge>
                                            </div>
                                        </CardTitle>
                                        <div className="text-xs font-bold ${
                                            isComplete ? 'text-green-600' : 'text-slate-600'
                                        }">
                                            {Math.round(progress)}%
                                        </div>
                                    </div>
                                    {!isComplete && (
                                        <Progress value={progress} className="h-1 rounded-full bg-slate-100 mt-1" />
                                    )}
                                </CardHeader>
                                <CardContent className="pt-0 px-3 pb-2">
                                    <RequirementCategory 
                                        category={category}
                                        programType={type}
                                        completedCourses={completedCourses}
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
    );
};