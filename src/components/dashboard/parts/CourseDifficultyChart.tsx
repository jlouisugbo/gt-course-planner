"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

interface CourseDifficultyChartProps {
    allCourses: any[];
    delay: number;
}

const CourseDifficultyChart = ({ allCourses, delay }: CourseDifficultyChartProps) => {
    // Safe array access and filtering
    const safeCourses = allCourses || [];
    
    // Calculate difficulty distribution with safe property access
    const difficultyDistribution = [
        {
            difficulty: "1-2 (Easy)",
            count: safeCourses.filter((c) => 
                c && 
                typeof c.difficulty === 'number' && 
                c.difficulty <= 2
            ).length,
            color: "#10B981",
        },
        {
            difficulty: "3 (Medium)",
            count: safeCourses.filter((c) => 
                c && 
                c.difficulty === 3
            ).length,
            color: "#F59E0B",
        },
        {
            difficulty: "4-5 (Hard)",
            count: safeCourses.filter((c) => 
                c && 
                typeof c.difficulty === 'number' && 
                c.difficulty >= 4
            ).length,
            color: "#EF4444",
        },
    ];

    // Show loading or empty state if no courses
    if (safeCourses.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
            >
                <Card className="border-slate-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Course Difficulty Distribution
                        </CardTitle>
                        <CardDescription>
                            Breakdown of course difficulty levels
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No course data available
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Check if any courses have difficulty data
    const coursesWithDifficulty = safeCourses.filter(c => 
        c && typeof c.difficulty === 'number'
    );

    if (coursesWithDifficulty.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
            >
                <Card className="border-slate-300">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Course Difficulty Distribution
                        </CardTitle>
                        <CardDescription>
                            Breakdown of course difficulty levels
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Difficulty data not available for courses</p>
                                <p className="text-sm mt-1">
                                    {safeCourses.length} courses found without difficulty ratings
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Course Difficulty Distribution
                    </CardTitle>
                    <CardDescription>
                        Breakdown of course difficulty levels ({coursesWithDifficulty.length} courses)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={difficultyDistribution}>
                                <XAxis 
                                    dataKey="difficulty" 
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Bar 
                                    dataKey="count" 
                                    fill="#B3A369" 
                                    radius={[4, 4, 0, 0]} 
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Optional: Show summary stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        {difficultyDistribution.map((item, index) => (
                            <div key={index} className="text-center">
                                <div 
                                    className="w-4 h-4 rounded mx-auto mb-1"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="font-medium">{item.count}</div>
                                <div className="text-gray-500 text-xs">{item.difficulty}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default CourseDifficultyChart;