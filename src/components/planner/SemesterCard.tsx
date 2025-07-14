"use client";

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  AlertTriangle,
} from 'lucide-react';
import { PlannedCourse, SemesterData } from '@/types/courses';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import CourseManager from '@/components/courses/CourseManager';
import CourseDetailsModal from './CourseDetailsModal';
import CourseCard from './CourseCard';
import { DragTypes, DragItem, DropResult } from '@/types/dndtypes';

interface SemesterCardProps {
  semester: SemesterData;
}

const SemesterCard: React.FC<SemesterCardProps> = ({ semester }) => {
  const { removeCourseFromSemester, moveCourse, addCourseToSemester } = usePlannerStore();
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<PlannedCourse | null>(null);

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, DropResult, { isOver: boolean; canDrop: boolean }>({
    accept: [DragTypes.COURSE, DragTypes.PLANNED_COURSE],
    drop: (item) => {
      if(item.type === DragTypes.PLANNED_COURSE && item.semesterId !== semester.id){
        moveCourse(item.id, item.semesterId, semester.id);
      } else if(item.type === DragTypes.COURSE){
        const plannedCourse: PlannedCourse = {
          ...item.course,
          semesterId: semester.id,
          status: 'planned' as const,
          year: semester.year,
          season: semester.season
        };
        addCourseToSemester(plannedCourse);
      }
      return {
        targetSemesterId: semester.id,
        targetType: 'semester'
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isOverloaded = semester.totalCredits > semester.maxCredits;
  const isLight = semester.totalCredits < 12 && semester.courses.length > 0;
  const isDragOver = isOver && canDrop;

  return (
    <>
      <Card 
        ref={drop as any} 
        className={cn(
          "semester-column transition-all duration-200 h-full border-slate-300",
          semester.isActive && "ring-2 ring-[#B3A369]",
          isDragOver && "ring-2 ring-[#B3A369] bg-[#B3A369]/5",
          isOverloaded && "border-red-400"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">
              {semester.season} {semester.year}
            </CardTitle>
            {semester.isActive && (
              <Badge className="text-xs" variant="secondary">
                Current
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={cn(
              "font-semibold text-xs",
              isOverloaded ? "text-red-600" : isLight ? "text-amber-600" : "text-slate-600"
            )}>
              {semester.totalCredits} / {semester.maxCredits} Credits
            </span>

            {isOverloaded && (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Overloaded</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 min-h-[350px]">
          <AnimatePresence>
            {semester.courses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                  isDragOver ? "border-[#B3A369] bg-[#B3A369]/5 text-[#B3A369]" : "border-slate-300"
                )}
                onClick={() => setShowCourseManager(true)}
              >
                <Plus className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Drop courses here</p>
                <p className="text-xs">or click to add</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {semester.courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <CourseCard
                      course={course}
                      onRemove={() => removeCourseFromSemester(course.id, semester.id)}
                      onViewDetails={() => setSelectedCourse(course)}
                      compact={true}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {semester.courses.length > 0 && (
            <Button 
              variant="ghost" 
              className="w-full border-2 border-dashed border-slate-300 h-10 hover:border-[#B3A369] hover:bg-[#B3A369]/5 text-slate-600 text-sm"
              onClick={() => setShowCourseManager(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}
        </CardContent>
      </Card>

      {showCourseManager && (
        <CourseManager
          semesterId={semester.id}
          onClose={() => setShowCourseManager(false)}
        />
      )}

      {selectedCourse && (
        <CourseDetailsModal 
          course={selectedCourse}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onAddCourse={() => {}} // Already handled in CourseCard
        />
      )}
    </>
  );
};

export default SemesterCard;