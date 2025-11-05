"use client";

import React from 'react';
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
  Zap,
  Lightbulb
} from 'lucide-react';
import { Database } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboard } from '@/hooks/useDashboard';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';
import { ProfileIncompleteError } from '@/components/dashboard/ProfileIncompleteError';
import { getFirstName } from '@/lib/userUtils';
import { DashboardDeadlines } from '@/components/dashboard/parts/DashboardDeadlines';
import GPATrendChart from '@/components/dashboard/parts/GPATrendChart';
import ThreadProgressChart from '@/components/dashboard/parts/ThreadProgressChart';
import { CourseRecommendationsAI } from '@/components/planner/CourseRecommendationsAI';
import { useSemesters } from '@/hooks/useSemesters';

function DashboardContent() {
  const { user } = useAuth();
  const { isSuccess: semestersFromDB, isLoading: semestersLoading } = useSemesters();

  // Use unified dashboard hook - loads ALL data in one coordinated call
  const {
    isLoading,
    error,
    user: _dashboardUser,
    userProfile,
    stats,
    courses,
    gpaHistory,
    currentGPA,
    progressSummary,
    upcomingDeadlines
  } = useDashboard();

  // Show error state if profile is incomplete or dates are invalid
  if (error) {
    return <ProfileIncompleteError error={error} />;
  }

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Get courses data
  const completedCourses = courses.completed;

  // Calculate stats
  const totalCompletedCredits = stats.creditsCompleted;

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
  const upcomingDeadlinesCount = upcomingDeadlines.filter(d => {
    const daysLeft = Math.ceil((new Date(d.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  // Get user display name - show first name only
  const userName = getFirstName(userProfile, user?.email);



  // Calculate thread progress (simplified to avoid hook ordering issues)
  const threads = userProfile?.threads || [];
  const threadProgress = threads.map((thread: string) => ({
    name: thread,
    completed: Math.floor(totalCompletedCredits * 0.3),
    required: 36,
    percentage: Math.min((Math.floor(totalCompletedCredits * 0.3) / 36) * 100, 100)
  }));

  // Simplified recent activity (avoiding complex type issues)
  const recentActivity = [
    {
      id: 'welcome',
      type: 'course_completed' as const,
      title: 'Welcome to GT Course Planner',
      description: 'Start planning your academic journey',
      timestamp: new Date(),
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    },
    {
      id: 'courses-completed',
      type: 'course_completed' as const,
      title: `${completedCourses.length} Courses Completed`,
      description: `You've completed ${totalCompletedCredits} credits`,
      timestamp: new Date(Date.now() - 86400000),
      icon: <Award className="h-5 w-5 text-purple-600" />
    },
    {
      id: 'gpa-status',
      type: 'gpa_improved' as const,
      title: 'Current GPA',
      description: `GPA: ${currentGPA.toFixed(2)}`,
      timestamp: new Date(Date.now() - 2 * 86400000),
      icon: <Trophy className="h-5 w-5 text-yellow-600" />
    }
  ];

  // Format deadlines to match the expected Deadline interface  
  const formattedDeadlines = upcomingDeadlines.map((deadline, index) => ({
    ...deadline,
    id: parseInt(deadline.id) || index,
    urgent: deadline.daysLeft <= 7,
    is_active: true,
    date: deadline.date.toISOString ? deadline.date.toISOString() : deadline.date.toString(),
    type: (deadline.type as "registration" | "withdrawal" | "graduation" | "thread-confirmation" | "financial" | "housing") || "registration"
  }));

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
        <div className="flex flex-col items-end gap-2">
          <Badge className="bg-gt-gold text-gt-navy px-3 py-1 text-sm font-medium">
            {userProfile?.major || 'Major Not Set'}
          </Badge>
          {!semestersLoading && (
            <div className="flex items-center gap-1 text-xs text-gray-600" title={semestersFromDB ? 'Planner semesters are loaded from your account' : 'Planner semesters not confirmed from server yet'}>
              <Database className={`h-3.5 w-3.5 ${semestersFromDB ? 'text-green-600' : 'text-gray-400'}`} />
              <span>
                Planner data: {semestersFromDB ? 'Synced to account' : 'Checking...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Quick Stats Grid - 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-gt-gold hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6">
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
            <CardContent className="p-4 sm:p-6">
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
        <GPATrendChart gpaHistory={gpaHistory || []} delay={0.2} />
        <ThreadProgressChart threadProgress={threadProgress} delay={0.3} />
      </div>

      {/* Recommendations and Deadlines - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          {userProfile?.major ? (
            <CourseRecommendationsAI userProfile={userProfile} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-gt-navy flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Course Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium mb-2">Complete Your Profile</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Set up your major and academic goals to receive personalized course recommendations
                  </p>
                  <Button
                    onClick={() => window.location.href = '/profile'}
                    className="bg-gt-navy hover:bg-gt-navy-700"
                  >
                    Complete Profile Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
              <div className="space-y-4">
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
                          activity.type === 'gpa_improved' ? 'bg-yellow-100 text-yellow-800' :
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
            <CardContent className="space-y-4">
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
