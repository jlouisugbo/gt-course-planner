"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { usePlannerInitialization } from '@/hooks/usePlannerInitialization';
import { PlannerGrid } from './PlannerGrid';
import { CourseRecommendationsAI } from './CourseRecommendationsAI';
import { AcademicTimeline } from './AcademicTimeline';
import { PlannerStats } from './PlannerStats';
import ProfileSetup from '@/components/profile/ProfileSetup';

export const PlannerDashboard: React.FC = () => {
  const plannerStore = usePlannerInitialization();
  const { semesters, userProfile } = plannerStore;
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const safeSemesters = useMemo(() => {
    if (!semesters || typeof semesters !== 'object') {
      return {};
    }
    return semesters;
  }, [semesters]);

  const safeUserProfile = useMemo(() => {
    if (!userProfile || typeof userProfile !== 'object') {
      return null;
    }
    return userProfile;
  }, [userProfile]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gt-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <div className="w-12 h-12 bg-gt-gradient rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gt-navy">Academic Planner</h1>
                  <p className="text-gray-600">Plan your journey to graduation</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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

        {/* Student Profile Banner */}
        {safeUserProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gt-gradient text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{safeUserProfile.name || 'Student'}</h2>
                      <p className="text-white/90 mb-2">
                        {safeUserProfile.major || 'Undeclared'} • Class of {safeUserProfile.expectedGraduation || 'TBD'}
                      </p>
                      {Array.isArray(safeUserProfile.threads) && safeUserProfile.threads.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {safeUserProfile.threads.map((thread, index) => (
                            <Badge
                              key={`${thread}-${index}`}
                              variant="secondary"
                              className="bg-white/20 text-white border-white/20 text-xs backdrop-blur-sm"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              {thread}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {typeof safeUserProfile.currentGPA === 'number' 
                        ? safeUserProfile.currentGPA.toFixed(2) 
                        : '0.00'}
                    </div>
                    <div className="text-sm text-white/90">Current GPA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="gt-card border-l-4 border-l-gt-gold">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gt-gold">{progressPercentage}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gt-gold" />
              </div>
              <Progress value={progressPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credits Planned</p>
                  <p className="text-2xl font-bold text-gt-navy">{totalCreditsPlanned}</p>
                </div>
                <BookOpen className="h-8 w-8 text-gt-navy" />
              </div>
              <p className="text-xs text-gray-500 mt-1">of ~120 total</p>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Semesters</p>
                  <p className="text-2xl font-bold text-gt-navy">{completedSemesters}/{totalSemesters}</p>
                </div>
                <Calendar className="h-8 w-8 text-gt-navy" />
              </div>
            </CardContent>
          </Card>

          <Card className="gt-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expected</p>
                  <p className="text-lg font-bold text-gt-gold">
                    {safeUserProfile?.expectedGraduation || 'TBD'}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-gt-gold" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="planner" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1">
              <TabsTrigger 
                value="planner" 
                className="flex items-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white"
              >
                <Calendar className="h-4 w-4" />
                Academic Plan
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex items-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white"
              >
                <Clock className="h-4 w-4" />
                Timeline View
              </TabsTrigger>
              <TabsTrigger 
                value="recommendations" 
                className="flex items-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white"
              >
                <Target className="h-4 w-4" />
                Course Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planner" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Course Recommendations Sidebar */}
                <div className="xl:col-span-1">
                  <div className="sticky top-6">
                    <CourseRecommendationsAI />
                  </div>
                </div>
                
                {/* Main Planning Grid */}
                <div className="xl:col-span-3">
                  <PlannerGrid />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6 mt-6">
              <AcademicTimeline />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CourseRecommendationsAI showAllTabs />
                </div>
                <div className="lg:col-span-1">
                  <PlannerStats />
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
    </div>
  );
};