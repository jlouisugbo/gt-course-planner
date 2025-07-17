"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle } from "lucide-react";
import { SemesterData } from "@/types/courses";
import { motion } from "framer-motion";
import SemesterColumn from "./SemesterColumn";

interface AcademicYearCardProps {
    academicYear?: string;
    semesters?: SemesterData[];
}

const AcademicYearCard: React.FC<AcademicYearCardProps> = ({
    academicYear = "Unknown",
    semesters = [],
}) => {
    // Safe array validation and filtering
    const validSemesters = Array.isArray(semesters) 
        ? semesters.filter(semester => 
            semester && 
            typeof semester === 'object' &&
            typeof semester.id !== 'undefined' &&
            typeof semester.season === 'string' &&
            typeof semester.year === 'number'
          )
        : [];

    // Safe calculations with fallbacks
    const totalCredits = validSemesters.reduce((sum, semester) => {
        const semesterCredits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
        return sum + semesterCredits;
    }, 0);

    const hasOverload = validSemesters.some(semester => {
        const totalCredits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
        const maxCredits = typeof semester.maxCredits === 'number' ? semester.maxCredits : 18;
        return totalCredits > maxCredits;
    });

    const isCurrentYear = validSemesters.some(semester => Boolean(semester.isActive));

    // Sort semesters: Fall, Spring, Summer with safety checks
    const sortedSemesters = [...validSemesters].sort((a, b) => {
        const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
        const aSeason = typeof a.season === 'string' ? a.season : 'Fall';
        const bSeason = typeof b.season === 'string' ? b.season : 'Fall';
        return (seasonOrder[aSeason] || 0) - (seasonOrder[bSeason] || 0);
    });

    // Show empty state if no valid semesters
    if (validSemesters.length === 0) {
        return (
            <Card className="academic-year-card border-slate-300">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-[#B3A369]" />
                        Academic Year {academicYear}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No semester data available for this academic year</p>
                        <p className="text-sm mt-1">
                            Add courses to see semester breakdown
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="academic-year-card border-slate-300">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-[#B3A369]" />
                        Academic Year {academicYear}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        {isCurrentYear && (
                            <Badge className="bg-[#003057] text-white">
                                Current Year
                            </Badge>
                        )}
                        {hasOverload && (
                            <Badge
                                variant="destructive"
                                className="bg-red-500 text-white"
                            >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overloaded
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-slate-300">
                            {totalCredits} Credits
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sortedSemesters.map((semester, index) => (
                        <motion.div
                            key={semester?.id || `semester-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SemesterColumn semester={semester} />
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default AcademicYearCard;