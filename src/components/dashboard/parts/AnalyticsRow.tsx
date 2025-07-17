"use client";

import React from "react";
import CourseDifficultyChart from "./CourseDifficultyChart";
import ThreadProgressChart from "./ThreadProgressChart";

interface AnalyticsRowProps {
    data?: {
        allCourses?: any[];
        threadProgress?: any[];
    } | null;
}

const AnalyticsRow = ({ data }: AnalyticsRowProps) => {
    // Safe data extraction with fallbacks
    const safeData = data || {};
    const allCourses = safeData.allCourses || [];
    const threadProgress = safeData.threadProgress || [];

    // Validate data before rendering
    const hasValidCourseData = Array.isArray(allCourses) && allCourses.length > 0;
    const hasValidThreadData = Array.isArray(threadProgress) && threadProgress.length > 0;

    // If no data at all, show loading state
    if (!hasValidCourseData && !hasValidThreadData) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loading skeletons */}
                <div className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-80"></div>
                </div>
                <div className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-80"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CourseDifficultyChart 
                allCourses={allCourses} 
                delay={0.8} 
            />
            <ThreadProgressChart 
                threadProgress={threadProgress} 
                delay={0.9} 
            />
        </div>
    );
};

export default AnalyticsRow;