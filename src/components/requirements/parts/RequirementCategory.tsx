"use client";

import React, { useEffect, useState } from "react";
import { VisualRequirementCategory, VisualCourse } from "@/types/requirements";
import { CourseCard } from "./CourseCard";
import { CourseGroup } from "./CourseGroup";
import { FlexibleCourseCard } from "./FlexibleCourseCard";
import { CompletableCourseCard } from "./CompletableCourseCard";
import { CompletableGroupCard } from "./CompletableGroupCard";
import { FlexibleTextCard } from "./FlexibleTextCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
    const [isExpanded, setIsExpanded] = useState(true); // Start expanded by default
    // Function to check if a group is satisfied
    const isGroupSatisfied = (course: VisualCourse): boolean => {
        if (!completedCourses) return false;
        
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
    };

    // Function to check if a course/group is satisfied (recursive for nested groups)
    const isCourseSatisfied = (course: VisualCourse): boolean => {
        if (!completedCourses) return false;
        
        if (course.courseType === 'regular' || course.courseType === 'flexible') {
            return completedCourses.has(course.code);
        } else {
            return isGroupSatisfied(course);
        }
    };

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
    }, [completedCourses, completedGroups, category.courses, onGroupCompletion]);
    
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
        <div className="space-y-1">
            {/* Category Header with Collapse Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <span className="text-xs text-slate-600">
                        {category.courses.length} course{category.courses.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                </Button>
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
                                transition={{ duration: 0.2 }}
                            >
                                {category.courses.length === 0 ? (
                                    <div className="text-center py-2 text-slate-500">
                                        <p className="text-xs">No courses defined for this requirement</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {category.courses.map((course, index) => (
                                            <div key={index} className="flex-shrink-0 min-w-0">
                                                {renderCourse(course, index)}
                                            </div>
                                        ))}
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