"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';
import { cn } from '@/lib/utils';

export const AcademicTimeline: React.FC = () => {
  const plannerStore = useUserAwarePlannerStore();
  const { semesters } = plannerStore as any;
  const userProfile = (plannerStore as any).userProfile;

  const safeSemesters = useMemo(() => {
    return semesters && typeof semesters === 'object' ? semesters : {};
  }, [semesters]);

  const safeUserProfile = useMemo(() => {
    return userProfile && typeof userProfile === 'object' ? userProfile : null;
  }, [userProfile]);

  // Process semesters into timeline format
  const timelineData = useMemo(() => {
    type TimelineSemester = {
      id?: number;
      year: number;
      season: 'Fall' | 'Spring' | 'Summer' | string;
      isCompleted?: boolean;
      isActive?: boolean;
      totalCredits?: number;
      courses?: any[];
    };
    const values = Object.values(safeSemesters as Record<string, TimelineSemester>);
    const semesterArray = values
      .filter((semester): semester is TimelineSemester =>
        !!semester &&
        typeof semester === 'object' &&
        typeof (semester as any).year === 'number' &&
        typeof (semester as any).season === 'string'
      )
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
        return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
      });

    return semesterArray.map((semester, index) => ({
      ...semester,
      isFirst: index === 0,
      isLast: index === semesterArray.length - 1,
      isPast: Boolean(semester.isCompleted),
      isCurrent: Boolean(semester.isActive),
      semesterLabel: `${semester.season} ${semester.year}`,
      totalCredits: typeof semester.totalCredits === 'number' ? semester.totalCredits : 0,
      courses: Array.isArray(semester.courses) ? semester.courses : []
    }));
  }, [safeSemesters]);

  const overallProgress = useMemo(() => {
    if (timelineData.length === 0) return 0;
    const completedSemesters = timelineData.filter(sem => sem.isPast).length;
    return Math.round((completedSemesters / timelineData.length) * 100);
  }, [timelineData]);

  const totalCreditsCompleted = useMemo(() => {
    return timelineData
      .filter(sem => sem.isPast)
      .reduce((sum, sem) => sum + sem.totalCredits, 0);
  }, [timelineData]);

  const totalCreditsPlanned = useMemo(() => {
    return timelineData.reduce((sum, sem) => sum + sem.totalCredits, 0);
  }, [timelineData]);

  if (timelineData.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Timeline Data</h3>
          <p className="text-sm text-muted-foreground text-center">
            Set up your academic profile to generate your timeline
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card className="border-l-4 border-l-[#B3A369]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-[#B3A369]" />
            Academic Timeline
          </CardTitle>
          {safeUserProfile && (
            <div className="text-sm text-muted-foreground">
              {safeUserProfile.major} • Expected Graduation: {safeUserProfile.expectedGraduation || 'TBD'}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#003057]">{overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
              <Progress value={overallProgress} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalCreditsCompleted}</div>
              <div className="text-sm text-muted-foreground">Credits Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#B3A369]">{totalCreditsPlanned}</div>
              <div className="text-sm text-muted-foreground">Total Credits Planned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#003057] via-[#B3A369] to-[#003057]" />

        <div className="space-y-6">
          {timelineData.map((semester, index) => (
            <motion.div
              key={semester.id || `${semester.season}-${semester.year}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-6 w-4 h-4 rounded-full border-4 bg-white z-10",
                semester.isPast && "border-green-500 bg-green-500",
                semester.isCurrent && "border-[#B3A369] bg-[#B3A369] ring-4 ring-[#B3A369]/20",
                !semester.isPast && !semester.isCurrent && "border-gray-300"
              )}>
                {semester.isPast && (
                  <CheckCircle2 className="absolute -inset-1 h-6 w-6 text-green-500" />
                )}
                {semester.isCurrent && (
                  <Clock className="absolute -inset-1 h-6 w-6 text-[#B3A369]" />
                )}
              </div>

              {/* Semester card */}
              <div className="ml-16">
                <Card className={cn(
                  "transition-all duration-200",
                  semester.isCurrent && "border-[#B3A369] shadow-lg",
                  semester.isPast && "border-green-200 bg-green-50/30"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={cn(
                        "text-lg",
                        semester.isCurrent && "text-[#B3A369]",
                        semester.isPast && "text-green-700"
                      )}>
                        {semester.semesterLabel}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {semester.isCurrent && (
                          <Badge className="bg-[#B3A369] text-white">
                            Current
                          </Badge>
                        )}
                        {semester.isPast && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {semester.totalCredits} credits
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {semester.courses.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {semester.courses.length} courses planned
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {semester.courses.slice(0, 6).map((course: any, courseIndex: number) => (
                            <div
                              key={course.id || courseIndex}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                semester.isPast && "bg-green-50 border-green-200",
                                semester.isCurrent && "bg-yellow-50 border-yellow-200",
                                !semester.isPast && !semester.isCurrent && "bg-gray-50 border-gray-200"
                              )}
                            >
                              <div className="font-medium text-[#003057]">
                                {course.code || 'Unknown Course'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {course.title || 'Course Title'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {course.credits || 3} credits
                              </div>
                            </div>
                          ))}
                          {semester.courses.length > 6 && (
                            <div className="p-3 rounded-lg border border-dashed border-gray-300 text-sm text-muted-foreground text-center">
                              +{semester.courses.length - 6} more courses
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No courses planned</p>
                      </div>
                    )}

                    {/* Semester warnings */}
                    {semester.totalCredits > 18 && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-xs text-orange-800">
                          Heavy course load ({semester.totalCredits} credits)
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Graduation marker */}
        {timelineData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: timelineData.length * 0.1 + 0.5 }}
            className="relative mt-8"
          >
            <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-[#B3A369] bg-[#B3A369] z-10">
              <Trophy className="absolute -inset-2 h-8 w-8 text-[#B3A369]" />
            </div>
            <div className="ml-16">
              <Card className="border-[#B3A369] bg-gradient-to-r from-[#B3A369]/10 to-[#003057]/10">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-[#B3A369]" />
                  <h3 className="text-xl font-bold text-[#003057] mb-2">Graduation</h3>
                  <p className="text-muted-foreground">
                    Expected: {safeUserProfile?.expectedGraduation || 'TBD'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-[#003057]">{totalCreditsPlanned}</span>
                      <span className="text-muted-foreground"> total credits</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#003057]">{timelineData.length}</span>
                      <span className="text-muted-foreground"> semesters</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};