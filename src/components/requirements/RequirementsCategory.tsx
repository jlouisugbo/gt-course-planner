"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequirementsCourseCard } from './RequirementsCourseCard';
import { VisualRequirementCategory } from '@/types/requirements';
import { ChevronDown, ChevronUp, BookOpen, Award } from 'lucide-react';

interface RequirementsCategoryProps {
  section: VisualRequirementCategory;
  completedCourses: Set<string>;
  plannedCourses?: Set<string>;
  onToggleCourse: (courseCode: string) => void;
  footnotes?: { id: number; text: string }[];
}

export const RequirementsCategory: React.FC<RequirementsCategoryProps> = ({
  section,
  completedCourses,
  plannedCourses = new Set(),
  onToggleCourse,
  footnotes = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Calculate progress based on completed courses
  const totalCourses = section.courses.length;
  const completedCount = section.courses.filter(course => 
    completedCourses.has(course.code)
  ).length;
  const progress = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
  
  const completedCredits = section.courses
    .filter(course => completedCourses.has(course.code))
    .reduce((sum, course) => sum + (course.credits || 0), 0);

  const minimumCredits = section.minCredits || section.courses.reduce((sum, course) => sum + (course.credits || 0), 0);

  return (
    <Card className="overflow-hidden border-l-4 border-l-[#B3A369] py-1">
      <CardHeader className="py-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-[#B3A369]" />
              <CardTitle className="text-xl text-[#003057]">{section.name}</CardTitle>
              <Badge variant={progress === 100 ? "default" : "secondary"} className="ml-auto">
                {completedCount}/{totalCourses} courses
              </Badge>
            </div>
            {section.description && (
              <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
            )}
            
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Section Progress</span>
                <span className="text-muted-foreground">
                  {completedCredits}/{minimumCredits} credits
                </span>
              </div>
              <Progress value={Math.min(100, (completedCredits / minimumCredits) * 100)} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% complete</span>
                <span>{Math.max(0, minimumCredits - completedCredits)} credits remaining</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-0 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.courses.map((course, index) => (
                  <motion.div
                    key={`${section.id}-${course.code}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <RequirementsCourseCard
                      course={course}
                      isCompleted={completedCourses.has(course.code)}
                      isPlanned={plannedCourses.has(course.code)}
                      onToggleComplete={onToggleCourse}
                      footnotes={footnotes}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Section completed badge */}
              {completedCredits >= minimumCredits && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <Award className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Section Requirements Met!
                  </span>
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};