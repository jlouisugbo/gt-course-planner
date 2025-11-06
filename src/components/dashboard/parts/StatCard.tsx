// StatCard.tsx - With safety checks and performance optimizations
"use client";

import React, { memo, useMemo } from "react";
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

const StatCard = memo<StatCardProps>(({
    title = "Unknown Stat",
    value = "—",
    subtitle,
    icon: Icon = AlertCircle,
    color = "bg-gray-500",
    trend,
    trendValue,
    delay = 0
}) => {
    // Memoized safe value formatting
    const displayValue = useMemo(() => {
        return value !== null && value !== undefined ? value : "—";
    }, [value]);
    
    // Memoized trend styling
    const trendClassNames = useMemo(() => {
        return cn(
            "flex items-center mt-2 text-sm",
            trend === "up"
                ? "text-green-600"
                : trend === "down"
                    ? "text-red-600"
                    : "text-muted-foreground"
        );
    }, [trend]);
    
    // Memoized trend icon
    const TrendIcon = useMemo(() => {
        return trend === "up" ? TrendingUp
            : trend === "down" ? TrendingDown
            : Activity;
    }, [trend]);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card
                className="glass-strong glass-hover border-l-4 border-l-[#B3A369]/30 hover:border-l-[#B3A369] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:outline-none shadow-xl"
                role="region"
                aria-label={`${title} statistics card`}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1" id={`stat-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
                                {title}
                            </h3>
                            <p 
                                className="text-2xl sm:text-3xl font-bold text-[#003057] mt-1 break-words"
                                aria-labelledby={`stat-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
                            >
                                {displayValue}
                            </p>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground mt-1" aria-describedby={`stat-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
                                    {subtitle}
                                </p>
                            )}
                            {trend && trendValue && (
                                <div 
                                    className={trendClassNames}
                                    role="status"
                                    aria-label={`Trend: ${trend} - ${trendValue}`}
                                >
                                    <TrendIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                                    <span className="sr-only">{trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable trend'}:</span>
                                    {trendValue}
                                </div>
                            )}
                        </div>
                        <div 
                            className={cn("p-3 rounded-full flex-shrink-0 ml-4", color)}
                            role="img"
                            aria-label={`${title} icon`}
                        >
                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

StatCard.displayName = 'StatCard';

export default StatCard;