"use client";

import React from "react";
import CreditDistributionChart from "./CreditDistributionChart";
import GPATrendChart from "./GPATrendChart";
import QuickActionsPanel from "./QuickActionsPanel";

interface ChartsRowProps {
    data?: {
        academicProgress?: any;
        gpaHistory?: any[];
        remainingCourses?: number;
    } | null;
}

const ChartsRow = ({ data }: ChartsRowProps) => {
    // Safe data extraction with fallbacks
    const safeData = data || {};
    const academicProgress = safeData.academicProgress || {
        creditsCompleted: 0,
        creditsInProgress: 0,
        creditsPlanned: 0,
        totalCreditsRequired: 126,
        currentGPA: 0,
        projectedGPA: 0
    };
    const gpaHistory = Array.isArray(safeData.gpaHistory) ? safeData.gpaHistory : [];

    // Validate academic progress data
    const hasValidAcademicProgress = academicProgress && 
        typeof academicProgress === 'object' &&
        typeof academicProgress.totalCreditsRequired === 'number';

    // Show loading state if critical data is missing
    if (!hasValidAcademicProgress) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Loading skeletons */}
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-80"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CreditDistributionChart 
                academicProgress={academicProgress} 
                delay={0.5} 
            />
            <GPATrendChart 
                gpaHistory={gpaHistory} 
                delay={0.6} 
            />
            <QuickActionsPanel 
                delay={0.7} 
            />
        </div>
    );
};

export default ChartsRow;