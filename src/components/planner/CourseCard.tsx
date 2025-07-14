"use client";

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  Clock,
  Calendar,
  Star,
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Info
} from 'lucide-react';
import { PlannedCourse } from '@/types/courses';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CourseCompletionModal from '@/components/roadmap/CourseCompletionModal';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { DragTypes, DragItem } from '@/types/dndtypes';

interface CourseCardProps {
  course: PlannedCourse;
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

  // React DnD drag setup
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DragTypes.PLANNED_COURSE,
    item: {
      type: DragTypes.PLANNED_COURSE,
      id: course.id,
      course: course,
      semesterId: course.semesterId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => course.status !== 'completed' // Don't allow dragging completed courses
  });

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

  return (
    <>
      <motion.div
        ref={drag as any}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          "group relative p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
          getStatusColor(course.status),
          compact ? "p-2" : "p-3",
          isDragging ? "opacity-50 cursor-grabbing" : "cursor-move",
          course.status === 'completed' && "cursor-default"
        )}
        onClick={onViewDetails}
        style={{
          opacity: isDragging ? 0.5 : 1
        }}
      >
        {/* Status Indicator */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
          onClick={handleStatusClick}
        >
          {getStatusIcon(course.status)}
        </Button>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GripVertical className={cn(
              "h-3 w-3 text-slate-400 transition-opacity",
              course.status === 'completed' ? "opacity-30" : "opacity-50 group-hover:opacity-100"
            )} />
            <span className={cn(
              "font-bold text-slate-900", 
              compact ? "text-sm" : "text-sm", 
              course.status === "completed" && "line-through opacity-60"
            )}>
              {course.code}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="secondary" className="text-xs">{course.credits}cr</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setShowCompletionModal(true);
                }}>
                  <Edit className="h-3 w-3 mr-2" />
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.();
                }}>
                  <Info className="h-3 w-3 mr-2" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
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
          course.status === 'completed' && "opacity-60"
        )}>
          {course.title}
        </p>
        
        <div className="flex items-center justify-between">
          {course.grade && (
            <Badge variant="outline" className="text-xs">
              {course.grade}
            </Badge>
          )}
          
          {course.threads && course.threads.length > 0 && (
            <div className="flex space-x-1">
              {course.threads.slice(0, 1).map((thread: string) => (
                <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369] px-1">
                  {thread.slice(0, 3)}
                </Badge>
              ))}
            </div>
          )}

          {!course.grade && !course.threads?.length && (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="flex items-center">
                <Star className="h-2.5 w-2.5 mr-1" />
                {course.difficulty}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Course Completion Modal */}
      {showCompletionModal && (
        <CourseCompletionModal
          course={course}
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          onUpdateStatus={(courseId, semesterId, status, grade) => {
            updateCourseStatus(courseId, semesterId, status, grade);
            setShowCompletionModal(false);
          }}
        />
      )}
    </>
  );
};

export default CourseCard;