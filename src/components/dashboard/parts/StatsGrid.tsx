"use client";

import React, { memo, useMemo } from "react";
import StatCard from "./StatCard";
import { GraduationCap, TrendingUp, BookOpen, Clock } from "lucide-react";
import { DashboardCardSkeleton } from "@/components/ui/loading";
import { motion } from "framer-motion";

interface StatsGridProps {
    data?: {
        academicProgress?: {
            creditsCompleted?: number;
            creditsInProgress?: number;
            totalCreditsRequired?: number;
            currentGPA?: number;
            projectedGPA?: number;
        } | null;
        progressPercentage?: number;
        remainingCourses?: number;
        plannedCourses?: any[];
        completedCourses?: any[];
        studentInfo?: {
            expectedGraduation?: string;
            graduationYear?: number;
        } | null;
    } | null;
    isLoading?: boolean;
}

const StatsGrid = memo<StatsGridProps>(({ data, isLoading = false }) => {
    // Safe data extraction with comprehensive fallbacks
    const safeData = data || {};
    const academicProgress = safeData.academicProgress || {};
    const progressPercentage = safeData.progressPercentage || 0;
    const remainingCourses = safeData.remainingCourses || 0;
    const plannedCourses = Array.isArray(safeData.plannedCourses) ? safeData.plannedCourses : [];
    const completedCourses = Array.isArray(safeData.completedCourses) ? safeData.completedCourses : [];
    const studentInfo = safeData.studentInfo || {};

    // Safe access with fallbacks for academic progress
    const creditsCompleted = typeof academicProgress.creditsCompleted === 'number' ? academicProgress.creditsCompleted : 0;
    const creditsInProgress = typeof academicProgress.creditsInProgress === 'number' ? academicProgress.creditsInProgress : 0;
    const totalCreditsRequired = typeof academicProgress.totalCreditsRequired === 'number' ? academicProgress.totalCreditsRequired : 126;
    const currentGPA = typeof academicProgress.currentGPA === 'number' ? academicProgress.currentGPA : 0;
    const projectedGPA = typeof academicProgress.projectedGPA === 'number' ? academicProgress.projectedGPA : currentGPA;
    
    // Safe graduation date handling - no more TBD values
    const expectedGraduation = studentInfo.expectedGraduation || 
        (typeof studentInfo.graduationYear === 'number' ? `Spring ${studentInfo.graduationYear}` : `Spring ${new Date().getFullYear() + 2}`);

    // Memoize stats array to prevent recreation on every render
    const stats = useMemo(() => [
        {
            title: "Credit Progress",
            value: `${creditsCompleted + creditsInProgress}/${totalCreditsRequired}`,
            subtitle: `${Math.round(progressPercentage)}% complete`,
            icon: GraduationCap,
            color: "bg-[#B3A369]",
            trend: "up" as const,
            trendValue: `${creditsCompleted} completed`,
            delay: 0.1,
        },
        {
            title: "Current GPA",
            value: currentGPA.toFixed(2),
            subtitle: `Target: ${projectedGPA.toFixed(2)}`,
            icon: TrendingUp,
            color: "bg-[#003057]",
            trend: "stable" as const,
            trendValue: "On track",
            delay: 0.2,
        },
        {
            title: "Courses Remaining",
            value: Math.ceil(remainingCourses),
            subtitle: `${plannedCourses.length} planned`,
            icon: BookOpen,
            color: "bg-blue-600",
            trend: "down" as const,
            trendValue: `${completedCourses.length} completed`,
            delay: 0.3,
        },
        {
            title: "Graduation Timeline",
            value: expectedGraduation,
            subtitle: "Expected completion",
            icon: Clock,
            color: "bg-green-600",
            trend: "stable" as const,
            trendValue: "On schedule",
            delay: 0.4,
        },
    ], [creditsCompleted, creditsInProgress, totalCreditsRequired, progressPercentage, 
        currentGPA, projectedGPA, remainingCourses, plannedCourses.length, 
        completedCourses.length, expectedGraduation]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <DashboardCardSkeleton />
                    </motion.div>
                ))}
            </div>
        );
    }

    return (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stat.delay }}
                >
                    <StatCard {...stat} />
                </motion.div>
            ))}
        </motion.div>
    );
});

StatsGrid.displayName = 'StatsGrid';

export default StatsGrid;