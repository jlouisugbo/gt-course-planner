
"use client";

import React from "react";
import { usePlannerStore } from "@/hooks/usePlannerStore";

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

    const dashboardData = {
        studentInfo,
        academicProgress,
        recentActivity,
        semesters,
        allCourses,
        completedCourses,
        plannedCourses,
        inProgressCourses,
        gpaHistory,
        threadProgress,
        progressPercentage,
        remainingCourses,
    };

    return (
        <div className="space-y-8">
            <WelcomeHeader data={dashboardData} />
            <StatsGrid data={dashboardData} />
            <ChartsRow data={dashboardData} />
            <AnalyticsRow data={dashboardData} />
            <InsightsAndActivityRow data={dashboardData} />
            <TimelineOverview data={dashboardData} />
        </div>
    );
};

export default Dashboard;