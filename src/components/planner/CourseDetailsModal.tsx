"use client";

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen,
  Clock,
  Star,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Target,
  Link as LinkIcon,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Course } from '@/types/courses';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { usePrerequisiteValidation } from '@/hooks/usePrereqValidation';
import { cn } from '@/lib/utils';

interface CourseDetailsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  isOpen,
  onClose,
  onAddCourse
}) => {
  const { semesters } = usePlannerStore();
  const { validatePrerequisites } = usePrerequisiteValidation();

  const validation = validatePrerequisites(course);
  const { canAdd, missingPrereqs, isBlocked } = validation;

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100';
    if (difficulty <= 3) return 'text-yellow-600 bg-yellow-100';
    if (difficulty <= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const allPlannedCourses = Object.values(semesters).flatMap(s => s.courses);
  const completedCourses = allPlannedCourses.filter(c => c.status === 'completed');
  const plannedCourses = allPlannedCourses.filter(c => c.status === 'planned' || c.status === 'in-progress');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center">
                {isBlocked && <Lock className="h-5 w-5 mr-2 text-red-600" />}
                {course.code} - {course.title}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {course.credits} credits • {course.college}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prerequisite Status Alert */}
          {isBlocked && (
            <Alert className="border-red-200 bg-red-50">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Cannot add course: </strong> You have unmet prerequisites.
              </AlertDescription>
            </Alert>
          )}

          {/* Course Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-4 w-4 mr-1 text-slate-600" />
                </div>
                <div className={cn("text-lg font-bold px-2 py-1 rounded", getDifficultyColor(course.difficulty))}>
                  {course.difficulty} / 5
                </div>
                <div className="text-xs text-slate-600 mt-1">Difficulty</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-4 w-4 mr-1 text-slate-600" />
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {course.credits}
                </div>
                <div className="text-xs text-slate-600 mt-1">Credits</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-4 w-4 mr-1 text-slate-600" />
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {[
                    course.offerings.fall && 'F',
                    course.offerings.spring && 'Sp',
                    course.offerings.summer && 'Su'
                  ].filter(Boolean).join('/')}
                </div>
                <div className="text-xs text-slate-600 mt-1">Offered</div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Course Description
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Prerequisites */}
          {course.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">
                Prerequisites
              </h3>
              <div className="space-y-3">
                {course.prerequisites.map((prereq, index) => (
                  <div key={index}>
                    {prereq.type === "course" && prereq.courses && (
                      <div>
                        <p className="text-sm text-slate-600 mb-2">
                          Required courses{' '}
                          {prereq.logic === 'OR'
                            ? '(any one of)'
                            : '(all required)'}
                          :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {prereq.courses.map(courseCode => {
                            const isCompleted = completedCourses.some(
                              c => c.code === courseCode);
                            const isPlanned = plannedCourses.some(
                              c => c.code === courseCode);
                            const isMissing = !isCompleted && !isPlanned;
                            
                            return (
                              <Badge
                                key={courseCode} 
                                variant={isCompleted ? "default" : isMissing ? "destructive" : "secondary"}
                                className={cn(
                                  'flex items-center space-x-1',
                                  isCompleted
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : isMissing
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-3 w-3" />
                                )
                                : isMissing ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                <span>{courseCode}</span>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Missing Prerequisites Details */}
              {missingPrereqs.length > 0 && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <Lock className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <p>
                        <strong>Missing Prerequisites: </strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {missingPrereqs.map((prereq, index) => (
                          <li key={index} className="text-sm">
                            {prereq}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm mt-2">
                        <strong>Next Steps: </strong>Add these courses to your plan first, or mark them as completed if you&apos;ve already taken them.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* CS Threads */}
          {course.threads && course.threads.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">CS Threads</h3>
              <div className="flex flex-wrap gap-2">
                {course.threads.map(thread => (
                  <Badge key={thread} className="bg-[#B3A369] text-white">
                    <Target className="h-3 w-3 mr-1" />
                    {thread}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Instructors */}
          {course.instructors && course.instructors.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Instructors</h3>
              <div className="flex flex-wrap gap-2">
                {course.instructors.map(instructor => (
                  <Badge key={instructor} variant="outline" className="border-slate-300">
                    <Users className="h-3 w-3 mr-1" />
                    {instructor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Course Attributes */}
          {course.attributes && course.attributes.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Course Attributes</h3>
              <div className="flex flex-wrap gap-2">
                {course.attributes.map(attribute => (
                  <Badge key={attribute} variant="secondary" className="bg-slate-100 text-slate-700">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    {attribute}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => onAddCourse(course)} 
              disabled={isBlocked || !canAdd}
              className={cn(
                'flex items-center',
                isBlocked
                  ? 'opacity-50 cursor-not-allowed bg-red-400 hover:bg-red-400'
                  : 'bg-[#003057] hover:bg-[#002041]'
              )}
            >
              {isBlocked ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Prerequisites Not Met
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;