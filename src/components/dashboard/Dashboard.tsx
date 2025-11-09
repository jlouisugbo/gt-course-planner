"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Calendar,
  Activity,
  Clock,
  Target
} from "lucide-react";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { useDashboardData } from "@/hooks/useDashboardData";
import { CriticalErrorBoundary } from "@/components/error/GlobalErrorBoundary";

import WelcomeHeader from "./parts/WelcomeHeader";
import StatsGrid from "./parts/StatsGrid";
import ChartsRow from "./parts/ChartsRow";
import InsightsAndActivityRow from "./parts/InsightsAndActivityRow";
import TimelineOverview from "./parts/TimelineOverview";

const Dashboard = memo(() => {
    const { 
        semesters,
    } = usePlannerStore();

    // Get real user data for enhanced experience
    const dashboardData = useDashboardData();

    // Memoize expensive computations with shallow comparison
    const allCourses = useMemo(() => {
        const semesterKeys = Object.keys(semesters);
        if (semesterKeys.length === 0) return [];
        
        return Object.values(semesters).flatMap((semester) => semester?.courses || []);
    }, [semesters]);

    // Memoize combined data to prevent unnecessary re-renders with stable references
    const combinedData = useMemo(() => {
        // Only recalculate if dashboard data actually changed
        const hasValidDashboardData = dashboardData && dashboardData.user;
        
        return {
            studentInfo: hasValidDashboardData ? dashboardData.user : null,
            academicProgress: dashboardData?.academicProgress || {
                creditsCompleted: 0,
                creditsInProgress: 0,
                creditsPlanned: 0,
                totalCreditsRequired: 126,
                totalCredits: 126,
                currentGPA: 0,
                targetGPA: 3.5,
                progressPercentage: 0,
                onTrack: false,
                onTrackForGraduation: false,
                coursesRemaining: 0,
                coursesCompleted: 0,
            },
            recentActivity: (dashboardData?.recentActivity?.length > 0) ? dashboardData.recentActivity : [],
            semesters,
            allCourses,
            completedCourses: dashboardData?.courses?.completed || [],
            plannedCourses: dashboardData?.courses?.planned || [],
            inProgressCourses: dashboardData?.courses?.inProgress || [],
            gpaHistory: dashboardData?.gpaHistory || [],
            progressPercentage: dashboardData?.academicProgress?.progressPercentage || 0,
            remainingCourses: dashboardData?.courses?.remainingCount || 0,
            upcomingDeadlines: dashboardData?.upcomingDeadlines || [],
        };
    }, [
        dashboardData,
        semesters,
        allCourses
    ]);

    // Memoize activity slice with length check to avoid unnecessary re-computation
    const recentActivitySlice = useMemo(() => {
        const activities = combinedData.recentActivity;
        if (!activities || activities.length === 0) return [];
        return activities.slice(0, 4);
    }, [combinedData.recentActivity]);

    // Removed unused handleTabChange callback for cleaner code

    return (
        <CriticalErrorBoundary>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Welcome Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <WelcomeHeader data={combinedData} />
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <StatsGrid data={combinedData} />
                    </motion.div>

                {/* Main Dashboard Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList 
                            className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-lg p-1 min-h-[44px]"
                            role="tablist"
                            aria-label="Dashboard sections"
                        >
                            <TabsTrigger 
                                value="overview" 
                                className="flex items-center justify-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white min-h-[44px] text-sm"
                                role="tab"
                            >
                                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Overview</span>
                                <span className="sm:hidden">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="timeline" 
                                className="flex items-center justify-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white min-h-[44px] text-sm"
                                role="tab"
                            >
                                <Calendar className="h-4 w-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Timeline</span>
                                <span className="sm:hidden">Time</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="activity" 
                                className="flex items-center justify-center gap-2 data-[state=active]:bg-gt-navy data-[state=active]:text-white min-h-[44px] text-sm"
                                role="tab"
                            >
                                <Activity className="h-4 w-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Activity</span>
                                <span className="sm:hidden">Activity</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 mt-6" role="tabpanel" aria-label="Dashboard overview">
                            <div className="space-y-6">
                                <ChartsRow data={combinedData} />
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <Card className="gt-card p-4 sm:p-6" role="region" aria-labelledby="quick-overview-title">
                                        <h3 className="text-lg font-semibold text-gt-navy mb-4 flex items-center gap-2" id="quick-overview-title">
                                            <Target className="h-5 w-5 text-gt-gold" aria-hidden="true" />
                                            Quick Overview
                                        </h3>
                                        <div className="space-y-4" role="list">
                                            <div className="flex justify-between items-center min-h-[44px] p-2" role="listitem">
                                                <span className="text-sm text-gray-600">Degree Progress</span>
                                                <span className="font-semibold text-gt-navy" aria-label="{Math.round(combinedData.progressPercentage)} percent complete">{Math.round(combinedData.progressPercentage)}%</span>
                                            </div>
                                            <div className="flex justify-between items-center min-h-[44px] p-2" role="listitem">
                                                <span className="text-sm text-gray-600">Credits Completed</span>
                                                <span className="font-semibold text-gt-navy">{combinedData.academicProgress.creditsCompleted || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center min-h-[44px] p-2" role="listitem">
                                                <span className="text-sm text-gray-600">Courses Remaining</span>
                                                <span className="font-semibold text-gt-navy">{Math.ceil(combinedData.remainingCourses || 0)}</span>
                                            </div>
                                            <div className="flex justify-between items-center min-h-[44px] p-2" role="listitem">
                                                <span className="text-sm text-gray-600">Current GPA</span>
                                                <span className="font-semibold text-gt-navy">{(combinedData.academicProgress.currentGPA || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="gt-card p-4 sm:p-6" role="region" aria-labelledby="recent-activity-title">
                                        <h3 className="text-lg font-semibold text-gt-navy mb-4 flex items-center gap-2" id="recent-activity-title">
                                            <Clock className="h-5 w-5 text-gt-gold" aria-hidden="true" />
                                            Recent Activity
                                        </h3>
                                        <div className="space-y-3" role="list">
                                            {recentActivitySlice.length > 0 ? (
                                                recentActivitySlice.map((activity: any, index: number) => (
                                                    <div key={index} className="flex items-start gap-3 min-h-[44px] p-2" role="listitem">
                                                        <div 
                                                            className="w-3 h-3 bg-gt-gold rounded-full mt-2 flex-shrink-0" 
                                                            role="img"
                                                            aria-label="Activity indicator"
                                                        />
                                                        <div className="text-sm flex-1 min-w-0">
                                                            <p className="font-medium text-gt-navy break-words">{activity.title || activity.type}</p>
                                                            <p className="text-gray-500 text-xs break-words">{activity.timestamp || activity.date}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 text-center py-4" role="status">No recent activity</p>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>


                        <TabsContent value="timeline" className="space-y-6 mt-6" role="tabpanel" aria-label="Academic timeline">
                            <TimelineOverview data={combinedData} />
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-6 mt-6" role="tabpanel" aria-label="Activity dashboard">
                            <InsightsAndActivityRow data={combinedData} />
                        </TabsContent>
                    </Tabs>
                </motion.div>
                </div>
            </div>
        </CriticalErrorBoundary>
    );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;