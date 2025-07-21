"use client";

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  Clock,
  Calendar,
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Info,
  AlertCircle
} from 'lucide-react';
import { PlannedCourse } from '@/types/courses';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CourseCompletionModal from './CourseCompletionModal';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { DragTypes, DragItem } from '@/types';

interface CourseCardProps {
  course?: PlannedCourse | null;
  onRemove?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onRemove,
  onViewDetails,
  compact = false
}) => {
  const { updateCourseStatus } = usePlannerStore();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  // Safe property access with fallbacks
  const courseId = course.id || 0;
  const courseCode = course.code || 'Unknown';
  const courseTitle = course.title || 'No title available';
  const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
  const courseStatus = course.status || 'planned';
  const courseGrade = course.grade || null;
  const courseSemesterId = course.semesterId || 0;
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DragTypes.PLANNED_COURSE,
    item: {
      type: DragTypes.PLANNED_COURSE,
      id: courseId,
      course: course,
      semesterId: courseSemesterId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => courseStatus !== 'completed' // Don't allow dragging completed courses
  });

  // Early return if no course provided
  if (!course || typeof course !== 'object') {
    return (
      <div className="p-3 rounded-lg border border-red-200 bg-red-50">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Invalid course data</span>
        </div>
      </div>
    );
  }  

  const getStatusIcon = (status: PlannedCourse['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-3 w-3 text-blue-600" />;
      default:
        return <Calendar className="h-3 w-3 text-slate-400" />;
    }
  };

  const getStatusColor = (status: PlannedCourse['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 opacity-75';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-300';
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCompletionModal(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.();
  };

  const handleUpdateStatus = (courseId: number, semesterId: number, status: PlannedCourse['status'], grade?: string) => {
    if (updateCourseStatus && typeof courseId === 'number' && typeof semesterId === 'number') {
      updateCourseStatus(courseId, semesterId, status, grade);
    }
    setShowCompletionModal(false);
  };

  return (
    <>
      <motion.div
        ref={drag as any}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          "group relative rounded-lg border transition-all duration-200 hover:shadow-md",
          getStatusColor(courseStatus),
          compact ? "p-2" : "p-3",
          isDragging ? "opacity-50 cursor-grabbing" : "cursor-move",
          courseStatus === 'completed' && "cursor-default"
        )}
        onClick={onViewDetails}
        style={{
          opacity: isDragging ? 0.5 : 1
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GripVertical className={cn(
              "h-3 w-3 text-slate-400 transition-opacity",
              courseStatus === 'completed' ? "opacity-30" : "opacity-50 group-hover:opacity-100"
            )} />
            <span className={cn(
              "font-bold text-slate-900", 
              compact ? "text-sm" : "text-sm", 
              courseStatus === "completed" && "line-through opacity-60"
            )}>
              {courseCode}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="secondary" className="text-xs">
              {courseCredits}cr
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={"bg-white"}>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowCompletionModal(true);
                }}>
                  <Edit className="h-3 w-3 mr-2" />
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Info className="h-3 w-3 mr-2" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleRemove}
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <p className={cn(
          "text-xs text-slate-700 font-medium line-clamp-2 mb-2",
          courseStatus === 'completed' && "opacity-60"
        )}>
          {courseTitle}
        </p>
        
        <div className="flex items-center justify-between">
          {courseGrade && (
            <Badge variant="outline" className="text-xs">
              {courseGrade}
            </Badge>
          )}
          
        </div>
      </motion.div>

      {/* Course Completion Modal */}
      {showCompletionModal && (
        <CourseCompletionModal
          course={course}
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  );
};

export default CourseCard;