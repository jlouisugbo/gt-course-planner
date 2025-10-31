"use client";

import React, { useEffect, useState, useCallback } from "react";
import { VisualRequirementCategory, VisualCourse } from "@/types/requirements";
import { CourseCard } from "./CourseCard";
import { CourseGroup } from "./CourseGroup";
import { FlexibleCourseCard } from "./FlexibleCourseCard";
import { CompletableCourseCard } from "./CompletableCourseCard";
import { CompletableGroupCard } from "./CompletableGroupCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

interface RequirementCategoryProps {
    category: VisualRequirementCategory;
    programType: 'degree' | 'minor';
    completedCourses?: Set<string>;
    plannedCourses?: Set<string>;
    completedGroups?: Set<string>;
    onCourseToggle?: (courseCode: string) => void;
    onGroupCompletion?: (groupId: string, isSatisfied: boolean) => void;
}

export const RequirementCategory: React.FC<RequirementCategoryProps> = ({ 
    category, 
    programType,
    completedCourses,
    plannedCourses,
    completedGroups,
    onCourseToggle,
    onGroupCompletion
}) => {
    const [isExpanded, setIsExpanded] = useState(false); // Start collapsed for more compact view
    
    // Combined function to check if a course/group is satisfied (handles recursion properly)
    const isCourseSatisfied: (course: VisualCourse) => boolean = useCallback((course: VisualCourse): boolean => {
        if (!completedCourses) return false;
        
        // Handle regular and flexible courses
        if (course.courseType === 'regular' || course.courseType === 'flexible') {
            return completedCourses.has(course.code);
        }
        
        // Handle group courses  
        if (course.courseType === 'and_group') {
            // For AND groups, all nested courses must be completed
            return course.groupCourses?.every(subCourse => 
                isCourseSatisfied(subCourse)
            ) || false;
        } else if (course.courseType === 'or_group') {
            // For OR groups, at least one nested course/group must be completed
            return course.groupCourses?.some(subCourse => 
                isCourseSatisfied(subCourse)
            ) || false;
        } else if (course.courseType === 'selection') {
            // For SELECT groups, the required number of options must be completed
            const satisfiedCount = course.selectionOptions?.filter(option =>
                isCourseSatisfied(option)
            ).length || 0;
            return satisfiedCount >= (course.selectionCount || 1);
        }
        
        return false;
    }, [completedCourses]);

    // Alias for the same function to avoid circular dependency issues
    const isGroupSatisfied = isCourseSatisfied;

    const hasCompletionTracking = completedCourses && onCourseToggle;
    
    // Use useEffect to check group satisfaction after render instead of during render
    useEffect(() => {
        if (!completedCourses || !onGroupCompletion) return;
        
        // Check all groups in this category for satisfaction changes
        category.courses.forEach(course => {
            const groupId = 'groupId' in course ? course.groupId : undefined;
            if (!groupId) return;
            
            const satisfied = isGroupSatisfied(course);
            const wasCompleted = completedGroups?.has(groupId);
            
            // If satisfaction status changed, update it
            if (satisfied !== wasCompleted) {
                onGroupCompletion(groupId, satisfied);
            }
        });
    }, [completedCourses, completedGroups, category.courses, onGroupCompletion, isGroupSatisfied]);
    
    const renderCourse = (course: VisualCourse, index: number) => {
        // Handle different course types - use completable versions if completion tracking is enabled
        if (hasCompletionTracking) {
            switch (course.courseType) {
                case 'or_group':
                case 'and_group':
                case 'selection':
                    const selectionGroupId = 'groupId' in course ? course.groupId : `selection-${index}`;
                    return (
                        <CompletableGroupCard
                            key={`${selectionGroupId}-${index}`}
                            course={course}
                            completedCourses={completedCourses}
                            plannedCourses={plannedCourses}
                            onCourseToggle={onCourseToggle}
                            isGroupSatisfied={isCourseSatisfied(course)}
                            programType={programType}
                        />
                    );
                
                case 'flexible':
                    return (
                        <CompletableCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.isOption}
                            isCompleted={completedCourses.has(course.code)}
                            isPlanned={plannedCourses?.has(course.code) || false}
                            onToggleComplete={onCourseToggle}
                        />
                    );
                
                case 'regular':
                default:
                    return (
                        <CompletableCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.isOption}
                            isCompleted={completedCourses.has(course.code)}
                            isPlanned={plannedCourses?.has(course.code) || false}
                            onToggleComplete={onCourseToggle}
                        />
                    );
            }
        } else {
            // Original non-completable versions
            switch (course.courseType) {
                case 'or_group':
                    const orGroupId = 'groupId' in course ? course.groupId : `or-${index}`;
                    return (
                        <CourseGroup
                            key={`${orGroupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="or"
                        />
                    );
                
                case 'and_group':
                    const andGroupId = 'groupId' in course ? course.groupId : `and-${index}`;
                    return (
                        <CourseGroup
                            key={`${andGroupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="and"
                        />
                    );
                
                case 'selection':
                    const selGroupId = 'groupId' in course ? course.groupId : `sel-${index}`;
                    return (
                        <CourseGroup
                            key={`${selGroupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="selection"
                        />
                    );
                
                case 'flexible':
                    return (
                        <FlexibleCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                        />
                    );
                
                case 'regular':
                default:
                    return (
                        <CourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.isOption}
                        />
                    );
            }
        }
    };

    return (
        <div className="space-y-0.5">
            {/* Compact Category Header with Collapse Toggle */}
            <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                    <span className="text-xs text-slate-600">
                        {category.courses.filter((c: any) => completedCourses?.has(c.code)).length}/{category.courses.length} courses
                    </span>
                </div>
            </div>

            {/* Collapsible Content */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-0.5 pl-4"
                            >
                                {category.courses.length === 0 ? (
                                    <div className="text-center py-1 text-slate-500">
                                        <p className="text-xs">No courses defined</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {category.courses.map((course, index) => renderCourse(course, index))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};