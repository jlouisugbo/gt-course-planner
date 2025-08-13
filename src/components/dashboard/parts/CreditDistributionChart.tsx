"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PieChart } from "lucide-react";

interface CreditDistributionChartProps {
    academicProgress?: any;
    delay?: number;
}

const CreditDistributionChart = ({ academicProgress, delay = 0 }: CreditDistributionChartProps) => {
    // Safe object access with fallbacks
    const safeAcademicProgress = academicProgress || {};
    const creditsCompleted = safeAcademicProgress.creditsCompleted || 0;
    const creditsInProgress = safeAcademicProgress.creditsInProgress || 0;
    const creditsPlanned = safeAcademicProgress.creditsPlanned || 0;
    const totalCreditsRequired = safeAcademicProgress.totalCreditsRequired || 126;

    // Calculate remaining credits safely
    const remainingCredits = Math.max(0, 
        totalCreditsRequired - creditsCompleted - creditsInProgress - creditsPlanned
    );

    // Validate that we have meaningful data
    const hasValidData = totalCreditsRequired > 0;

    const creditDistribution = [
        {
            name: "Completed",
            value: creditsCompleted,
            color: "#10B981",
            percentage: hasValidData ? (creditsCompleted / totalCreditsRequired) * 100 : 0,
        },
        {
            name: "In Progress",
            value: creditsInProgress,
            color: "#B3A369",
            percentage: hasValidData ? (creditsInProgress / totalCreditsRequired) * 100 : 0,
        },
        {
            name: "Planned",
            value: creditsPlanned,
            color: "#003057",
            percentage: hasValidData ? (creditsPlanned / totalCreditsRequired) * 100 : 0,
        },
        {
            name: "Remaining",
            value: remainingCredits,
            color: "#E5E7EB",
            percentage: hasValidData ? (remainingCredits / totalCreditsRequired) * 100 : 0,
        },
    ];

    // Filter out entries with zero values for cleaner chart
    const nonZeroDistribution = creditDistribution.filter(item => item.value > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card 
                className="border-l-4 border-l-[#B3A369]/20 focus-within:ring-2 focus-within:ring-blue-500/20"
                role="region"
                aria-labelledby="credit-distribution-title"
            >
                <CardHeader>
                    <CardTitle 
                        className="flex items-center text-[#003057]"
                        id="credit-distribution-title"
                    >
                        <PieChart className="h-5 w-5 mr-2 text-[#B3A369]" aria-hidden="true" />
                        Credit Distribution
                    </CardTitle>
                    <CardDescription>
                        Breakdown of your {totalCreditsRequired} required credits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        {!hasValidData || nonZeroDistribution.length === 0 ? (
                            <div className="text-center text-gray-500" role="status" aria-live="polite">
                                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                                <p>No credit data available</p>
                                <p className="text-sm mt-1">
                                    Add courses to see credit distribution
                                </p>
                            </div>
                        ) : (
                            <div role="img" aria-labelledby="chart-summary">
                                <div className="sr-only" id="chart-summary">
                                    Credit distribution chart showing {nonZeroDistribution.map(item => `${item.name}: ${item.value} credits (${item.percentage.toFixed(1)}%)`).join(', ')}
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={nonZeroDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            dataKey="value"
                                        >
                                            {nonZeroDistribution.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                    <div 
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4"
                        role="list"
                        aria-labelledby="credit-distribution-title"
                    >
                        {creditDistribution.map((item, index) => (
                            <div 
                                key={index} 
                                className="flex items-center space-x-2 min-h-[44px] p-1"
                                role="listitem"
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                    role="img"
                                    aria-label={`${item.name} color indicator`}
                                />
                                <span className="text-sm text-muted-foreground break-words">
                                    <span className="font-medium">{item.name}:</span> {item.value} credit{item.value !== 1 ? 's' : ''}
                                    {item.value > 0 && ` (${item.percentage.toFixed(1)}%)`}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default CreditDistributionChart;