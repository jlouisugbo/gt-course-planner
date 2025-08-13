import React from 'react';
import { StandardizedModal } from '@/components/ui/standardized-modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VisualCourse } from '@/types/requirements';
import { BookOpen, FileText, Users } from 'lucide-react';

interface RequirementsCourseModalProps {
  course: VisualCourse;
  isOpen: boolean;
  onClose: () => void;
  footnotes?: { id: number; text: string }[];
}

export const RequirementsCourseModal: React.FC<RequirementsCourseModalProps> = ({
  course,
  isOpen,
  onClose,
  footnotes = []
}) => {
  return (
    <StandardizedModal
      isOpen={isOpen}
      onClose={onClose}
      title={course.code}
      description={course.title}
      size="lg"
    >

        <div className="p-6 space-y-6">
          {/* Course Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="text-sm">
                  {course.credits} Credits
                </Badge>
                
                {course.type !== 'regular' && (
                  <Badge variant="outline" className="text-sm">
                    {course.type === 'or_group' ? 'OR Group' :
                     course.type === 'and_group' ? 'AND Group' :
                     course.type === 'selection' ? 'Selection' :
                     'Flexible Requirement'}
                  </Badge>
                )}
                
                {course.selectionCount && (
                  <Badge variant="secondary" className="text-sm">
                    Choose {course.selectionCount}
                  </Badge>
                )}
              </div>

              {course.description && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OR Group Courses */}
          {course.type === 'or_group' && course.courses && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Course Options (Choose One)
                </h4>
                <div className="space-y-3">
                  {course.courses.map((groupCourse, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-sm">{groupCourse.code}</h5>
                          <p className="text-sm text-muted-foreground">{groupCourse.title}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {groupCourse.credits} cr
                        </Badge>
                      </div>
                      
                      {groupCourse.description && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {groupCourse.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Courses */}
          {course.type === 'selection' && course.courses && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Available Courses {course.selectionCount && `(Choose ${course.selectionCount})`}
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {course.courses.map((selectionCourse, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h5 className="font-semibold text-sm">{selectionCourse.code}</h5>
                          <p className="text-xs text-muted-foreground">{selectionCourse.title}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {selectionCourse.credits} cr
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footnotes */}
          {course.footnoteRefs && course.footnoteRefs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Important Notes</h4>
                <div className="space-y-2">
                  {course.footnoteRefs.map(ref => {
                    const footnote = footnotes.find(f => f.id === ref);
                    return footnote ? (
                      <div key={ref} className="flex gap-3 p-2 bg-muted/50 rounded">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ref}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {footnote.text}
                        </p>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </StandardizedModal>
  );
};