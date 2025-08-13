"use client";

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Info,
  AlertCircle,
  // Check
} from 'lucide-react';
import { PlannedCourse } from '@/types/courses';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CourseCompletionModal from './CourseCompletionModal';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { DragItem } from '@/types';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';

interface CourseCardProps {
  course?: PlannedCourse | null;
  onRemove?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  isOptimistic?: boolean;
  dragPreview?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onRemove,
  onViewDetails,
  compact = false
}) => {
  // Hooks must be called before any conditional returns
  const { updateCourseStatus } = usePlannerStore();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [_isUpdating, _setIsUpdating] = useState(false);
  const [_pendingStatusUpdate, _setPendingStatusUpdate] = useState<{
    status: PlannedCourse['status'];
    grade?: string;
  } | null>(null);
  const { success: _success, error: _error } = useEnhancedToast();
  
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'PLANNED_COURSE',
    item: {
      type: 'PLANNED_COURSE',
      id: course?.id || 0,
      course: course || {} as PlannedCourse,
      semesterId: course?.semesterId || 0
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => course?.status !== 'completed' // Don't allow dragging completed courses
  });
  
  // Early return if no course provided
  if (!course) {
    return null;
  }

  // Safe property access with fallbacks
  // const courseId = course.id || 0; // TODO: Use for course identification in future features
  const courseCode = course.code || 'Unknown';
  const courseTitle = course.title || 'No title available';
  const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
  const courseStatus = course.status || 'planned';
  const courseGrade = course.grade || null;
  // const courseSemesterId = course.semesterId || 0; // TODO: Use for semester-specific operations

  // Additional validation
  if (typeof course !== 'object') {
    return (
      <div className="p-3 rounded-lg border border-red-200 bg-red-50">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Invalid course data</span>
        </div>
      </div>
    );
  }  

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
              <DropdownMenuContent align="end" className="bg-white min-w-48 w-auto">
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
          <AnimatePresence>
            {(courseGrade || pendingStatusUpdate?.grade) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="outline" className="text-xs">
                  {pendingStatusUpdate?.grade || courseGrade}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
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