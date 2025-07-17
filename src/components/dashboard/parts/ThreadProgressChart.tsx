// ThreadProgressChart.tsx - With safety checks
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface ThreadProgressChartProps {
    threadProgress?: any[];
    delay?: number;
}

const ThreadProgressChart = ({ threadProgress, delay = 0 }: ThreadProgressChartProps) => {
    // Safe array access and validation
    const safeThreadProgress = Array.isArray(threadProgress) ? threadProgress : [];
    
    // Filter out invalid thread data
    const validThreadProgress = safeThreadProgress.filter(thread => 
        thread && 
        typeof thread === 'object' &&
        thread.name &&
        typeof thread.completed === 'number' &&
        typeof thread.required === 'number' &&
        thread.required > 0
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        CS Thread Progress
                    </CardTitle>
                    <CardDescription>
                        Progress toward specialization threads
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {validThreadProgress.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No thread progress data available</p>
                            <p className="text-sm mt-1">
                                Select specialization threads to track progress
                            </p>
                        </div>
                    ) : (
                        validThreadProgress.map((thread, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium">{thread.name || 'Unknown Thread'}</span>
                                    <span>
                                        {thread.completed || 0}/{thread.required || 0} credits
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(((thread.completed || 0) / (thread.required || 1)) * 100, 100)}
                                    className="h-3"
                                />
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ThreadProgressChart;