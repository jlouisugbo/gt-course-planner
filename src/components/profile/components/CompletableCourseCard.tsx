"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { VisualCourse } from "@/types/requirements";
import { cn } from "@/lib/utils";

interface CompletableCourseCardProps {
  course: VisualCourse;
  isCompleted: boolean;
  onToggle: () => void;
}

export const CompletableCourseCard: React.FC<CompletableCourseCardProps> = ({
  course,
  isCompleted,
  onToggle
}) => {
  const isFlexible = course.courseType === 'flexible';

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-sm h-12 min-w-0 inline-block",
      isCompleted && "bg-green-50 border-green-200",
      isFlexible && "border-amber-200 bg-amber-50"
    )}>
      <CardContent className="p-1.5 h-full">
        <div className="flex items-center space-x-1.5 h-full">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-3 w-3 flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0 flex items-center">
            <div className="flex items-center space-x-1 min-w-0">
              {isFlexible && <Sparkles className="h-3 w-3 text-amber-600 flex-shrink-0" />}
              {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />}
              
              <span className={cn(
                "font-mono text-xs font-semibold flex-shrink-0",
                isCompleted && "line-through text-green-700",
                isFlexible ? "text-amber-700" : "text-slate-700"
              )}>
                {course.code}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};