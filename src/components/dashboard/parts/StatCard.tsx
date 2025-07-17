// StatCard.tsx - With safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title?: string;
    value?: string | number;
    subtitle?: string;
    icon?: React.ComponentType<any>;
    color?: string;
    trend?: "up" | "down" | "stable";
    trendValue?: string;
    delay?: number;
}

const StatCard = ({
    title = "Unknown Stat",
    value = "—",
    subtitle,
    icon: Icon = AlertCircle,
    color = "bg-gray-500",
    trend,
    trendValue,
    delay = 0,
}: StatCardProps) => {
    // Safe value formatting
    const displayValue = value !== null && value !== undefined ? value : "—";
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="stats-card hover:shadow-lg transition-all duration-200 border-slate-300">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                {title}
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">
                                {displayValue}
                            </p>
                            {subtitle && (
                                <p className="text-sm text-slate-500 mt-1">
                                    {subtitle}
                                </p>
                            )}
                            {trend && trendValue && (
                                <div
                                    className={cn(
                                        "flex items-center mt-2 text-sm",
                                        trend === "up"
                                            ? "text-green-600"
                                            : trend === "down"
                                                ? "text-red-600"
                                                : "text-slate-600",
                                    )}
                                >
                                    {trend === "up" ? (
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                    ) : trend === "down" ? (
                                        <TrendingDown className="h-3 w-3 mr-1" />
                                    ) : (
                                        <Activity className="h-3 w-3 mr-1" />
                                    )}
                                    {trendValue}
                                </div>
                            )}
                        </div>
                        <div className={cn("p-3 rounded-full", color)}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StatCard;