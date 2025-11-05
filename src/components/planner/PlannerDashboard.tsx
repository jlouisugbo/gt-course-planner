"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  Clock,
  CheckCircle,
  User,
  Download,
  Upload,
  Target
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { PlannerGrid } from './PlannerGrid';
import { CourseRecommendationsAI } from './CourseRecommendationsAI';
import { AcademicTimeline } from './AcademicTimeline';
import { PlannerStats } from './PlannerStats';
import ProfileSetup from '@/components/profile/ProfileSetup';
import { usePlannerUIStore } from '@/hooks/usePlannerUIStore';

export const PlannerDashboard: React.FC = () => {
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Use unified dashboard data (aggregated from new hooks)
  const dashboard = useDashboard();
  const semesters = dashboard.semesters as Record<string, any>;
  const userProfile = dashboard.userProfile as any;
  const degreeProgram = dashboard.requirements?.degreeProgram as any;
  // const minorPrograms = dashboard.requirements?.minorPrograms as any[];
  const dataLoading = dashboard.isLoading;
  const dataError = dashboard.error;
  const isFullyInitialized = !dashboard.isLoading;
  const reloadData = dashboard.refresh;
  const { sidebarOpen, setSidebarOpen } = usePlannerUIStore();
  const sidebarCollapsed = !sidebarOpen;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const activeUserProfile = userProfile;

  const safeSemesters = useMemo(() => {
    if (!semesters || typeof semesters !== 'object') {
      return {};
    }
    return semesters;
  }, [semesters]);

  const safeUserProfile = useMemo(() => {
    if (!activeUserProfile || typeof activeUserProfile !== 'object') {
      return null;
    }
    return activeUserProfile;
  }, [activeUserProfile]);

  // Calculate stats
  const totalCreditsPlanned = useMemo(() => {
    return Object.values(safeSemesters)
      .filter(semester => semester && typeof semester === 'object')
      .reduce((sum, semester) => {
        const credits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
        return sum + credits;
      }, 0);
  }, [safeSemesters]);

  const completedSemesters = useMemo(() => {
    return Object.values(safeSemesters)
      .filter(semester => 
        semester && 
        typeof semester === 'object' && 
        semester.isCompleted === true
      ).length;
  }, [safeSemesters]);

  const totalSemesters = Object.keys(safeSemesters).length;
  const progressPercentage = totalSemesters > 0 ? Math.round((completedSemesters / totalSemesters) * 100) : 0;

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (dataLoading || !isFullyInitialized) {
      const timeout = setTimeout(() => {
        if (dataLoading) {
          console.error('Loading timeout - forcing initialization');
          // Force a reload or show error
          if (reloadData) {
            reloadData();
          }
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [dataLoading, isFullyInitialized, reloadData]);

  // Show loading state while initializing
  if (dataLoading || !isFullyInitialized) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-gt-gradient rounded-full flex items-center justify-center mx-auto animate-pulse">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gt-navy">Loading Your Academic Plan</h3>
            <p className="text-gray-600">Setting up your personalized course schedule...</p>
            {dataError && (
              <div className="mt-4">
                <p className="text-red-600 text-sm mb-2">Loading is taking longer than expected</p>
                <Button
                  variant="outline"
                  onClick={reloadData}
                  className="text-sm"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gt-card p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <div className="w-12 h-12 bg-gt-gradient rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gt-navy">Academic Planner</h1>
                  <p className="text-gray-600">
                    {safeUserProfile?.major || 'Plan your journey to graduation'}
                    {degreeProgram?.totalCredits && ` • ${degreeProgram.totalCredits} credits total`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={toggleSidebar}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  {sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
                </Button>
                {dataError && (
                  <Button
                    variant="outline"
                    onClick={reloadData}
                    className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
                    disabled={dataLoading}
                  >
                    <Target className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                    {dataLoading ? 'Loading...' : 'Retry'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowProfileSetup(true)}
                  className="flex items-center gap-2 border-gt-navy text-gt-navy hover:bg-gt-navy hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button className="gt-button-primary flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="planner" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="planner" 
                className="flex items-center gap-2 transition-all data-[state=active]:bg-gt-navy data-[state=active]:text-white text-gray-700"
              >
                <Calendar className="h-4 w-4" />
                <span>Academic Plan</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex items-center gap-2 transition-all data-[state=active]:bg-gt-navy data-[state=active]:text-white text-gray-700"
              >
                <Clock className="h-4 w-4" />
                <span>Timeline View</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recommendations" 
                className="flex items-center gap-2 transition-all data-[state=active]:bg-gt-navy data-[state=active]:text-white text-gray-700"
              >
                <Target className="h-4 w-4" />
                <span>Course Recommendations</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planner" className="space-y-5 mt-5">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Course Recommendations Sidebar - 25% */}
                {!sidebarCollapsed && (
                  <div className="lg:col-span-1">
                    <div className="sticky top-4">
                      <CourseRecommendationsAI userProfile={userProfile} />
                    </div>
                  </div>
                )}
                
                {/* Main Planning Grid - 75% */}
                <div className={sidebarCollapsed ? 'lg:col-span-4' : 'lg:col-span-3'}>
                  <PlannerGrid 
                    semesters={semesters}
                    userProfile={userProfile}
                    isLoading={dataLoading}
                    isInitialized={isFullyInitialized}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-5 mt-5">
              <AcademicTimeline />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-5 mt-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <CourseRecommendationsAI showAllTabs userProfile={userProfile} />
                </div>
                <div className="lg:col-span-1">
                  <PlannerStats />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Stats Overview - Moved to Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="gt-card border-l-4 border-l-gt-gold">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gt-gold">{progressPercentage}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-gt-gold" />
              </div>
              <Progress value={progressPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Planned</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalCreditsPlanned}</p>
                </div>
                <BookOpen className="h-6 w-6 text-gt-navy" />
              </div>
              <p className="text-xs text-gray-500 mt-1">of ~120 total</p>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Semesters</p>
                  <p className="text-2xl font-bold text-gt-navy">{completedSemesters}/{totalSemesters}</p>
                </div>
                <Calendar className="h-6 w-6 text-gt-navy" />
              </div>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected</p>
                  <p className="text-lg font-bold text-gt-gold">
                    {safeUserProfile?.expectedGraduation || 'TBD'}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-gt-gold" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Setup Modal */}
        {showProfileSetup && (
          <ProfileSetup
            isOpen={showProfileSetup}
            onClose={() => setShowProfileSetup(false)}
            existingProfile={safeUserProfile || undefined}
          />
        )}
    </div>
  );
};