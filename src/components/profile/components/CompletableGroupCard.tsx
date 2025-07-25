"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, GitBranch, Link, CheckSquare, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VisualCourse } from "@/types/requirements";
import { CompletableCourseCard } from "./CompletableCourseCard";
import { cn } from "@/lib/utils";

interface CompletableGroupCardProps {
  course: VisualCourse;
  completedCourses: Set<string>;
  onCourseToggle: (courseCode: string) => void;
  isGroupSatisfied: boolean;
}

export const CompletableGroupCard: React.FC<CompletableGroupCardProps> = ({
  course,
  completedCourses,
  onCourseToggle,
  isGroupSatisfied
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getGroupTheme = () => {
    if (course.courseType === 'or_group') {
      return {
        border: isGroupSatisfied ? 'border-green-200' : 'border-purple-200',
        bg: isGroupSatisfied ? 'bg-green-50' : 'bg-purple-50',
        accent: isGroupSatisfied ? 'text-green-600' : 'text-purple-600',
        badgeBg: isGroupSatisfied ? 'bg-green-100' : 'bg-purple-100',
        badgeText: isGroupSatisfied ? 'text-green-800' : 'text-purple-800'
      };
    } else if (course.courseType === 'and_group') {
      return {
        border: isGroupSatisfied ? 'border-green-200' : 'border-green-200',
        bg: isGroupSatisfied ? 'bg-green-50' : 'bg-green-50',
        accent: isGroupSatisfied ? 'text-green-600' : 'text-green-600',
        badgeBg: isGroupSatisfied ? 'bg-green-100' : 'bg-green-100',
        badgeText: isGroupSatisfied ? 'text-green-800' : 'text-green-800'
      };
    } else {
      return {
        border: isGroupSatisfied ? 'border-green-200' : 'border-indigo-200',
        bg: isGroupSatisfied ? 'bg-green-50' : 'bg-indigo-50',
        accent: isGroupSatisfied ? 'text-green-600' : 'text-indigo-600',
        badgeBg: isGroupSatisfied ? 'bg-green-100' : 'bg-indigo-100',
        badgeText: isGroupSatisfied ? 'text-green-800' : 'text-indigo-800'
      };
    }
  };

  const { border, bg, accent, badgeBg, badgeText } = getGroupTheme();

  const renderGroupHeader = () => {
    if (course.courseType === 'or_group' && 'groupCourses' in course) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isGroupSatisfied && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <GitBranch className={`h-5 w-5 ${accent}`} />
            <div>
              <CardTitle className={cn("text-base", isGroupSatisfied && "line-through")}>
                Choose One Option
              </CardTitle>
              <p className={cn("text-sm text-slate-600 mt-1", isGroupSatisfied && "line-through")}>
                Select any one of the following courses
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${badgeBg} ${badgeText} border-0`}>
              {course.groupCourses.length} options
            </Badge>
            <Badge variant="outline">OR Group</Badge>
          </div>
        </div>
      );
    } else if (course.courseType === 'and_group' && 'groupCourses' in course) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isGroupSatisfied && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <Link className={`h-5 w-5 ${accent}`} />
            <div>
              <CardTitle className={cn("text-base", isGroupSatisfied && "line-through")}>
                All Required
              </CardTitle>
              <p className={cn("text-sm text-slate-600 mt-1", isGroupSatisfied && "line-through")}>
                All of the following courses are required
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${badgeBg} ${badgeText} border-0`}>
              {course.groupCourses.length} required
            </Badge>
            <Badge variant="outline">AND Group</Badge>
          </div>
        </div>
      );
    } else if (course.courseType === 'selection' && 'selectionCount' in course) {
      const completedCount = course.selectionOptions?.filter(option =>
        option.courseType === 'regular' ? completedCourses.has(option.code) : false
      ).length || 0;
      
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isGroupSatisfied && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            <CheckSquare className={`h-5 w-5 ${accent}`} />
            <div>
              <CardTitle className={cn("text-base", isGroupSatisfied && "line-through")}>
                {course.title || `Select ${course.selectionCount} Courses`}
              </CardTitle>
              <p className={cn("text-sm text-slate-600 mt-1", isGroupSatisfied && "line-through")}>
                Choose {course.selectionCount} from the available options
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${badgeBg} ${badgeText} border-0`}>
              {completedCount}/{course.selectionCount} selected
            </Badge>
            <Badge variant="outline">Selection</Badge>
          </div>
        </div>
      );
    }
    return null;
  };

  const getCourses = () => {
    if (course.courseType === 'or_group' && 'groupCourses' in course) {
      return course.groupCourses;
    } else if (course.courseType === 'and_group' && 'groupCourses' in course) {
      return course.groupCourses;
    } else if (course.courseType === 'selection' && 'selectionOptions' in course) {
      return course.selectionOptions;
    }
    return [];
  };

  const courses = getCourses();

  // Recursive function to check if nested course/group is satisfied
  const isCourseSatisfied = (nestedCourse: VisualCourse): boolean => {
    if (nestedCourse.courseType === 'regular' || nestedCourse.courseType === 'flexible') {
      return completedCourses.has(nestedCourse.code);
    } else if (nestedCourse.courseType === 'and_group') {
      return nestedCourse.groupCourses?.every(subCourse => 
        isCourseSatisfied(subCourse)
      ) || false;
    } else if (nestedCourse.courseType === 'or_group') {
      return nestedCourse.groupCourses?.some(subCourse => 
        isCourseSatisfied(subCourse)
      ) || false;
    } else if (nestedCourse.courseType === 'selection') {
      const satisfiedCount = nestedCourse.selectionOptions?.filter(option =>
        isCourseSatisfied(option)
      ).length || 0;
      return satisfiedCount >= (nestedCourse.selectionCount || 1);
    }
    return false;
  };

  return (
    <Card className={cn(`${border} ${bg} transition-all duration-200`, isGroupSatisfied && "ring-2 ring-green-200")}>
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
                    {courses.length === 0 ? (
                      <div className="text-center py-6 text-slate-500">
                        <p>No courses available in this group</p>
                      </div>
                    ) : (
                      courses.map((groupCourse, index) => (
                        <motion.div
                          key={`${groupCourse.code}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {/* Handle nested groups recursively */}
                          {groupCourse.courseType === 'or_group' || 
                           groupCourse.courseType === 'and_group' || 
                           groupCourse.courseType === 'selection' ? (
                            <CompletableGroupCard
                              course={groupCourse}
                              completedCourses={completedCourses}
                              onCourseToggle={onCourseToggle}
                              isGroupSatisfied={isCourseSatisfied(groupCourse)}
                            />
                          ) : (
                            <CompletableCourseCard
                              course={groupCourse}
                              isCompleted={completedCourses.has(groupCourse.code)}
                              onToggle={() => onCourseToggle(groupCourse.code)}
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
                        {course.courseType === 'or_group' 
                          ? 'Any one course from this group satisfies the requirement'
                          : course.courseType === 'and_group'
                          ? 'All courses in this group are required'
                          : `${'selectionCount' in course ? course.selectionCount : 1} courses must be selected from this group`
                        }
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {courses.length} total options
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