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
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Course } from '@/types/courses';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { usePrerequisiteValidation } from '@/hooks/usePrereqValidation';
import { cn } from '@/lib/utils';

interface CourseDetailsModalProps {
  course?: Course | null;
  isOpen?: boolean;
  onClose?: () => void;
  onAddCourse?: (course: Course) => void;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  isOpen = false,
  onClose,
  onAddCourse
}) => {

  const { semesters } = usePlannerStore();
  const { validatePrerequisites } = usePrerequisiteValidation();

  // Early return if no course provided
  if (!course || typeof course !== 'object') {
    return null;
  }

  // Safe property access with fallbacks
  const courseCode = course.code || 'Unknown';
  const courseTitle = course.title || 'No title available';
  const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
  const courseCollege = course.college || 'Unknown College';
  const courseDifficulty = typeof course.difficulty === 'number' ? course.difficulty : 0;
  const courseDescription = course.description || 'No description available';
  const coursePrerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
  const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };

  // Safe validation with error handling
  let validation;
  try {
    validation = validatePrerequisites ? validatePrerequisites(course) : {
      canAdd: true,
      missingPrereqs: [],
      isBlocked: false
    };
  } catch (error) {
    console.warn('Error validating prerequisites:', error);
    validation = {
      canAdd: true,
      missingPrereqs: [],
      isBlocked: false
    };
  }

  const { canAdd, missingPrereqs, isBlocked } = validation;

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100';
    if (difficulty <= 3) return 'text-yellow-600 bg-yellow-100';
    if (difficulty <= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Safe semester processing
  const safeSemesters = semesters && typeof semesters === 'object' ? semesters : {};
  const allPlannedCourses = Object.values(safeSemesters)
    .filter(semester => semester && Array.isArray(semester.courses))
    .flatMap(s => s.courses)
    .filter(c => c && typeof c === 'object');

  const completedCourses = allPlannedCourses.filter(c => c.status === 'completed');
  const plannedCourses = allPlannedCourses.filter(c => 
    c.status === 'planned' || c.status === 'in-progress'
  );

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleAddCourse = () => {
    if (onAddCourse && course) {
      onAddCourse(course);
    }
  };

  // Safe offerings display
  const offeringsText = [
    courseOfferings.fall && 'F',
    courseOfferings.spring && 'Sp',
    courseOfferings.summer && 'Su'
  ].filter(Boolean).join('/') || 'TBD';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg backdrop-blur-sm">
        <div className="bg-white rounded-lg">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 flex items-center">
                  {isBlocked && <Lock className="h-5 w-5 mr-2 text-red-600" />}
                  {courseCode} - {courseTitle}
                </DialogTitle>
                <DialogDescription className="text-base mt-1 text-slate-600">
                  {courseCredits} credits • {courseCollege}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
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
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-4 w-4 mr-1 text-slate-600" />
                  </div>
                  <div className={cn("text-lg font-bold px-2 py-1 rounded", getDifficultyColor(courseDifficulty))}>
                    {courseDifficulty} / 5
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Difficulty</div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <BookOpen className="h-4 w-4 mr-1 text-slate-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {courseCredits}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Credits</div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-4 w-4 mr-1 text-slate-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {offeringsText}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Offered</div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="bg-white">
              <h3 className="font-semibold text-slate-900 mb-2">
                Course Description
              </h3>
              <p className="text-slate-700 leading-relaxed">
                {courseDescription}
              </p>
            </div>

            {/* Prerequisites */}
            {coursePrerequisites.length > 0 && (
              <div className="bg-white">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Prerequisites
                </h3>
                <div className="space-y-3">
                  {coursePrerequisites.map((prereq, index) => (
                    <div key={index}>
                      {prereq?.type === "course" && Array.isArray(prereq.courses) && (
                        <div>
                          <p className="text-sm text-slate-600 mb-2">
                            Required courses{' '}
                            {prereq.logic === 'OR'
                              ? '(any one of)'
                              : '(all required)'}
                            :
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {prereq.courses.map((courseCode, courseIndex) => {
                              const isCompleted = completedCourses.some(
                                c => c?.code === courseCode);
                              const isPlanned = plannedCourses.some(
                                c => c?.code === courseCode);
                              const isMissing = !isCompleted && !isPlanned;
                              
                              return (
                                <Badge
                                  key={`${courseCode}-${courseIndex}`}
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
                                  ) : isMissing ? (
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
                {Array.isArray(missingPrereqs) && missingPrereqs.length > 0 && (
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 bg-white">
              <Button variant="outline" onClick={handleClose} className="bg-white border-gray-300 hover:bg-gray-50">
                Close
              </Button>
              <Button 
                onClick={handleAddCourse} 
                disabled={isBlocked || !canAdd}
                className={cn(
                  'flex items-center',
                  isBlocked
                    ? 'opacity-50 cursor-not-allowed bg-red-400 hover:bg-red-400'
                    : 'bg-[#003057] hover:bg-[#002041] text-white'
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;