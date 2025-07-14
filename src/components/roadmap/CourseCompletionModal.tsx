"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  BookOpen,
  Award,
  X
} from 'lucide-react';
import { PlannedCourse } from '@/types/courses';
import { cn } from '@/lib/utils';

interface CourseCompletionModalProps {
  course: PlannedCourse;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (courseId: string, semesterId: string, status: PlannedCourse['status'], grade?: string) => void;
}

const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'W', 'I', 'IP'];

const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  course,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const [newStatus, setNewStatus] = useState<PlannedCourse['status']>(course.status);
  const [selectedGrade, setSelectedGrade] = useState(course.grade || '');

  const handleSave = () => {
    onUpdateStatus(course.id, course.semesterId, newStatus, selectedGrade || undefined);
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
    if (['A', 'A-'].includes(grade)) return 'text-green-700 bg-green-100';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-700 bg-blue-100';
    if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-700 bg-yellow-100';
    if (['D+', 'D', 'D-'].includes(grade)) return 'text-orange-700 bg-orange-100';
    if (grade === 'F') return 'text-red-700 bg-red-100';
    return 'text-slate-700 bg-slate-100';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Update Course Status
              </DialogTitle>
              <DialogDescription className="mt-1">
                {course.code} - {course.title}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <Card className={cn("transition-colors", getStatusColor(course.status))}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(course.status)}
                  <span className="font-semibold text-slate-900">{course.code}</span>
                </div>
                <Badge variant="secondary">{course.credits} credits</Badge>
              </div>
              <p className="text-sm text-slate-700 mb-3">{course.title}</p>
              <div className="flex items-center space-x-4 text-xs text-slate-600">
                <span className="flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  Difficulty {course.difficulty}/5
                </span>
                {course.workload && (
                  <span className="flex items-center">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {course.workload}h/week
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
              <Select value={newStatus} onValueChange={(value: PlannedCourse['status']) => setNewStatus(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[#003057] hover:bg-[#002041]"
              disabled={newStatus === 'completed' && !selectedGrade}
            >
              Update Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCompletionModal;