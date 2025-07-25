"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, User, GraduationCap } from "lucide-react";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion } from "framer-motion";
import AcademicYearCard from "./parts/AcademicYearCard";
import ProfileSetup from "@/components/profile/ProfileSetup";
import CourseRecommendations from "./CourseRecommendations";

const PlannerGrid = () => {

    const { semesters, studentInfo, userProfile } = usePlannerStore();
    const [showProfileSetup, setShowProfileSetup] = useState(false);

    const safeSemesters = useMemo(() => {
        return semesters && typeof semesters === 'object' ? semesters : {};
    }, [semesters]);

    const safeStudentInfo = useMemo(() => {
        return studentInfo && typeof studentInfo === 'object' ? studentInfo : {};
    }, [studentInfo]);

    const safeUserProfile = useMemo(() => {
        return userProfile && typeof userProfile === 'object' ? userProfile : null;
    }, [userProfile]);

    // Group semesters by academic year - memoized to prevent recalculation
    const groupSemestersByAcademicYear = useMemo(() => {
        const semesterArray = Object.values(safeSemesters)
            .filter(semester => 
                semester && 
                typeof semester === 'object' &&
                typeof semester.year === 'number' &&
                typeof semester.season === 'string'
            )
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
                return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
            });

        const academicYears: { [key: string]: any[] } = {};

        semesterArray.forEach((semester) => {
            let academicYear: string;

            // Academic year starts with Fall semester
            // Fall 2024 -> 2024-2025 academic year
            // Spring 2025 -> 2024-2025 academic year  
            // Summer 2025 -> 2024-2025 academic year
            if (semester.season === "Fall") {
                academicYear = `${semester.year}-${semester.year + 1}`;
            } else { // Spring or Summer
                academicYear = `${semester.year - 1}-${semester.year}`;
            }

            if (!academicYears[academicYear]) {
                academicYears[academicYear] = [];
            }

            academicYears[academicYear].push(semester);
        });

        // Sort each academic year's semesters properly
        Object.keys(academicYears).forEach(year => {
            academicYears[year].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
                return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
            });
        });

        // Sort academic years chronologically
        const sortedAcademicYears: { [key: string]: any[] } = {};
        Object.keys(academicYears)
            .sort((a, b) => {
                const yearA = parseInt(a.split('-')[0]);
                const yearB = parseInt(b.split('-')[0]);
                return yearA - yearB;
            })
            .forEach(year => {
                sortedAcademicYears[year] = academicYears[year];
            });

        return sortedAcademicYears;
    }, [safeSemesters]);

    // Memoize calculations with safety checks
    const totalCreditsPlanned = useMemo(() => {
        return Object.values(safeSemesters)
            .filter(semester => semester && typeof semester === 'object')
            .reduce((sum, semester) => {
                const credits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
                return sum + credits;
            }, 0);
    }, [safeSemesters]);

    const averageCreditsPerSemester = useMemo(() => {
        const academicYearCount = Object.keys(groupSemestersByAcademicYear).length;
        return academicYearCount > 0
            ? totalCreditsPlanned / (academicYearCount * 2.5)
            : 0;
    }, [groupSemestersByAcademicYear, totalCreditsPlanned]);

    // Memoize handlers
    const handleProfileSetupOpen = useCallback(() => {
        setShowProfileSetup(true);
    }, []);

    const handleProfileSetupClose = useCallback(() => {
        setShowProfileSetup(false);
    }, []);

    // Safe graduation date access
    const expectedGraduation = (safeStudentInfo as any).expectedGraduation || 
        (typeof (safeStudentInfo as any).graduationYear === 'number' ? `Spring ${(safeStudentInfo as any).graduationYear}` : 'TBD');

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-[1800px] mx-auto p-6 space-y-8 min-h-screen">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">
                            Academic Plan
                        </h1>
                        <p className="text-base text-slate-600">
                            Plan your 4-year journey at Georgia Tech
                        </p>
                    </div>

                    <div className="mt-3 lg:mt-0 flex items-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleProfileSetupOpen}
                            className="border-slate-300 text-sm h-9"
                        >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </Button>
                        <Button
                            variant="outline"
                            className="border-slate-300 text-sm h-9"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <Button className="bg-[#003057] hover:bg-[#b3a369] text-sm h-9 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Student Info Banner */}
                {safeUserProfile && (
                    <Card className="gt-gradient text-white border-0 mb-12">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {safeUserProfile.name || 'Student'}
                                    </h3>
                                    <p className="text-sm opacity-90">
                                        {safeUserProfile.major || 'Undeclared'} •{" "}
                                        {safeUserProfile.startDate || 'TBD'} -{" "}
                                        {safeUserProfile.expectedGraduation || 'TBD'}
                                    </p>
                                    {Array.isArray(safeUserProfile.threads) && safeUserProfile.threads.length > 0 && (
                                        <div className="flex space-x-2 mt-2">
                                            {safeUserProfile.threads.map((thread, index) => (
                                                <Badge
                                                    key={`${thread}-${index}`}
                                                    variant="secondary"
                                                    className="bg-white/20 text-white border-white/30 text-xs"
                                                >
                                                    {thread}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold">
                                        {typeof safeUserProfile.currentGPA === 'number' 
                                            ? safeUserProfile.currentGPA.toFixed(2) 
                                            : '0.00'}
                                    </div>
                                    <div className="text-sm opacity-90">
                                        Current GPA
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Content Grid - Increased spacing and height */}
                <div className="grid grid-cols-1 xl:grid-cols-7 gap-8 mb-16">
                    {/* Course Recommendations Sidebar - Taller with more padding */}
                    <div className="xl:col-span-2">
                        <div className="sticky top-6 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                            <CourseRecommendations />
                        </div>
                    </div>
                    
                    {/* Academic Years Grid - Taller and more spaced */}
                    <div className="xl:col-span-5">
                        <div className="space-y-8 min-h-[calc(100vh-200px)]">
                            {Object.keys(groupSemestersByAcademicYear).length === 0 ? (
                                <Card className="border-slate-300 py-16">
                                    <CardContent className="text-center py-8">
                                        <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                        <p className="text-gray-600">No academic years planned yet</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Set up your profile to generate semester plan
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                Object.entries(groupSemestersByAcademicYear).map(
                                    ([academicYear, yearSemesters], index) => (
                                        <motion.div
                                            key={academicYear}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="mb-8"
                                        >
                                            <AcademicYearCard
                                                academicYear={academicYear}
                                                semesters={yearSemesters}
                                            />
                                        </motion.div>
                                    ),
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Plan Summary - Pushed much further down with more spacing */}
                <div className="mt-24 pt-16 border-t border-slate-200">
                    <Card className="academic-year-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-slate-900 text-xl">
                                <GraduationCap className="h-6 w-6 mr-3" />
                                Plan Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold text-slate-900 mb-1">
                                        {totalCreditsPlanned}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Total Credits
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold text-slate-900 mb-1">
                                        {Object.keys(groupSemestersByAcademicYear).length}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Academic Years
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold text-slate-900 mb-1">
                                        {averageCreditsPerSemester.toFixed(1)}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Avg Credits/Sem
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold text-[#B3A369] mb-1">
                                        {expectedGraduation}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        Graduation
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Setup Modal */}
                {showProfileSetup && (
                    <ProfileSetup
                        isOpen={showProfileSetup}
                        onClose={handleProfileSetupClose}
                        existingProfile={safeUserProfile || undefined}
                    />
                )}
            </div>
        </div>
    );
};

export default PlannerGrid;