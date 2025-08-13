// WelcomeHeader.tsx - With safety checks and performance optimizations
"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Award } from "lucide-react";

interface WelcomeHeaderProps {
    data?: {
        studentInfo?: {
            name?: string;
            major?: string;
            expectedGraduation?: string;
        } | null;
        progressPercentage?: number;
        academicProgress?: {
            currentGPA?: number;
        } | null;
    } | null;
}

const WelcomeHeader = memo<WelcomeHeaderProps>(({ data }) => {
    // Memoized safe data extraction with fallbacks for better performance
    const { firstName, major, expectedGraduation, currentGPA, progressPercentage, roundedProgress } = useMemo(() => {
        const safeData = data || {};
        const studentInfo = safeData.studentInfo || {};
        const progressPct = typeof safeData.progressPercentage === 'number' ? safeData.progressPercentage : 0;
        const academicProgress = safeData.academicProgress || {};

        const studentName = studentInfo.name || "Student";
        const firstName = studentName.split(" ")[0] || "Student";
        const major = studentInfo.major || "Undeclared";
        const expectedGraduation = studentInfo.expectedGraduation || "Spring 2026"; // Default instead of TBD
        const currentGPA = typeof academicProgress.currentGPA === 'number' ? academicProgress.currentGPA : 0;
        const roundedProgress = Math.round(progressPct);
        
        return {
            firstName,
            major,
            expectedGraduation,
            currentGPA,
            progressPercentage: progressPct,
            roundedProgress
        };
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
        >
            <Card className="bg-gt-gradient text-white border-0 shadow-lg">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <h1 className="text-3xl lg:text-4xl font-bold">
                                Welcome back, {firstName}! 👋
                            </h1>
                            <p className="text-lg lg:text-xl text-white/90">
                                {major} • Expected Graduation: {expectedGraduation}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/20 backdrop-blur-sm"
                                >
                                    <Target className="w-3 h-3 mr-1" />
                                    {roundedProgress}% Complete
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/20 backdrop-blur-sm"
                                >
                                    <Award className="w-3 h-3 mr-1" />
                                    {currentGPA.toFixed(2)} GPA
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-6 lg:mt-0 text-center lg:text-right">
                            <div className="text-4xl lg:text-5xl font-bold mb-2">
                                {roundedProgress}%
                            </div>
                            <div className="text-base lg:text-lg text-white/90 mb-3">Degree Progress</div>
                            <Progress
                                value={Math.min(progressPercentage, 100)}
                                className="h-3 bg-white/20"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

WelcomeHeader.displayName = 'WelcomeHeader';

export default WelcomeHeader;