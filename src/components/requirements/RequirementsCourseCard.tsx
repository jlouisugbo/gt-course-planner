"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequirementsCourseModal } from './RequirementsCourseModal';
import { VisualCourse } from '@/types/requirements';
import { BookOpen, Users, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequirementsCourseCardProps {
  course: VisualCourse;
  isCompleted: boolean;
  isPlanned?: boolean;
  onToggleComplete: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

export const RequirementsCourseCard: React.FC<RequirementsCourseCardProps> = ({
  course,
  isCompleted,
  isPlanned = false,
  onToggleComplete,
  footnotes = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleToggleComplete = () => {
    if (course.type === 'or_group' || course.type === 'and_group') {
      // For group courses, we might want different behavior
      return;
    }
    onToggleComplete(course.code);
  };

  const renderCourseContent = () => {
    if (course.type === 'or_group') {
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-sm">{course.title}</h4>
                <Badge variant="outline" className="text-xs">
                  Choose One
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Select one of the following courses:
              </p>
            </div>
          </div>
          
          <div className="space-y-2 pl-6 border-l-2 border-orange-200">
            {course.courses?.map((groupCourse: VisualCourse, idx: number) => (
              <div key={`${groupCourse.code}-${idx}`} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-xs">{groupCourse.code}</p>
                  <p className="text-xs text-muted-foreground">{groupCourse.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {groupCourse.credits} cr
                  </Badge>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => onToggleComplete(groupCourse.code)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (course.type === 'flexible' || course.type === 'selection') {
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm">{course.title}</h4>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {course.type === 'flexible' ? 'Flexible' : 'Selection'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {course.description || 'Flexible requirement - consult with advisor'}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {course.credits} credits
                </Badge>
                {course.selectionCount && (
                  <Badge variant="outline" className="text-xs">
                    Choose {course.selectionCount}
                  </Badge>
                )}
              </div>
            </div>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
            />
          </div>
        </div>
      );
    }

    // Regular course
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{course.code}</h4>
            <p className="text-sm text-muted-foreground mb-2">{course.title}</p>
            
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <Badge variant="secondary" className="text-xs">
                {course.credits} credits
              </Badge>
            </div>

            {course.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {course.description}
              </p>
            )}

            {course.footnoteRefs && course.footnoteRefs.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {course.footnoteRefs.map(ref => {
                  const footnote = footnotes.find(f => f.id === ref);
                  return (
                    <Badge key={ref} variant="outline" className="text-xs" title={footnote?.text}>
                      Note {ref}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-2 ml-4">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
            />
            {course.description && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="p-1 h-auto"
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer group py-1",
        isCompleted && "border-green-500 shadow-green-100 bg-green-50/50 dark:bg-green-900/10",
        isPlanned && !isCompleted && "border-blue-500 shadow-blue-100 bg-blue-50/50 dark:bg-blue-900/10",
        course.type === 'or_group' && "border-orange-200",
        (course.type === 'flexible' || course.type === 'selection') && "border-blue-200"
      )}>
        <CardContent className="py-2 px-3">
          {renderCourseContent()}
          
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center mt-2 py-1 px-2 bg-green-100 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
            >
              <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-700 dark:text-green-300 text-xs font-medium">
                Completed
              </span>
            </motion.div>
          )}
          
          {isPlanned && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center mt-2 py-1 px-2 bg-blue-100 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800"
            >
              <BookOpen className="h-3 w-3 text-blue-600 mr-1" />
              <span className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                Planned
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <RequirementsCourseModal
        course={course}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footnotes={footnotes}
      />
    </>
  );
};