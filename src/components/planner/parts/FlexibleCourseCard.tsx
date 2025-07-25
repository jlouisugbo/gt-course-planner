"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Search, Plus, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Course } from "@/types/courses";

interface FlexibleCourseCardProps {
    title: string;
    requirementType: string;
    description?: string;
    onSelectCourse?: (course: Course) => void;
}

export const FlexibleCourseCard: React.FC<FlexibleCourseCardProps> = ({
    title,
    requirementType,
    description,
    onSelectCourse
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(`/api/flexible-courses?type=${encodeURIComponent(requirementType)}&search=${encodeURIComponent(searchTerm)}`);
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

    const handleCourseSelect = (course: Course) => {
        onSelectCourse?.(course);
        setIsDialogOpen(false);
        setSearchTerm("");
        setSearchResults([]);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-md p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => setIsDialogOpen(true)}
            >
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

                {description && (
                    <p className="text-xs text-amber-700 line-clamp-2 mb-2">
                        {description}
                    </p>
                )}

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
            </motion.div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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