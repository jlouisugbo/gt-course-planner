"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface Deadline {
    id: string;
    title: string;
    date: Date;
    daysLeft: number;
    type: 'registration' | 'deadline' | 'graduation';
}

interface DashboardDeadlinesProps {
    deadlines: Deadline[];
}

export const DashboardDeadlines: React.FC<DashboardDeadlinesProps> = ({ deadlines }) => {
    // If no deadlines from database, show some sample important dates
    const displayDeadlines = deadlines.length > 0 ? deadlines : [
        {
            id: "1",
            title: "Course Registration Opens",
            date: new Date(2025, 2, 15), // March 15, 2025
            daysLeft: Math.ceil((new Date(2025, 2, 15).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            type: "registration" as const
        },
        {
            id: "2", 
            title: "Add/Drop Deadline",
            date: new Date(2025, 7, 25), // August 25, 2025
            daysLeft: Math.ceil((new Date(2025, 7, 25).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            type: "deadline" as const
        },
        {
            id: "3",
            title: "Graduation Application Due",
            date: new Date(2025, 1, 1), // February 1, 2025
            daysLeft: Math.ceil((new Date(2025, 1, 1).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            type: "graduation" as const
        }
    ].filter(d => d.daysLeft > -30); // Show past deadlines up to 30 days

    const getDeadlineIcon = (type: string) => {
        switch (type) {
            case 'registration':
                return Calendar;
            case 'graduation':
                return CheckCircle;
            default:
                return Clock;
        }
    };

    const getDeadlineColor = (daysLeft: number) => {
        if (daysLeft < 0) return "text-slate-500";
        if (daysLeft <= 7) return "text-red-600";
        if (daysLeft <= 30) return "text-yellow-600";
        return "text-green-600";
    };

    const getDeadlineBadge = (daysLeft: number) => {
        if (daysLeft < 0) return { variant: "secondary" as const, text: "Passed" };
        if (daysLeft === 0) return { variant: "destructive" as const, text: "Today" };
        if (daysLeft <= 7) return { variant: "destructive" as const, text: `${daysLeft} days` };
        if (daysLeft <= 30) return { variant: "secondary" as const, text: `${daysLeft} days` };
        return { variant: "outline" as const, text: `${daysLeft} days` };
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span>Upcoming Deadlines</span>
                        {deadlines.filter(d => d.daysLeft <= 7 && d.daysLeft >= 0).length > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                                {deadlines.filter(d => d.daysLeft <= 7 && d.daysLeft >= 0).length} urgent
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {displayDeadlines.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming deadlines</p>
                            <p className="text-sm">Check back later for important dates</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayDeadlines.slice(0, 5).map((deadline, index) => {
                                const Icon = getDeadlineIcon(deadline.type);
                                const badge = getDeadlineBadge(deadline.daysLeft);
                                
                                return (
                                    <motion.div
                                        key={deadline.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-4 border-l-4 rounded-lg transition-colors ${
                                            deadline.daysLeft <= 7 && deadline.daysLeft >= 0
                                                ? 'border-l-red-500 bg-red-50'
                                                : deadline.daysLeft <= 30 && deadline.daysLeft >= 0
                                                ? 'border-l-yellow-500 bg-yellow-50'
                                                : 'border-l-slate-300 bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Icon className={`h-5 w-5 ${getDeadlineColor(deadline.daysLeft)}`} />
                                                <div>
                                                    <h4 className="font-medium text-slate-900">
                                                        {deadline.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-600">
                                                        {deadline.date.toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={badge.variant}>
                                                {badge.text}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {deadlines.length > 5 && (
                                <div className="text-center pt-4 border-t">
                                    <Button variant="outline" size="sm">
                                        View All Deadlines ({deadlines.length})
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