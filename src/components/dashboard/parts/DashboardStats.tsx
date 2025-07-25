"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    GraduationCap, 
    TrendingUp, 
    BookOpen, 
    Clock,
    CheckCircle,
    Target
} from "lucide-react";
import { DashboardStats as StatsType } from "@/hooks/useDashboardData";

interface DashboardStatsProps {
    stats: StatsType;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    trendValue,
    delay
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center shadow-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        {trend && (
                            <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'}>
                                {trendValue}
                            </Badge>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
                        <div className="text-2xl font-bold text-slate-900 mb-1">
                            {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
                        </div>
                        <p className="text-sm text-slate-500">{subtitle}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    const statCards: StatCardProps[] = [
        {
            title: "Credit Progress",
            value: `${stats.creditsCompleted + stats.creditsInProgress}/${stats.totalCredits}`,
            subtitle: `${Math.round(stats.progressPercentage)}% complete`,
            icon: GraduationCap,
            color: "bg-[#B3A369]",
            trend: "up",
            trendValue: `${stats.creditsCompleted} completed`,
            delay: 0.1,
        },
        {
            title: "Current GPA",
            value: stats.currentGPA.toFixed(2),
            subtitle: `Target: ${stats.targetGPA.toFixed(1)}`,
            icon: TrendingUp,
            color: stats.currentGPA >= stats.targetGPA ? "bg-green-600" : "bg-yellow-600",
            trend: stats.currentGPA >= stats.targetGPA ? "up" : "stable",
            trendValue: stats.currentGPA >= stats.targetGPA ? "On target" : "Below target",
            delay: 0.2,
        },
        {
            title: "Courses Remaining",
            value: stats.coursesRemaining,
            subtitle: `${stats.coursesCompleted} completed`,
            icon: BookOpen,
            color: "bg-blue-600",
            trend: "down",
            trendValue: `${stats.coursesCompleted} done`,
            delay: 0.3,
        },
        {
            title: "Graduation Status",
            value: stats.onTrackForGraduation ? "On Track" : "Behind",
            subtitle: stats.onTrackForGraduation ? "Meeting milestones" : "Needs planning",
            icon: stats.onTrackForGraduation ? CheckCircle : Target,
            color: stats.onTrackForGraduation ? "bg-emerald-600" : "bg-orange-600",
            trend: stats.onTrackForGraduation ? "up" : "stable",
            trendValue: stats.onTrackForGraduation ? "On schedule" : "Review plan",
            delay: 0.4,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
};