"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineOverviewProps {
    data?: {
        semesters?: Record<string, any> | null;
    } | null;
}

const TimelineOverview = ({ data }: TimelineOverviewProps) => {
    // Safe data extraction
    const safeData = data || {};
    const semesters = safeData.semesters || {};

    // Convert to array and validate semester objects
    const semesterArray = Object.values(semesters).filter(semester => 
        semester && 
        typeof semester === 'object' &&
        typeof semester.id !== 'undefined' &&
        typeof semester.season === 'string' &&
        typeof semester.year === 'number'
    );

    // Take first 8 semesters for display
    const displaySemesters = semesterArray.slice(0, 8);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
        >
            <Card className="border-slate-300">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Academic Timeline Overview
                    </CardTitle>
                    <CardDescription>
                        Your semester-by-semester journey
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {displaySemesters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No semester data available</p>
                            <p className="text-sm mt-1">
                                Generate your academic timeline to see progress
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {displaySemesters.map((semester: any, index) => {
                                // Safe property access for each semester
                                const semesterId = semester?.id || `semester-${index}`;
                                const season = semester?.season || 'Unknown';
                                const year = semester?.year || new Date().getFullYear();
                                const totalCredits = semester?.totalCredits || 0;
                                const isActive = semester?.isActive || false;
                                const courses = Array.isArray(semester?.courses) ? semester.courses : [];
                                
                                // Check if all courses are completed
                                const allCoursesCompleted = courses.length > 0 && 
                                    courses.every((c: any) => c?.status === "completed");

                                return (
                                    <motion.div
                                        key={semesterId}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.4 + index * 0.1 }}
                                        className={cn(
                                            "p-3 rounded-lg border-2 transition-colors",
                                            allCoursesCompleted
                                                ? "bg-green-50 border-green-200"
                                                : isActive
                                                ? "bg-blue-50 border-blue-300 border-dashed"
                                                : "bg-slate-50 border-slate-200"
                                        )}
                                    >
                                        <div className="text-xs font-medium text-slate-600 mb-1">
                                            {season} {year}
                                        </div>
                                        <div className="text-lg font-bold text-slate-900">
                                            {totalCredits}cr
                                        </div>
                                        <div className="flex items-center mt-2">
                                            {allCoursesCompleted && (
                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                            )}
                                            {isActive && (
                                                <Clock className="h-3 w-3 text-blue-600" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TimelineOverview;