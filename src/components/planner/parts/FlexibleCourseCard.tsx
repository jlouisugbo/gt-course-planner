"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Search, Plus, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Course } from "@/types/courses";
import { useAuth } from "@/providers/AuthProvider";
import { authService } from "@/lib/auth";

interface FlexibleCourseCardProps {
    title: string;
    requirementType: string;
    description?: string;
    onSelectCourse?: (course: Course) => void;
    selectedCourse?: Course | null;
    minCredits?: number;
    currentCredits?: number;
    selectionCount?: number;
    onRemoveCourse?: () => void;
}

export const FlexibleCourseCard: React.FC<FlexibleCourseCardProps> = ({
    title,
    requirementType,
    description,
    onSelectCourse,
    selectedCourse = null,
    minCredits = 0,
    currentCredits = 0,
    selectionCount = 0,
    onRemoveCourse
}) => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                type: requirementType,
                search: searchTerm.trim(),
            });
            
            if (user?.id) {
                params.append('userId', user.id);
            }
            
            const { data: sessionData } = await authService.getSession();
            if (!sessionData.session?.access_token) {
                console.error('Authentication required for flexible courses');
                return;
            }

            const response = await fetch(`/api/flexible-courses?${params}`, {
                headers: {
                    'Authorization': `Bearer ${sessionData.session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setSearchResults(data.courses || []);
            } else {
                console.error('Search failed:', data.error);
            }
        } catch (error) {
            console.error('Error searching flexible courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load default courses when dialog opens if no search term
    const handleDialogOpen = async (open: boolean) => {
        setIsDialogOpen(open);
        if (open && searchResults.length === 0) {
            // Load default courses for this requirement type
            await handleSearch();
        }
    };

    const handleCourseSelect = (course: Course) => {
        onSelectCourse?.(course);
        setIsDialogOpen(false);
        setSearchTerm("");
        setSearchResults([]);
    };

    // Calculate progress
    const isComplete = currentCredits >= minCredits;
    const progressPercentage = minCredits > 0 ? Math.min(100, (currentCredits / minCredits) * 100) : 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "group transition-all duration-200 hover:shadow-md cursor-pointer rounded-md p-3",
                    selectedCourse 
                        ? "bg-white border-2 border-slate-200 hover:border-[#B3A369]" 
                        : "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300"
                )}
                onClick={() => setIsDialogOpen(true)}
            >
                {selectedCourse ? (
                    // Show selected course
                    <>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="h-4 w-4 text-[#B3A369]" />
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200 font-medium">
                                    Selected
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {selectedCourse.credits}cr
                                </Badge>
                            </div>
                            {onRemoveCourse && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveCourse();
                                    }}
                                >
                                    ×
                                </Button>
                            )}
                        </div>

                        <h4 className="font-semibold text-slate-800 mb-1 text-sm">
                            {selectedCourse.code}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                            {selectedCourse.title}
                        </p>

                        {/* Progress indicator */}
                        {minCredits > 0 && (
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>{title}</span>
                                    <span>{currentCredits}/{minCredits} credits</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div 
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            isComplete ? "bg-green-500" : "bg-[#B3A369]"
                                        )}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-6 hover:bg-slate-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDialogOpen(true);
                            }}
                        >
                            <Search className="h-3 w-3 mr-1" />
                            Change Course
                        </Button>
                    </>
                ) : (
                    // Show flexible placeholder
                    <>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="h-4 w-4 text-amber-600" />
                                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200 font-medium">
                                    Flexible
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            >
                                <Search className="h-3 w-3" />
                            </Button>
                        </div>

                        <h4 className="font-semibold text-amber-800 mb-2 text-sm">
                            {title}
                        </h4>

                        {/* Requirement info */}
                        <div className="mb-2 space-y-1">
                            {minCredits > 0 && (
                                <p className="text-xs text-amber-700">
                                    {minCredits} credits required
                                </p>
                            )}
                            {selectionCount > 0 && (
                                <p className="text-xs text-amber-700">
                                    Choose {selectionCount} course{selectionCount !== 1 ? 's' : ''}
                                </p>
                            )}
                            {description && (
                                <p className="text-xs text-amber-700 line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>

                        <Button
                            size="sm"
                            className="w-full text-xs h-6 bg-amber-600 hover:bg-amber-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDialogOpen(true);
                            }}
                        >
                            <Search className="h-3 w-3 mr-1" />
                            Find Courses
                        </Button>
                    </>
                )}
            </motion.div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                            <span>Find Courses for {title}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Search courses (e.g., ECON, Economics, etc.)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} disabled={isLoading}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-2">
                            {isLoading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
                                    <p className="text-sm text-slate-600">Searching courses...</p>
                                </div>
                            )}

                            <AnimatePresence>
                                {searchResults.map((course) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                                              onClick={() => handleCourseSelect(course)}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="font-bold text-sm">{course.code}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {course.credits || 3}cr
                                                        </Badge>
                                                    </div>
                                                    <h4 className="font-medium text-sm line-clamp-1 mb-1">
                                                        {course.title}
                                                    </h4>
                                                    {course.description && (
                                                        <p className="text-xs text-slate-600 line-clamp-2">
                                                            {course.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button size="sm" variant="outline" className="ml-2">
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {!isLoading && searchResults.length === 0 && searchTerm && (
                                <div className="text-center py-8 text-slate-500">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No courses found for "{searchTerm}"</p>
                                    <p className="text-xs text-slate-400 mt-1">Try different search terms</p>
                                </div>
                            )}

                            {!searchTerm && (
                                <div className="text-center py-8 text-slate-500">
                                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Enter a search term to find courses</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        For {requirementType.toLowerCase()}, try searching relevant terms
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};