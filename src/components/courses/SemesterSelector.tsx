import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Check, AlertCircle } from 'lucide-react';
import { Course } from '@/types';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { toast } from 'sonner';

interface SemesterSelectorProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  course,
  isOpen,
  onClose
}) => {
  const { semesters, addCourseToSemester, getAllCourses } = usePlannerStore();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

  // Convert semesters object to array and sort chronologically
  const semesterArray = Object.values(semesters).sort((a, b) => a.id - b.id);

  // Check if course is already in any semester
  const allCourses = getAllCourses();
  const courseInSemester = allCourses.find(c => c.code === course.code);

  const handleAddCourse = () => {
    if (!selectedSemesterId) {
      toast.error('Please select a semester');
      return;
    }

    const semester = semesters[selectedSemesterId];
    if (!semester) {
      toast.error('Invalid semester selected');
      return;
    }

    // Check if course already exists in this semester
    if (semester.courses.some(c => c.code === course.code)) {
      toast.error('This course is already in the selected semester');
      return;
    }

    // Add course to semester
    addCourseToSemester({
      id: course.id,
      code: course.code,
      title: course.title,
      credits: course.credits || 3,
      description: course.description,
      semesterId: selectedSemesterId,
      status: 'planned',
      prerequisites: course.prerequisites,
      college: course.college,
      offerings: course.offerings,
      difficulty: course.difficulty,
      course_type: course.course_type,
      department: course.department,
      type: course.type
    });

    toast.success(`Added ${course.code} to ${semester.season} ${semester.year}`);
    onClose();
  };

  const getSemesterLabel = (semester: typeof semesterArray[0]) => {
    return `${semester.season} ${semester.year}`;
  };

  const isSemesterCurrent = (semester: typeof semesterArray[0]) => {
    return semester.isCurrentSemester;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gt-gold" />
            Add to Semester
          </DialogTitle>
          <DialogDescription>
            Select which semester to add <span className="font-semibold">{course.code}</span> to your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {courseInSemester && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                This course is already in your plan ({courseInSemester.season} {courseInSemester.year}).
                Adding it again will create a duplicate.
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {semesterArray.map((semester) => {
                const isSelected = selectedSemesterId === semester.id;
                const isCurrent = isSemesterCurrent(semester);
                const hasCourse = semester.courses.some(c => c.code === course.code);

                return (
                  <button
                    key={semester.id}
                    onClick={() => setSelectedSemesterId(semester.id)}
                    disabled={hasCourse}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-gt-gold bg-gt-gold/5 shadow-md'
                        : 'border-gray-200 hover:border-gt-gold/50 hover:bg-gray-50'
                      }
                      ${hasCourse ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isCurrent ? 'ring-2 ring-gt-navy/20' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gt-navy">
                            {getSemesterLabel(semester)}
                          </span>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {hasCourse && (
                            <Badge variant="secondary" className="text-xs">
                              Already Added
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {semester.courses.length} course{semester.courses.length !== 1 ? 's' : ''} • {semester.totalCredits} credits
                        </div>
                      </div>
                      {isSelected && !hasCourse && (
                        <Check className="h-5 w-5 text-gt-gold" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCourse}
              disabled={!selectedSemesterId}
              className="flex-1 bg-gt-gold hover:bg-gt-gold/90 text-white"
            >
              Add to Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
