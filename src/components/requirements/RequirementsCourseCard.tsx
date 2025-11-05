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
import { PrerequisiteBadges } from '@/components/ui/PrerequisiteDisplay';

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
  const [justChecked, setJustChecked] = useState(false);

  const handleToggleComplete = () => {
    if (course.type === 'or_group' || course.type === 'and_group') {
      // For group courses, we might want different behavior
      return;
    }

    // Trigger animation when checking
    if (!isCompleted) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 600);
    }

    onToggleComplete(course.code);
  };

  const renderCourseContent = () => {
    if (course.type === 'or_group') {
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-orange-600" />
            <span className="font-medium text-xs">{course.title}</span>
            <Badge variant="outline" className="text-xs h-4 px-1">
              Choose 1
            </Badge>
          </div>
          
          <div className="space-y-1 pl-4 border-l-2 border-orange-200/50">
            {course.courses?.map((groupCourse: VisualCourse, idx: number) => (
              <div key={`${groupCourse.code}-${idx}`} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-xs">{groupCourse.code}</span>
                  <span className="text-xs text-muted-foreground truncate">{groupCourse.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    {groupCourse.credits}cr
                  </Badge>
                  <Checkbox
                    checked={completedCourses?.has(groupCourse.code)}
                    onCheckedChange={() => onToggleComplete(groupCourse.code)}
                    className="h-3.5 w-3.5"
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-sm">{course.title}</span>
              <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700">
                {course.type === 'flexible' ? 'Flex' : 'Select'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="secondary" className="text-xs h-4 px-1">
                {course.credits} cr
              </Badge>
              {course.selectionCount && (
                <Badge variant="outline" className="text-xs h-4 px-1">
                  Pick {course.selectionCount}
                </Badge>
              )}
            </div>
          </div>
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            className="h-4 w-4"
          />
        </div>
      );
    }

    // Regular course
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">{course.code}</h4>
            <span className="text-xs text-muted-foreground truncate">{course.title}</span>
          </div>
          
          <div className="flex items-center gap-1 mt-0.5">
            <Badge variant="secondary" className="text-xs h-4 px-1">
              {course.credits} cr
            </Badge>
            {course.prerequisites && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <PrerequisiteBadges prerequisites={course.prerequisites} maxShow={1} />
              </>
            )}
            {course.footnoteRefs && course.footnoteRefs.length > 0 && (
              <Badge variant="outline" className="text-xs h-4 px-1" title={footnotes.find(f => f.id === course.footnoteRefs[0])?.text}>
                Note {course.footnoteRefs[0]}
              </Badge>
            )}
          </div>
        </div>
        
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
          className="h-4 w-4"
        />
      </div>
    );
  };

  return (
    <>
      <Card className={cn(
        "transition-all duration-300 hover:shadow-sm cursor-pointer group",
        isCompleted && "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-100 shadow-md",
        justChecked && "scale-[1.02] ring-2 ring-green-400 ring-opacity-50",
        isPlanned && !isCompleted && "border-blue-400 bg-blue-50/30 dark:bg-blue-900/10",
        course.type === 'or_group' && "border-orange-200",
        (course.type === 'flexible' || course.type === 'selection') && "border-blue-200"
      )}>
        <CardContent className="p-2">
          {renderCourseContent()}

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