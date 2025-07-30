"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, BookOpen, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { VisualDegreeProgram, VisualMinorProgram } from "@/types/requirements";
import { RequirementSection } from "./parts/RequirementSection";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/AuthProvider";
import { useCompletionTracking } from "@/hooks/useCompletionTracking";

const RequirementsPanel: React.FC = () => {
    const { user } = useAuth();
    const [degreeProgram, setDegreeProgram] = useState<VisualDegreeProgram | null>(null);
    const [minorPrograms, setMinorPrograms] = useState<VisualMinorProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Use centralized completion tracking
    const { 
        completedCourses, 
        plannedCourses,
        completedGroups, 
        toggleCourseCompletion, 
        setGroupCompletion
    } = useCompletionTracking();
    
    useEffect(() => {
        const loadRequirements = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (!user) {
                    setError('User not authenticated');
                    return;
                }

                // Get user's major
                const { data: userRecord, error: userError } = await supabase
                    .from('users')
                    .select('major, minors')
                    .eq('auth_id', user.id)
                    .single();

                if (userError || !userRecord?.major) {
                    setError('User major not found. Please complete profile setup.');
                    return;
                }

                // Fetch degree program via API
                const degreeResponse = await fetch(`/api/degree-programs?major=${encodeURIComponent(userRecord.major)}`);
                
                if (!degreeResponse.ok) {
                    setError(`No degree program found for ${userRecord.major}`);
                    return;
                }
                
                const degreeData = await degreeResponse.json();
                
                // Convert to VisualDegreeProgram format
                const visualDegreeProgram: VisualDegreeProgram = {
                    id: degreeData.id,
                    name: degreeData.name,
                    degreeType: degreeData.degree_type,
                    college: undefined,
                    totalCredits: degreeData.total_credits,
                    requirements: Array.isArray(degreeData.requirements) ? degreeData.requirements : [],
                    footnotes: Array.isArray(degreeData.footnotes) ? degreeData.footnotes : []
                };
                
                setDegreeProgram(visualDegreeProgram);

                // Handle minors if they exist
                const minorPrograms: VisualMinorProgram[] = [];
                if (userRecord.minors && Array.isArray(userRecord.minors) && userRecord.minors.length > 0) {
                    console.log('Loading minors:', userRecord.minors);
                    // Fetch minor programs with degree_type = 'Minor'
                    for (const minorName of userRecord.minors) {
                        try {
                            const minorResponse = await fetch(`/api/degree-programs?major=${encodeURIComponent(minorName)}&degree_type=Minor`);
                            if (minorResponse.ok) {
                                const minorData = await minorResponse.json();
                                minorPrograms.push({
                                    id: minorData.id,
                                    name: minorData.name,
                                    requirements: Array.isArray(minorData.requirements) ? minorData.requirements : [],
                                    footnotes: Array.isArray(minorData.footnotes) ? minorData.footnotes : []
                                });
                                console.log(`✅ Successfully loaded minor: ${minorName}`);
                            } else {
                                console.warn(`❌ Failed to load minor ${minorName}: ${minorResponse.statusText}`);
                            }
                        } catch (minorError) {
                            console.warn(`❌ Error loading minor: ${minorName}`, minorError);
                        }
                    }
                }
                
                setMinorPrograms(minorPrograms);
                
            } catch (err) {
                console.error('Error loading requirements:', err);
                setError('Failed to load requirements data');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadRequirements();
        }
    }, [user]);

    // Completion handlers are now provided by useCompletionTracking hook

    if (loading) {
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
                        <div className="flex items-center space-x-3 text-red-600">
                            <AlertCircle className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold">Error Loading Requirements</h3>
                                <p className="text-sm text-slate-600">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show simple message if no degree program is found (without setup validation)
    if (!loading && !degreeProgram) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
                <Card className="max-w-lg w-full">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <GraduationCap className="h-12 w-12 text-[#003057] mx-auto" />
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Requirements Found</h3>
                                <p className="text-slate-600 mb-4">
                                    No degree program requirements were found for your major. Check the console for more details.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hasMinors = minorPrograms && minorPrograms.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-[#003057]/5 to-[#B3A369]/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-tr from-[#B3A369]/5 to-[#003057]/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-radial from-blue-100/20 to-transparent rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-8"
                >
                    {/* Enhanced Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <motion.div 
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#003057] via-[#004080] to-[#B3A369] rounded-xl flex items-center justify-center shadow-lg">
                                    <GraduationCap className="h-8 w-8 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#003057] to-[#B3A369] bg-clip-text text-transparent">
                                    Degree Requirements
                                </h1>
                                <p className="text-slate-600 text-lg">
                                    Track your academic progress and requirements
                                </p>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            className="flex items-center space-x-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {degreeProgram && (
                                <Badge 
                                    variant="outline" 
                                    className="px-4 py-2 text-base font-semibold bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800"
                                >
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {degreeProgram.totalCredits || 120} Total Credits
                                </Badge>
                            )}
                        </motion.div>
                    </div>

                    {/* Enhanced Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-sm">
                            <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                                <CardTitle className="flex items-center space-x-3 text-xl">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#B3A369] to-[#D4C284] rounded-lg flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="bg-gradient-to-r from-[#003057] to-[#004080] bg-clip-text text-transparent font-bold">
                                        Academic Requirements
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Tabs defaultValue="degree" className="w-full">
                                    <TabsList className={`grid w-full mb-6 p-1 h-auto bg-slate-100/50 rounded-xl ${
                                        hasMinors ? `grid-cols-${Math.min(minorPrograms.length + 1, 4)}` : 'grid-cols-1'
                                    }`}>
                                        <TabsTrigger 
                                            value="degree" 
                                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#003057] data-[state=active]:to-[#004080] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-2 px-3 rounded-lg font-semibold text-sm"
                                        >
                                            <GraduationCap className="h-3 w-3 mr-1" />
                                            <span className="truncate">{degreeProgram?.name || 'Degree Program'}</span>
                                        </TabsTrigger>
                                        {hasMinors && minorPrograms.map((minor, index) => (
                                            <TabsTrigger 
                                                key={minor.id} 
                                                value={`minor-${index}`}
                                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B3A369] data-[state=active]:to-[#D4C284] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-2 px-3 rounded-lg font-semibold text-sm"
                                                title={minor.name}
                                            >
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                <span className="truncate">{minor.name}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {/* Degree Program Tab */}
                                    <TabsContent value="degree" className="space-y-6">
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
                                        <TabsContent key={minor.id} value={`minor-${index}`} className="space-y-6">
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
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default RequirementsPanel;