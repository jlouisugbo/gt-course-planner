"use client";

import React from "react";
import AIInsightsPanel from "./AIInsightsPanel";
import RecentActivityPanel from "./RecentActivityPanel";

interface InsightsAndActivityRowProps {
    data?: {
        academicProgress?: any;
        remainingCourses?: number;
        recentActivity?: any[];
    } | null;
}

const InsightsAndActivityRow = ({ data }: InsightsAndActivityRowProps) => {
    // Safe data extraction with fallbacks
    const safeData = data || {};
    const academicProgress = safeData.academicProgress || null;
    const remainingCourses = typeof safeData.remainingCourses === 'number' 
        ? safeData.remainingCourses 
        : 0;
    const recentActivity = Array.isArray(safeData.recentActivity) 
        ? safeData.recentActivity 
        : [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsightsPanel 
                academicProgress={academicProgress} 
                remainingCourses={remainingCourses} 
                delay={1.0} 
            />
            <RecentActivityPanel 
                recentActivity={recentActivity} 
                delay={1.1} 
            />
        </div>
    );
};

export default InsightsAndActivityRow;