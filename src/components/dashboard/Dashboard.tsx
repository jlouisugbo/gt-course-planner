
"use client";

import React from "react";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { useDashboardData } from "@/hooks/useDashboardData";

import WelcomeHeader from "./parts/WelcomeHeader";
import StatsGrid from "./parts/StatsGrid";
import ChartsRow from "./parts/ChartsRow";
import AnalyticsRow from "./parts/AnalyticsRow";
import InsightsAndActivityRow from "./parts/InsightsAndActivityRow";
import TimelineOverview from "./parts/TimelineOverview";

const Dashboard = () => {
    const { 
        studentInfo, 
        academicProgress, 
        recentActivity, 
        semesters,
        getGPAHistory,
        getThreadProgress,
    } = usePlannerStore();

    // Get real user data for enhanced experience
    const dashboardData = useDashboardData();

    const allCourses = Object.values(semesters).flatMap(
        (semester) => semester.courses,
    );
    const completedCourses = allCourses.filter(
        (course) => course?.status === "completed",
    );
    const plannedCourses = allCourses.filter(
        (course) => course?.status === "planned",
    );
    const inProgressCourses = allCourses.filter(
        (c) => c?.status === "in-progress",
    );

    const gpaHistory = getGPAHistory();
    const threadProgress = getThreadProgress();
    const progressPercentage = (academicProgress.creditsCompleted / academicProgress.totalCreditsRequired) * 100;
    const remainingCourses = plannedCourses.length + (academicProgress.totalCreditsRequired - academicProgress.creditsCompleted - academicProgress.creditsInProgress - academicProgress.creditsPlanned) / 3;

    // Combine planner store data with real user data
    const combinedData = {
        studentInfo: dashboardData.user ? {
            ...studentInfo,
            name: dashboardData.user.name,
            major: dashboardData.user.major,
            expectedGraduation: `Spring ${dashboardData.user.graduationYear}`,
        } : studentInfo,
        academicProgress,
        recentActivity: dashboardData.activities.length > 0 ? dashboardData.activities : recentActivity,
        semesters,
        allCourses,
        completedCourses,
        plannedCourses,
        inProgressCourses,
        gpaHistory,
        threadProgress,
        progressPercentage,
        remainingCourses,
        upcomingDeadlines: dashboardData.upcomingDeadlines,
    };

    return (
        <div className="space-y-8">
            <WelcomeHeader data={combinedData} />
            <StatsGrid data={combinedData} />
            <ChartsRow data={combinedData} />
            <AnalyticsRow data={combinedData} />
            <InsightsAndActivityRow data={combinedData} />
            <TimelineOverview data={combinedData} />
        </div>
    );
};

export default Dashboard;