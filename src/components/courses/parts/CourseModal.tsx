import React, { useState, useRef } from 'react';
import { StandardizedModal } from '@/components/ui/standardized-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course } from '@/types';
import { SemesterSelector } from '../SemesterSelector';
import {
  Calendar,
  AlertCircle,
  FileText,
  Network,
  Plus
} from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSemesterSelector, setShowSemesterSelector] = useState(false);
  // Focus management - hooks must be called before any conditional returns
  const addButtonRef = useRef<HTMLButtonElement>(null);

  if (!course) return null;

  const getOfferedSemesters = () => {
    const semesters = [];
    if (course.offerings?.fall) semesters.push('Fall');
    if (course.offerings?.spring) semesters.push('Spring');
    if (course.offerings?.summer) semesters.push('Summer');
    return semesters;
  };

  const formatCourseType = (type: string) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Course';
  };

  return (
    <>
    <StandardizedModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${course.code} - ${course.title}`}
      size="xl"
      initialFocus={addButtonRef}
    >

        <div className="p-6">
          <div className="flex justify-end mb-4">
            <Button
              ref={addButtonRef}
              variant="outline"
              size="sm"
              onClick={() => setShowSemesterSelector(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Plan
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#B3A369]">{course.credits || 3}</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-[#003057] capitalize">{formatCourseType(course.course_type || 'elective')}</div>
                  <div className="text-sm text-muted-foreground">Type</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{course.college || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">College</div>
                </CardContent>
              </Card>
            </div>

            {/* Course Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{course.description || 'No description available'}</p>
              </CardContent>
            </Card>

            {/* Semesters Offered */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Offered Semesters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {getOfferedSemesters().length > 0 ? (
                    getOfferedSemesters().map((semester) => (
                      <Badge key={semester} variant="default" className="text-sm">
                        {semester}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-sm text-muted-foreground">
                      Schedule varies by semester
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prerequisites" className="space-y-6 mt-6">
            {course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Prerequisites
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {course.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">
                            {typeof prereq === 'string' ? prereq : prereq.courses?.join(' OR ') || 'N/A'}
                          </span>
                          {typeof prereq !== 'string' && prereq.logic && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Logic: {prereq.logic}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Prerequisites</h3>
                  <p className="text-muted-foreground">This course has no prerequisite requirements.</p>
                </CardContent>
              </Card>
            )}

            {course.postrequisites && Array.isArray(course.postrequisites) && course.postrequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-500" />
                    Unlocks These Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {course.postrequisites.map((postreq, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div>
                          <span className="font-medium">{postreq}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {['Fall 2024', 'Spring 2025', 'Summer 2025'].map((semester) => (
                      <div key={semester} className="p-4 border rounded-lg text-center">
                        <h4 className="font-semibold mb-2">{semester}</h4>
                        <Badge 
                          variant={
                            (semester.includes('Fall') && course.offerings?.fall) ||
                            (semester.includes('Spring') && course.offerings?.spring) ||
                            (semester.includes('Summer') && course.offerings?.summer)
                              ? 'default' : 'secondary'
                          }
                        >
                          {(semester.includes('Fall') && course.offerings?.fall) ||
                           (semester.includes('Spring') && course.offerings?.spring) ||
                           (semester.includes('Summer') && course.offerings?.summer)
                            ? 'Offered' : 'Not Offered'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
    </StandardizedModal>

    <SemesterSelector
      course={course}
      isOpen={showSemesterSelector}
      onClose={() => setShowSemesterSelector(false)}
    />
    </>
  );
};