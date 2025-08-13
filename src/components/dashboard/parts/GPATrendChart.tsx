// GPATrendChart.tsx - With safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { GPAHistoryItem } from "@/types/dashboard";

interface GPATrendChartProps {
    gpaHistory?: GPAHistoryItem[];
    delay?: number;
}

const GPATrendChart = ({ gpaHistory, delay = 0 }: GPATrendChartProps) => {
    // Safe array access and validation
    const safeGpaHistory = Array.isArray(gpaHistory) ? gpaHistory : [];
    
    // Filter out invalid data points
    const validGpaHistory = safeGpaHistory.filter(point => 
        point && 
        typeof point === 'object' &&
        point.semester &&
        typeof point.gpa === 'number' &&
        !isNaN(point.gpa)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-l-4 border-l-[#B3A369]/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-[#003057]">
                        <TrendingUp className="h-5 w-5 mr-2 text-[#B3A369]" />
                        GPA Trend
                    </CardTitle>
                    <CardDescription>
                        Historical and projected GPA performance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        {validGpaHistory.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No GPA history available</p>
                                    <p className="text-sm mt-1">
                                        Complete some courses to see your GPA trend
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={validGpaHistory}>
                                    <XAxis
                                        dataKey="semester"
                                        tick={{ fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis domain={[3.0, 4.0]} tick={{ fontSize: 12 }} />
                                    <Area
                                        type="monotone"
                                        dataKey="gpa"
                                        stroke="#B3A369"
                                        fill="#B3A369"
                                        fillOpacity={0.3}
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default GPATrendChart;