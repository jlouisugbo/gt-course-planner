"use client";

import React, { useEffect } from "react";
import { VisualRequirementCategory, VisualCourse } from "@/types/requirements";
import { CourseCard } from "./CourseCard";
import { CourseGroup } from "./CourseGroup";
import { FlexibleCourseCard } from "./FlexibleCourseCard";
import { CompletableCourseCard } from "./CompletableCourseCard";
import { CompletableGroupCard } from "./CompletableGroupCard";
import { FlexibleTextCard } from "./FlexibleTextCard";

interface RequirementCategoryProps {
    category: VisualRequirementCategory;
    programType: 'degree' | 'minor';
    completedCourses?: Set<string>;
    completedGroups?: Set<string>;
    onCourseToggle?: (courseCode: string) => void;
    onGroupCompletion?: (groupId: string, isSatisfied: boolean) => void;
}

export const RequirementCategory: React.FC<RequirementCategoryProps> = ({ 
    category, 
    programType,
    completedCourses,
    completedGroups,
    onCourseToggle,
    onGroupCompletion
}) => {
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
            if (!course.groupId) return;
            
            const satisfied = isGroupSatisfied(course);
            const wasCompleted = completedGroups?.has(course.groupId);
            
            // If satisfaction status changed, update it
            if (satisfied !== wasCompleted) {
                onGroupCompletion(course.groupId, satisfied);
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
                    return (
                        <CompletableGroupCard
                            key={`${course.groupId}-${index}`}
                            course={course}
                            completedCourses={completedCourses}
                            onCourseToggle={onCourseToggle}
                            isGroupSatisfied={isCourseSatisfied(course)}
                            programType={programType}
                        />
                    );
                
                case 'flexible':
                    // Check if this is a text-only flexible requirement
                    if (!course.code || course.code === 'FLEXIBLE_TEXT' || course.isTextOnly) {
                        return (
                            <FlexibleTextCard
                                key={`${course.text || course.title}-${index}`}
                                text={course.text || course.title || 'Flexible requirement'}
                                code={course.code !== 'FLEXIBLE_TEXT' ? course.code : undefined}
                                programType={programType}
                                isCompleted={completedCourses.has(course.text || course.title || course.code)}
                                onToggleComplete={onCourseToggle}
                            />
                        );
                    }
                    // Otherwise, treat as regular course
                    return (
                        <CompletableCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.courseType === 'or_option' || course.isOption}
                            isCompleted={completedCourses.has(course.code)}
                            onToggleComplete={onCourseToggle}
                        />
                    );
                
                case 'regular':
                case 'or_option':
                default:
                    return (
                        <CompletableCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.courseType === 'or_option' || course.isOption}
                            isCompleted={completedCourses.has(course.code)}
                            onToggleComplete={onCourseToggle}
                        />
                    );
            }
        } else {
            // Original non-completable versions
            switch (course.courseType) {
                case 'or_group':
                    return (
                        <CourseGroup
                            key={`${course.groupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="or"
                        />
                    );
                
                case 'and_group':
                    return (
                        <CourseGroup
                            key={`${course.groupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="and"
                        />
                    );
                
                case 'selection':
                    return (
                        <CourseGroup
                            key={`${course.groupId}-${index}`}
                            course={course}
                            programType={programType}
                            type="selection"
                        />
                    );
                
                case 'flexible':
                    // Check if this is a text-only flexible requirement
                    if (!course.code || course.code === 'FLEXIBLE_TEXT' || course.isTextOnly) {
                        return (
                            <FlexibleTextCard
                                key={`${course.text || course.title}-${index}`}
                                text={course.text || course.title || 'Flexible requirement'}
                                code={course.code !== 'FLEXIBLE_TEXT' ? course.code : undefined}
                                programType={programType}
                                isCompleted={false}
                                onToggleComplete={undefined}
                            />
                        );
                    }
                    // Otherwise, use the regular flexible course card
                    return (
                        <FlexibleCourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                        />
                    );
                
                case 'regular':
                case 'or_option':
                default:
                    return (
                        <CourseCard
                            key={`${course.code}-${index}`}
                            course={course}
                            programType={programType}
                            isOption={course.courseType === 'or_option' || course.isOption}
                        />
                    );
            }
        }
    };

    return (
        <div className="space-y-3">
            {category.courses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>No courses defined for this requirement</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {category.courses.map((course, index) => renderCourse(course, index))}
                </div>
            )}
        </div>
    );
};