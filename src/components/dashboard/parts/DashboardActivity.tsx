"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Plus } from "lucide-react";
import { DashboardActivity as ActivityType } from "@/hooks/useDashboardData";

interface DashboardActivityProps {
    activities: ActivityType[];
}

export const DashboardActivity: React.FC<DashboardActivityProps> = ({ activities }) => {
    // Sample activities if none exist
    const displayActivities = activities.length > 0 ? activities : [
        {
            id: "1",
            type: "course_completed" as const,
            title: "Welcome to GT Course Planner!",
            description: "Start by adding courses to your planner",
            timestamp: new Date(),
            icon: "🎉"
        },
        {
            id: "2", 
            type: "course_added" as const,
            title: "Set up your profile",
            description: "Complete your academic profile to get personalized recommendations",
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            icon: "👤"
        }
    ];

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'course_completed':
            case 'requirement_completed':
                return 'text-green-600 bg-green-100';
            case 'course_added':
                return 'text-blue-600 bg-blue-100';
            case 'semester_planned':
                return 'text-purple-600 bg-purple-100';
            case 'gpa_updated':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-slate-600 bg-slate-100';
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-slate-600" />
                            <span>Recent Activity</span>
                        </div>
                        <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Course
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {displayActivities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent activity</p>
                            <p className="text-sm">Start planning your courses to see activity here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayActivities.slice(0, 8).map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.type)}`}>
                                        {activity.icon}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-slate-900 truncate">
                                                {activity.title}
                                            </h4>
                                            <div className="flex items-center space-x-2 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimeAgo(activity.timestamp)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">
                                            {activity.description}
                                        </p>
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {activities.length > 8 && (
                                <div className="text-center pt-4 border-t">
                                    <Button variant="outline" size="sm">
                                        View All Activity
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};