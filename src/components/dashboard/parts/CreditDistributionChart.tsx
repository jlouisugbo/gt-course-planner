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
            color: "#3B82F6",
            percentage: hasValidData ? (creditsInProgress / totalCreditsRequired) * 100 : 0,
        },
        {
            name: "Planned",
            value: creditsPlanned,
            color: "#F59E0B",
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
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        Credit Distribution
                    </CardTitle>
                    <CardDescription>
                        Breakdown of your {totalCreditsRequired} required credits
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        {!hasValidData || nonZeroDistribution.length === 0 ? (
                            <div className="text-center text-gray-500">
                                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No credit data available</p>
                                <p className="text-sm mt-1">
                                    Add courses to see credit distribution
                                </p>
                            </div>
                        ) : (
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
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {creditDistribution.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-slate-600">
                                    {item.name}: {item.value}
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