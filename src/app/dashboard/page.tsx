"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  TrendingUp,
  Calendar,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Award,
  GraduationCap,
  FileText,
  BookCheck,
  Trophy,
  Zap
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRequirements } from '@/hooks/useRequirements';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';
import { getFirstName } from '@/lib/userUtils';
import { DashboardDeadlines } from '@/components/dashboard/parts/DashboardDeadlines';
import GPATrendChart from '@/components/dashboard/parts/GPATrendChart';
import ThreadProgressChart from '@/components/dashboard/parts/ThreadProgressChart';
import { CourseRecommendationsAI } from '@/components/planner/CourseRecommendationsAI';

function DashboardContent() {
  const { user } = useAuth();
  const plannerStore = useUserAwarePlannerStore();
  const { userProfile, semesters } = plannerStore;

  // Load real dashboard data
  const dashboardData = useDashboardData();
  const { progressSummary } = useRequirements();

  // Get courses data
  const completedCourses = plannerStore.getCoursesByStatus('completed');
  const plannedCourses = plannerStore.getCoursesByStatus('planned');
  const inProgressCourses = plannerStore.getCoursesByStatus('in-progress');

  // Calculate stats
  const totalCompletedCredits = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const currentGPA = plannerStore.calculateGPA();

  // Calculate new stats
  const totalCreditsRequired = progressSummary?.totalCreditsRequired || 126;
  const creditsRemaining = Math.max(0, totalCreditsRequired - totalCompletedCredits);
  const graduationProgressPercentage = totalCreditsRequired > 0
    ? Math.min((totalCompletedCredits / totalCreditsRequired) * 100, 100)
    : 0;

  // Calculate semesters left
  const graduationYear = userProfile?.graduation_year || new Date().getFullYear() + 2;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSeason = currentMonth >= 8 ? 0 : currentMonth >= 5 ? 2 : 1; // Fall=0, Spring=1, Summer=2
  const graduationSeason = 1; // Assume Spring graduation
  const semestersLeft = Math.max(0,
    ((graduationYear - currentYear) * 2) +
    (graduationSeason === 1 ? 1 : 0) -
    (currentSeason === 0 ? 0 : currentSeason === 1 ? 1 : 0)
  );

  // Determine on-track status
  const expectedProgress = semestersLeft > 0 ? ((8 - semestersLeft) / 8) * 100 : 100;
  const isOnTrack = graduationProgressPercentage >= expectedProgress * 0.85;

  // Get upcoming deadlines count
  const upcomingDeadlinesCount = dashboardData.upcomingDeadlines.filter(d => {
    const daysLeft = Math.ceil((new Date(d.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  // Get user display name - show first name only
  const userName = getFirstName(userProfile, user?.email);

  // Process GPA history for chart
  const gpaHistory = useMemo(() => {
    if (!dashboardData.gpaHistory || dashboardData.gpaHistory.length === 0) {
      // Generate sample data from completed courses if no history exists
      const semesterMap = new Map<string, { totalPoints: number; totalCredits: number }>();

      Object.values(semesters).forEach(semester => {
        if (!semester || !semester.courses) return;

        const completedInSemester = semester.courses.filter(c =>
          c.status === 'completed' && c.grade
        );

        if (completedInSemester.length > 0) {
          const gradeToGPA: Record<string, number> = {
            'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
          };

          const totalPoints = completedInSemester.reduce((sum, course) => {
            const gpa = gradeToGPA[course.grade || 'A'] || 4.0;
            return sum + (gpa * (course.credits || 3));
          }, 0);

          const totalCredits = completedInSemester.reduce((sum, course) =>
            sum + (course.credits || 3), 0
          );

          if (totalCredits > 0) {
            semesterMap.set(semester.name || `Semester ${semester.id}`, {
              totalPoints,
              totalCredits
            });
          }
        }
      });

      return Array.from(semesterMap.entries()).map(([semester, data]) => ({
        semester,
        gpa: data.totalCredits > 0 ? data.totalPoints / data.totalCredits : 0,
        credits: data.totalCredits,
        year: parseInt(semester.match(/\d{4}/)?.[0] || new Date().getFullYear().toString())
      }));
    }

    return dashboardData.gpaHistory;
  }, [dashboardData.gpaHistory, semesters]);

  // Calculate thread progress
  const threadProgress = useMemo(() => {
    const threads = userProfile?.threads || [];
    if (threads.length === 0) return [];

    // This would need to be enhanced with actual thread requirement data
    // For now, we'll show basic progress based on completed courses
    return threads.map(thread => ({
      name: thread,
      completed: Math.floor(totalCompletedCredits * 0.3), // Simplified calculation
      required: 36,
      percentage: Math.min((Math.floor(totalCompletedCredits * 0.3) / 36) * 100, 100)
    }));
  }, [userProfile?.threads, totalCompletedCredits]);

  // Enhanced activity feed with more event types
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string;
      type: 'course_completed' | 'requirement_met' | 'gpa_improved' | 'course_added' | 'semester_planned';
      title: string;
      description: string;
      timestamp: Date;
      icon: React.ReactNode;
    }> = [];

    // Add completed courses
    completedCourses.slice(0, 3).forEach((course, index) => {
      activities.push({
        id: `completed-${course.code}-${index}`,
        type: 'course_completed',
        title: `Completed ${course.code}`,
        description: course.title || 'Course completed successfully',
        timestamp: new Date(Date.now() - index * 86400000), // Stagger dates
        icon: <CheckCircle className="h-5 w-5 text-green-600" />
      });
    });

    // Add requirement completion activities
    if (progressSummary && progressSummary.requirementProgress) {
      progressSummary.requirementProgress
        .filter(req => req.status === 'completed')
        .slice(0, 2)
        .forEach((req, index) => {
          activities.push({
            id: `requirement-${req.requirement.id}-${index}`,
            type: 'requirement_met',
            title: 'Requirement Completed',
            description: req.requirement.requirementName,
            timestamp: new Date(Date.now() - (index + 3) * 86400000),
            icon: <Award className="h-5 w-5 text-purple-600" />
          });
        });
    }

    // Add GPA improvement if applicable
    if (currentGPA >= 3.5) {
      activities.push({
        id: 'gpa-improved',
        type: 'gpa_improved',
        title: 'Outstanding GPA',
        description: `Current GPA: ${currentGPA.toFixed(2)}`,
        timestamp: new Date(Date.now() - 5 * 86400000),
        icon: <Trophy className="h-5 w-5 text-yellow-600" />
      });
    }

    // Add planned courses activity
    if (plannedCourses.length > 0) {
      activities.push({
        id: 'courses-planned',
        type: 'semester_planned',
        title: 'Courses Planned',
        description: `${plannedCourses.length} courses added to upcoming semesters`,
        timestamp: new Date(Date.now() - 7 * 86400000),
        icon: <Calendar className="h-5 w-5 text-blue-600" />
      });
    }

    // Add in-progress courses
    inProgressCourses.slice(0, 2).forEach((course, index) => {
      activities.push({
        id: `in-progress-${course.code}-${index}`,
        type: 'course_added',
        title: `Currently Taking ${course.code}`,
        description: course.title || 'Course in progress',
        timestamp: new Date(Date.now() - (index + 10) * 86400000),
        icon: <BookOpen className="h-5 w-5 text-orange-600" />
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [completedCourses, progressSummary, currentGPA, plannedCourses, inProgressCourses]);

  // Format deadlines for DashboardDeadlines component
  const formattedDeadlines = useMemo(() => {
    return dashboardData.upcomingDeadlines.map(deadline => ({
      ...deadline,
      daysLeft: Math.ceil((new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }));
  }, [dashboardData.upcomingDeadlines]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gt-navy flex items-center gap-3">
            <Home className="h-6 w-6 sm:h-8 sm:w-8 text-gt-gold flex-shrink-0" />
            <span className="truncate">Welcome back, {userName}!</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Here&apos;s your academic progress overview
          </p>
        </div>
        <Badge className="bg-gt-gold text-gt-navy px-3 py-1 text-sm font-medium">
          {userProfile?.major || 'Major Not Set'}
        </Badge>
      </div>

      {/* Enhanced Quick Stats Grid - 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-gt-gold hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current GPA</p>
                  <p className="text-2xl font-bold text-gt-navy">
                    {currentGPA.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gt-gold" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Completed</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalCompletedCredits}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Graduation Progress</p>
                  <p className="text-2xl font-bold text-gt-navy">
                    {graduationProgressPercentage.toFixed(0)}%
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Remaining</p>
                  <p className="text-2xl font-bold text-gt-navy">{creditsRemaining}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className={`hover:shadow-md transition-shadow border-l-4 ${isOnTrack ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Track Status</p>
                  <p className="text-lg font-bold text-gt-navy">
                    {isOnTrack ? 'On Track' : 'Needs Attention'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{semestersLeft} semesters left</p>
                </div>
                <Zap className={`h-8 w-8 ${isOnTrack ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                  <p className="text-2xl font-bold text-gt-navy">{upcomingDeadlinesCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GPATrendChart gpaHistory={gpaHistory} delay={0.2} />
        <ThreadProgressChart threadProgress={threadProgress} delay={0.3} />
      </div>

      {/* Recommendations and Deadlines - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <CourseRecommendationsAI userProfile={userProfile} />
        </div>
        <div className="lg:col-span-1">
          <DashboardDeadlines deadlines={formattedDeadlines} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy flex items-center gap-2">
                <BookCheck className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {activity.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gt-navy text-sm">{activity.title}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.timestamp.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge
                        className={`flex-shrink-0 ${
                          activity.type === 'course_completed' ? 'bg-green-100 text-green-800' :
                          activity.type === 'requirement_met' ? 'bg-purple-100 text-purple-800' :
                          activity.type === 'gpa_improved' ? 'bg-yellow-100 text-yellow-800' :
                          activity.type === 'semester_planned' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {activity.type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity yet</p>
                    <p className="text-sm mt-1">Start planning courses to see your activity here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-gt-navy hover:bg-gt-navy-700 justify-start"
                onClick={() => window.location.href = '/planner'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Plan Courses
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/courses'}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Explore Courses
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/requirements'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Requirements
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/record'}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Academic Record
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/opportunities'}
              >
                <Award className="h-4 w-4 mr-2" />
                Explore Opportunities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AsyncErrorBoundary context="dashboard">
      <DashboardContent />
    </AsyncErrorBoundary>
  );
}
