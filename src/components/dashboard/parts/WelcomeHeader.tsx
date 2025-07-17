// WelcomeHeader.tsx - With safety checks
"use client";

import React from "react";
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

const WelcomeHeader = ({ data }: WelcomeHeaderProps) => {
    // Safe data extraction with fallbacks
    const safeData = data || {};
    const studentInfo = safeData.studentInfo || {};
    const progressPercentage = typeof safeData.progressPercentage === 'number' ? safeData.progressPercentage : 0;
    const academicProgress = safeData.academicProgress || {};

    // Safe property access with fallbacks
    const studentName = studentInfo.name || "Student";
    const firstName = studentName.split(" ")[0] || "Student";
    const major = studentInfo.major || "Undeclared";
    const expectedGraduation = studentInfo.expectedGraduation || "TBD";
    const currentGPA = typeof academicProgress.currentGPA === 'number' ? academicProgress.currentGPA : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
        >
            <Card className="gt-gradient text-white border-0 shadow-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold">
                                Welcome back, {firstName}! 👋
                            </h1>
                            <p className="text-xl opacity-90">
                                {major} • Expected Graduation: {expectedGraduation}
                            </p>
                            <div className="flex items-center space-x-4 mt-4">
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                >
                                    <Target className="w-3 h-3 mr-1" />
                                    {Math.round(progressPercentage)}% Complete
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                >
                                    <Award className="w-3 h-3 mr-1" />
                                    {currentGPA.toFixed(2)} GPA
                                </Badge>
                            </div>
                        </div>
                        <div className="mt-6 lg:mt-0 text-center lg:text-right">
                            <div className="text-5xl font-bold mb-2">
                                {Math.round(progressPercentage)}%
                            </div>
                            <div className="text-lg opacity-90">Degree Progress</div>
                            <Progress
                                value={Math.min(progressPercentage, 100)}
                                className="mt-3 h-3 bg-white/20"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default WelcomeHeader;