"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Award, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardUser, DashboardStats } from "@/hooks/useDashboardData";

interface DashboardHeaderProps {
    user: DashboardUser | null;
    stats: DashboardStats;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, stats }) => {
    if (!user) {
        return (
            <Card className="gt-gradient text-white border-0 shadow-xl">
                <CardContent className="p-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/20 rounded mb-4 w-64"></div>
                        <div className="h-6 bg-white/20 rounded mb-4 w-48"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const firstName = user.name.split(" ")[0];
    const currentYear = new Date().getFullYear();
    const yearLevel = Math.min(4, Math.max(1, currentYear - user.startYear + 1));
    const yearLevels = ["Freshman", "Sophomore", "Junior", "Senior"];
    const yearLabel = yearLevels[yearLevel - 1] || "Graduate";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
        >
            <Card className="gt-gradient text-white border-0 shadow-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                {user.avatar && (
                                    <Image 
                                        src={user.avatar} 
                                        alt={user.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full border-2 border-white/30"
                                    />
                                )}
                                <div>
                                    <h1 className="text-4xl font-bold">
                                        Welcome back, {firstName}! 👋
                                    </h1>
                                    <p className="text-xl opacity-90">
                                        {user.major} • {yearLabel} • Class of {user.graduationYear}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                >
                                    <Target className="w-3 h-3 mr-1" />
                                    {Math.round(stats.progressPercentage)}% Complete
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                >
                                    <Award className="w-3 h-3 mr-1" />
                                    {stats.currentGPA.toFixed(2)} GPA
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className={`border-white/30 ${stats.onTrackForGraduation 
                                        ? 'bg-green-500/20 text-white' 
                                        : 'bg-yellow-500/20 text-white'
                                    }`}
                                >
                                    {stats.onTrackForGraduation ? (
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                    )}
                                    {stats.onTrackForGraduation ? 'On Track' : 'Needs Attention'}
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="mt-6 lg:mt-0 text-center lg:text-right">
                            <div className="text-5xl font-bold mb-2">
                                {Math.round(stats.progressPercentage)}%
                            </div>
                            <div className="text-lg opacity-90 mb-3">Degree Progress</div>
                            <Progress
                                value={Math.min(stats.progressPercentage, 100)}
                                className="h-3 bg-white/20 mb-2"
                            />
                            <div className="text-sm opacity-80">
                                {stats.creditsCompleted} of {stats.totalCredits} credits
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};