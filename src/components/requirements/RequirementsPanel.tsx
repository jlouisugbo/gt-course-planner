"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { VisualDegreeProgram, VisualMinorProgram } from "@/types/requirements";
import { RequirementSection } from "./parts/RequirementSection";
import { useCompletionTracking } from "@/hooks/useCompletionTracking";
import { useReliableDataLoader } from "@/hooks/useReliableDataLoader";

const RequirementsPanel: React.FC = () => {
    // Use reliable data loader (only one instance should load globally)
    const {
        userProfile,
        degreeProgram: degreeData,
        minorPrograms: minorData,
        isLoading,
        error,
        isInitialized,
        reload
    } = useReliableDataLoader();
    
    // Use centralized completion tracking
    const { 
        completedCourses, 
        plannedCourses,
        completedGroups, 
        toggleCourseCompletion, 
        setGroupCompletion
    } = useCompletionTracking();

    // Convert data to VisualDegreeProgram format for compatibility
    const degreeProgram: VisualDegreeProgram | null = degreeData ? {
        id: (degreeData as any).id ?? 0,
        name: (degreeData as any).name ?? 'Degree',
        code: (degreeData as any).code ?? 'UNK',
        college: (degreeData as any).college ?? 'Unknown',
        totalCredits: (degreeData as any).totalCredits ?? 120,
        minGpa: 0,
        isActive: true,
        requirements: (degreeData as any).requirements ?? [],
        footnotes: (degreeData as any).footnotes ?? []
    } : null;

    // Convert minor programs to VisualMinorProgram format
    const minorPrograms: VisualMinorProgram[] = minorData.map((minor: any) => ({
        id: minor.id,
        name: minor.name,
        code: minor.code ?? 'MIN',
        college: minor.college ?? 'Unknown',
        totalCredits: minor.totalCredits ?? 18,
        minGpa: 0,
        isActive: true,
        requirements: minor.requirements ?? [],
        footnotes: minor.footnotes ?? []
    }));
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <Loader2 className="h-8 w-8 animate-spin text-[#003057]" />
                    <p className="text-lg text-slate-600">Loading requirements...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-red-600">
                                <AlertCircle className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold">Error Loading Requirements</h3>
                                    <p className="text-sm text-slate-600">{error}</p>
                                </div>
                            </div>
                            <Button onClick={reload} variant="outline" className="w-full">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show simple message if no degree program is found
    if (!isLoading && !degreeProgram && isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
                <Card className="max-w-lg w-full">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <GraduationCap className="h-12 w-12 text-[#003057] mx-auto" />
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Requirements Found</h3>
                                <p className="text-slate-600 mb-4">
                                    No degree program requirements were found for your major: {userProfile?.major || 'Unknown'}
                                </p>
                                <Button onClick={reload} variant="outline" className="mt-2">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hasMinors = minorPrograms && minorPrograms.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <div className="container mx-auto px-3 py-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-3"
                >
                    {/* Compact Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#003057] to-[#004080] rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">
                                    Degree Requirements
                                </h1>
                                <p className="text-sm text-slate-600">
                                    {userProfile?.major || 'Loading...'} • {degreeProgram?.totalCredits || 120} credits
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {degreeProgram && (
                                <Badge 
                                    variant="outline" 
                                    className="px-2 py-1 text-sm bg-blue-50 border-blue-200 text-blue-800"
                                >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {degreeProgram.totalCredits || 120} Total
                                </Badge>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={reload}
                                disabled={isLoading}
                                className="h-8"
                            >
                                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div>
                        <Card className="shadow-sm border bg-white">
                            <CardContent className="p-3">
                                <Tabs defaultValue="degree" className="w-full">
                                    <TabsList className={`grid w-full mb-3 p-0.5 h-auto bg-slate-100 ${
                                        hasMinors ? `grid-cols-${Math.min(minorPrograms.length + 1, 4)}` : 'grid-cols-1'
                                    }`}>
                                        <TabsTrigger 
                                            value="degree" 
                                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 py-1.5 px-2 text-xs font-medium"
                                        >
                                            <GraduationCap className="h-3 w-3 mr-1" />
                                            <span className="truncate">{degreeProgram?.name || 'Degree'}</span>
                                        </TabsTrigger>
                                        {hasMinors && minorPrograms.map((minor, index) => (
                                            <TabsTrigger 
                                                key={minor.id} 
                                                value={`minor-${index}`}
                                                className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white transition-all duration-200 py-1.5 px-2 text-xs font-medium"
                                                title={minor.name}
                                            >
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                <span className="truncate">{minor.name}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {/* Degree Program Tab */}
                                    <TabsContent value="degree" className="space-y-2">
                                        {degreeProgram ? (
                                            <RequirementSection
                                                program={degreeProgram}
                                                type="degree"
                                                completedCourses={completedCourses}
                                                plannedCourses={plannedCourses}
                                                completedGroups={completedGroups}
                                                onCourseToggle={toggleCourseCompletion}
                                                onGroupCompletion={setGroupCompletion}
                                            />
                                        ) : (
                                            <motion.div 
                                                className="text-center py-16"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <BookOpen className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Degree Program Found</h3>
                                                <p className="text-slate-500">
                                                    Please ensure your degree program is properly configured in your profile.
                                                </p>
                                            </motion.div>
                                        )}
                                    </TabsContent>

                                    {/* Minor Program Tabs */}
                                    {hasMinors && minorPrograms.map((minor, index) => (
                                        <TabsContent key={minor.id} value={`minor-${index}`} className="space-y-2">
                                            <RequirementSection
                                                program={minor}
                                                type="minor"
                                                completedCourses={completedCourses}
                                                plannedCourses={plannedCourses}
                                                completedGroups={completedGroups}
                                                onCourseToggle={toggleCourseCompletion}
                                                onGroupCompletion={setGroupCompletion}
                                            />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RequirementsPanel;