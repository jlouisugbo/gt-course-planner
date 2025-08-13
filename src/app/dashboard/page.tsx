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
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';
import { AsyncErrorBoundary } from '@/components/error/AsyncErrorBoundary';

function DashboardContent() {
  const { user } = useAuth();
  const plannerStore = useUserAwarePlannerStore();
  const { userProfile } = plannerStore;

  // Get courses data
  const completedCourses = plannerStore.getCoursesByStatus('completed');
  const plannedCourses = plannerStore.getCoursesByStatus('planned');
  const inProgressCourses = plannerStore.getCoursesByStatus('in-progress');

  // Calculate stats
  const totalPlannedCredits = plannedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const totalCompletedCredits = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const currentGPA = plannerStore.calculateGPA();

  // Get user display name
  const userName = user?.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gt-navy flex items-center gap-3">
            <Home className="h-8 w-8 text-gt-gold" />
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here&apos;s your academic progress overview
          </p>
        </div>
        <Badge className="bg-gt-gold text-gt-navy px-3 py-1 text-sm font-medium">
          {userProfile?.major || 'Major Not Set'}
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-sm font-medium text-gray-600">Completed Credits</p>
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
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planned Credits</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalPlannedCredits}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gt-navy">{inProgressCourses.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-gt-navy flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedCourses.slice(0, 5).map((course, index) => (
                  <motion.div
                    key={course.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gt-navy">{course.code}</p>
                      <p className="text-sm text-gray-600 truncate">{course.title}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </motion.div>
                ))}
                {completedCourses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No completed courses yet</p>
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
                <TrendingUp className="h-4 w-4 mr-2" />
                View Record
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-gt-navy flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Course Registration</p>
                  <p className="text-xs text-yellow-600">Opens in 2 weeks</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Academic Advisor Meeting</p>
                  <p className="text-xs text-blue-600">Schedule soon</p>
                </div>
              </div>
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