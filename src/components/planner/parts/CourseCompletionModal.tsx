// CourseCompletionModal.tsx - With comprehensive safety checks
"use client";

import React, { useState, useRef } from 'react';
import { StandardizedModal, ModalActions } from '@/components/ui/standardized-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle,
  Clock,
  Calendar,
  Star,
  Award,
  AlertCircle
} from 'lucide-react';
import { PlannedCourse } from '@/types';
import { cn } from '@/lib/utils';

interface CourseCompletionModalProps {
  course?: PlannedCourse | null;
  isOpen?: boolean;
  onClose?: () => void;
  onUpdateStatus?: (courseId: number, semesterId: number, status: PlannedCourse['status'], grade?: string) => void;
}

const GRADES = ['A', 'B', 'C', 'D','F', 'W', 'I', 'IP'];

const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  course,
  isOpen = false,
  onClose,
  onUpdateStatus
}) => {
  // Hooks must be called before any conditional returns
  const [newStatus, setNewStatus] = useState<PlannedCourse['status']>(
    course?.status || 'planned'
  );
  const [selectedGrade, setSelectedGrade] = useState(
    course?.grade || ''
  );
  // Focus management - hooks must be called before any conditional returns
  const statusSelectRef = useRef<HTMLButtonElement>(null);

  // Early return if no course provided
  if (!course) {
    return null;
  }

  // Safe property access with fallbacks
  const courseId = typeof course.id === 'number' ? course.id : 0;
  const courseSemesterId = typeof course.semesterId === 'number' ? course.semesterId : 0;
  const courseCode = course.code || 'Unknown';
  const courseTitle = course.title || 'No title available';
  const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
  const courseDifficulty = typeof course.difficulty === 'number' ? course.difficulty : 0;
  const courseStatus = course.status || 'planned';
  // const courseGrade = course.grade || ''; // TODO: Use this for displaying current grade in UI


  const handleSave = () => {
    if (onUpdateStatus && typeof courseId === 'number' && typeof courseSemesterId === 'number') {
      onUpdateStatus(courseId, courseSemesterId, newStatus, selectedGrade || undefined);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const getStatusIcon = (status: PlannedCourse['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Calendar className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: PlannedCourse['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'in-progress':
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  const getGradeColor = (grade: string) => {
    if (!grade || typeof grade !== 'string') return 'text-slate-700 bg-slate-100';
    
    if (['A', 'A-'].includes(grade)) return 'text-green-700 bg-green-100';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-700 bg-blue-100';
    if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-700 bg-yellow-100';
    if (['D+', 'D', 'D-'].includes(grade)) return 'text-orange-700 bg-orange-100';
    if (grade === 'F') return 'text-red-700 bg-red-100';
    return 'text-slate-700 bg-slate-100';
  };

  const handleStatusChange = (value: string) => {
    if (['planned', 'in-progress', 'completed'].includes(value)) {
      setNewStatus(value as PlannedCourse['status']);
      // Reset grade if not completed
      if (value !== 'completed') {
        setSelectedGrade('');
      }
    }
  };

  const handleGradeChange = (value: string) => {
    if (GRADES.includes(value)) {
      setSelectedGrade(value);
    }
  };

  const isFormValid = newStatus !== 'completed' || selectedGrade !== '';

  return (
    <StandardizedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Course Status"
      description={`${courseCode} - ${courseTitle}`}
      size="sm"
      className="bg-white"
      initialFocus={statusSelectRef}
    >

        <div className="p-6 space-y-6">
          {/* Course Info */}
          <Card className={cn("transition-colors", getStatusColor(courseStatus))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(courseStatus)}
                  <span className="font-semibold text-slate-900">{courseCode}</span>
                </div>
                <Badge variant="secondary">{courseCredits} credits</Badge>
              </div>
              <p className="text-sm text-slate-700 mb-3">{courseTitle}</p>
              <div className="flex items-center space-x-4 text-xs text-slate-600">
                {courseDifficulty > 0 && (
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Difficulty {courseDifficulty}/5
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                Course Status
              </Label>
              <Select value={newStatus} onValueChange={handleStatusChange}>
                <SelectTrigger 
                  ref={statusSelectRef}
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="mt-1 bg-white">
                  <SelectItem value="planned">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Planned</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Selection (only for completed courses) */}
            {newStatus === 'completed' && (
              <div>
                <Label htmlFor="grade" className="text-sm font-medium text-slate-700">
                  Final Grade
                </Label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent className="mt-1 bg-white">
                    {GRADES.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn("text-xs", getGradeColor(grade))}>
                            {grade}
                          </Badge>
                          <span>{grade}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Status Preview */}
          <Card className={cn("transition-colors", getStatusColor(newStatus))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(newStatus)}
                  <span className="font-medium text-slate-900">
                    {newStatus === 'completed' ? 'Completed' : 
                     newStatus === 'in-progress' ? 'In Progress' : 'Planned'}
                  </span>
                </div>
                {newStatus === 'completed' && selectedGrade && (
                  <Badge className={cn("text-sm", getGradeColor(selectedGrade))}>
                    <Award className="h-3 w-3 mr-1" />
                    {selectedGrade}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Validation Warning */}
          {newStatus === 'completed' && !selectedGrade && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              Please select a grade for completed courses
            </div>
          )}

        </div>
        
        <ModalActions>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#003057] hover:bg-[#b3a369] text-white"
            disabled={!isFormValid}
          >
            Update Status
          </Button>
        </ModalActions>
    </StandardizedModal>
  );
};

export default CourseCompletionModal;