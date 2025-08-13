"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, GitBranch, CheckSquare, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OrGroupCourse, AndGroupCourse, SelectionCourse } from "@/types/requirements";
import { CourseCard } from "./CourseCard";

interface CourseGroupProps {
    course: OrGroupCourse | AndGroupCourse | SelectionCourse;
    programType: 'degree' | 'minor';
    type: 'or' | 'and' | 'selection';
}

export const CourseGroup: React.FC<CourseGroupProps> = ({
    course,
    programType,
    type
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const getGroupTheme = () => {
        if (type === 'or') {
            return {
                border: 'border-purple-200',
                bg: 'bg-purple-50',
                accent: 'text-purple-600',
                badgeBg: 'bg-purple-100',
                badgeText: 'text-purple-800'
            };
        } else if (type === 'and') {
            return {
                border: 'border-green-200',
                bg: 'bg-green-50',
                accent: 'text-green-600',
                badgeBg: 'bg-green-100',
                badgeText: 'text-green-800'
            };
        } else {
            return {
                border: 'border-indigo-200',
                bg: 'bg-indigo-50',
                accent: 'text-indigo-600',
                badgeBg: 'bg-indigo-100',
                badgeText: 'text-indigo-800'
            };
        }
    };

    const { border, bg, accent, badgeBg, badgeText } = getGroupTheme();

    const renderGroupHeader = () => {
        if (type === 'or' && 'groupCourses' in course) {
            return (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <GitBranch className={`h-5 w-5 ${accent}`} />
                        <div>
                            <CardTitle className="text-lg">Choose One Option</CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Select any one of the following courses
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge className={`${badgeBg} ${badgeText} border-0`}>
                            {course.groupCourses?.length || 0} options
                        </Badge>
                        <Badge variant="outline">OR Group</Badge>
                    </div>
                </div>
            );
        } else if (type === 'and' && 'groupCourses' in course) {
            return (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link className={`h-5 w-5 ${accent}`} />
                        <div>
                            <CardTitle className="text-lg">All Required</CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                All of the following courses are required
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge className={`${badgeBg} ${badgeText} border-0`}>
                            {course.groupCourses?.length || 0} required
                        </Badge>
                        <Badge variant="outline">AND Group</Badge>
                    </div>
                </div>
            );
        } else if (type === 'selection' && 'selectionCount' in course) {
            return (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <CheckSquare className={`h-5 w-5 ${accent}`} />
                        <div>
                            <CardTitle className="text-lg">
                                {course.title || `Select ${
                                    'selectionCount' in course ? course.selectionCount : 1
                                } Courses`}
                            </CardTitle>
                            <p className="text-sm text-slate-600 mt-1">
                                Choose {'selectionCount' in course ? course.selectionCount : 1} from the available options
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge className={`${badgeBg} ${badgeText} border-0`}>
                            Select {'selectionCount' in course ? course.selectionCount : 1}
                        </Badge>
                        <Badge variant="outline">Selection</Badge>
                    </div>
                </div>
            );
        }
        return null;
    };

    const getCourses = () => {
        if (type === 'or' && 'groupCourses' in course) {
            return course.groupCourses;
        } else if (type === 'selection' && 'selectionOptions' in course) {
            return course.selectionOptions;
        }
        return [];
    };

    const courses = getCourses();

    return (
        <Card className={`${border} ${bg} transition-all duration-200`}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="pb-4 cursor-pointer hover:bg-white/50 transition-colors rounded-t-lg">
                        <div className="flex items-center justify-between w-full">
                            {renderGroupHeader()}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 p-1 h-8 w-8"
                            >
                                {isOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                
                <AnimatePresence>
                    {isOpen && (
                        <CollapsibleContent asChild>
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {courses?.length === 0 ? (
                                            <div className="text-center py-6 text-slate-500">
                                                <p>No courses available in this group</p>
                                            </div>
                                        ) : (
                                            courses?.map((groupCourse, index) => (
                                                <motion.div
                                                    key={`${groupCourse.code}-${index}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    {/* Handle nested groups */}
                                                    {groupCourse.courseType === 'or_group' ? (
                                                        <CourseGroup
                                                            course={groupCourse}
                                                            programType={programType}
                                                            type="or"
                                                        />
                                                    ) : groupCourse.courseType === 'and_group' ? (
                                                        <CourseGroup
                                                            course={groupCourse}
                                                            programType={programType}
                                                            type="and"
                                                        />
                                                    ) : groupCourse.courseType === 'selection' ? (
                                                        <CourseGroup
                                                            course={groupCourse}
                                                            programType={programType}
                                                            type="selection"
                                                        />
                                                    ) : (
                                                        <CourseCard
                                                            course={groupCourse}
                                                            programType={programType}
                                                            isOption={true}
                                                        />
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                    
                                    {/* Group Footer Information */}
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span>
                                                {type === 'or' 
                                                    ? 'Any one course from this group satisfies the requirement'
                                                    : type === 'and'
                                                    ? 'All courses in this group are required'
                                                    : `${'selectionCount' in course ? course.selectionCount : 1} courses must be selected from this group`
                                                }
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {courses?.length || 0} total options
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </motion.div>
                        </CollapsibleContent>
                    )}
                </AnimatePresence>
            </Collapsible>
        </Card>
    );
};