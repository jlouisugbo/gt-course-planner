"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Plus, Eye } from "lucide-react";

interface RecentActivityPanelProps {
    recentActivity?: any[];
    delay?: number;
}

const RecentActivityPanel = ({ recentActivity, delay = 0 }: RecentActivityPanelProps) => {
    // Safe array access and validation
    const safeRecentActivity = Array.isArray(recentActivity) ? recentActivity : [];
    
    // Filter and validate activity items
    const validActivities = safeRecentActivity.filter(activity => 
        activity && 
        typeof activity === 'object' &&
        activity.id !== undefined
    );

    // Take only first 5 activities
    const displayActivities = validActivities.slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>
                        Your latest planning updates and changes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {displayActivities.length > 0 ? (
                            displayActivities.map((activity, index) => {
                                // Safe property access for each activity
                                const activityId = activity?.id || `activity-${index}`;
                                const title = activity?.title || "Unknown Activity";
                                const description = activity?.description || "No description available";
                                const timestamp = activity?.timestamp;
                                
                                // Safe date formatting
                                let formattedDate = "Unknown date";
                                if (timestamp) {
                                    try {
                                        const date = new Date(timestamp);
                                        if (!isNaN(date.getTime())) {
                                            formattedDate = date.toLocaleDateString();
                                        }
                                    } catch (error) {
                                        console.warn("Invalid timestamp:", timestamp, error);
                                    }
                                }

                                return (
                                    <motion.div
                                        key={activityId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 + index * 0.1 }}
                                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Plus className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                {title}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {description}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formattedDate}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                                <p className="text-xs mt-1">
                                    Start planning to see your activity here
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default RecentActivityPanel;