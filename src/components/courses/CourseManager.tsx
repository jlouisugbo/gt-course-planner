"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, BookOpen, Star, Lock, AlertTriangle } from "lucide-react";
import { Course, PlannedCourse } from "@/types/courses";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { useAllCourses } from '@/hooks/useAllCourses';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { PrereqModal } from './PrereqModal';
import { evaluatePrerequisites } from '@/lib/prereqUtils';
import { useCompletionTracking } from '@/hooks/useCompletionTracking'; 

interface CourseManagerProps {
    semesterId: number; 
    onClose: () => void;
}

const GRADES = ["A", "B", "C", "D", "F", "W", "I", "IP", "S", "U"];
const YEARS = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i,
);

const CourseManager: React.FC<CourseManagerProps> = ({
    semesterId,
    onClose,
}) => {
    const { addCourseToSemester, semesters } = usePlannerStore();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [programCourses, setProgramCourses] = useState<string[]>([]);
    const [isLoadingProgram, setIsLoadingProgram] = useState(true);
    const [activeTab, setActiveTab] = useState("program");
    const [prereqModalCourse, setPrereqModalCourse] = useState<Course | null>(null);
    const { completedCourses } = useCompletionTracking();
    
    // Get planned courses from planner store
    const plannedCourseCodes = new Set(
        Object.values(semesters)
            .flatMap(semester => semester.courses)
            .map(course => course.code)
    );
    const [customCourse, setCustomCourse] = useState({
        code: "",
        title: "",
        credits: 3,
        semester: "",
        year: new Date().getFullYear(),
        grade: "",
        status: "planned" as "completed" | "in-progress" | "planned",
        type: "elective" as "core" | "elective" | "free",
    });

    // Use optimized all courses hook with memoization
    const { 
        courses: allCoursesData,
        filteredCourses: allFilteredCourses,
        isLoading, 
        error,
        hasMore,
        loadMore,
        totalCount
    } = useAllCourses({
        search: searchQuery || undefined
    });

    const courses = searchQuery ? allFilteredCourses : allCoursesData;
    const semester = semesters[semesterId];
    
    // Fetch program requirements and extract course codes
    useEffect(() => {
        const fetchProgramCourses = async () => {
            if (!user) {
                setIsLoadingProgram(false);
                return;
            }

            try {
                // Get user's major
                const { data: userRecord, error: userError } = await supabase
                    .from('users')
                    .select('major')
                    .eq('auth_id', user.id)
                    .single();

                if (userError || !userRecord?.major) {
                    setIsLoadingProgram(false);
                    return;
                }

                // Get degree program requirements with authentication
                const { data: sessionData } = await authService.getSession();
                if (!sessionData.session?.access_token) {
                    setIsLoadingProgram(false);
                    return;
                }

                const degreeResponse = await fetch(`/api/degree-programs?major=${encodeURIComponent(userRecord.major)}&degree_type=BS`, {
                    headers: {
                        'Authorization': `Bearer ${sessionData.session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!degreeResponse.ok) {
                    setIsLoadingProgram(false);
                    return;
                }
                
                const degreeData = await degreeResponse.json();
                
                // Extract all course codes from requirements (including OR groups and SELECT groups)
                const allCourseCodes = new Set<string>();
                
                const extractCoursesRecursively = (courseObj: any) => {
                    if (typeof courseObj === 'string') {
                        allCourseCodes.add(courseObj);
                    } else if (courseObj && typeof courseObj === 'object') {
                        // Regular course with code
                        if (courseObj.code && courseObj.code !== 'OR_GROUP' && courseObj.code !== 'SELECT_GROUP') {
                            allCourseCodes.add(courseObj.code);
                        }
                        
                        // Handle OR groups
                        if (courseObj.courseType === 'or_group' && courseObj.groupCourses) {
                            courseObj.groupCourses.forEach((subCourse: any) => {
                                extractCoursesRecursively(subCourse);
                            });
                        }
                        
                        // Handle AND groups
                        if (courseObj.courseType === 'and_group' && courseObj.groupCourses) {
                            courseObj.groupCourses.forEach((subCourse: any) => {
                                extractCoursesRecursively(subCourse);
                            });
                        }
                        
                        // Handle SELECT groups
                        if (courseObj.courseType === 'selection' && courseObj.selectionOptions) {
                            courseObj.selectionOptions.forEach((option: any) => {
                                extractCoursesRecursively(option);
                            });
                        }
                    }
                };
                
                if (degreeData.requirements && Array.isArray(degreeData.requirements)) {
                    degreeData.requirements.forEach((requirement: any) => {
                        if (requirement.courses && Array.isArray(requirement.courses)) {
                            requirement.courses.forEach((course: any) => {
                                extractCoursesRecursively(course);
                            });
                        }
                    });
                }
                
                setProgramCourses(Array.from(allCourseCodes));
            } catch (error) {
                console.warn('Failed to fetch program courses:', error);
            } finally {
                setIsLoadingProgram(false);
            }
        };

        fetchProgramCourses();
    }, [user]);
    
    // Filter courses based on active tab
    const filteredCourses = useMemo(() => {
        if (activeTab === "program" && programCourses.length > 0) {
            // Show only courses that are in the user's degree program
            return courses.filter(course => 
                programCourses.some(programCode => 
                    course.code === programCode || 
                    course.code.startsWith(programCode.split(' ')[0]) // Match subject prefix
                )
            );
        }
        // For "all" tab or when no program courses loaded, show all courses
        return courses;
    }, [courses, programCourses, activeTab]);

    const handleAddCourse = (course: Course) => {
    const dept = typeof course.code === 'string' ? (course.code.split(' ')[0] || 'GEN') : 'GEN';
    const plannedCourse: PlannedCourse = {
            // Course properties
            id: course.id,
            code: course.code,
            title: course.title,
            credits: course.credits,
            description: course.description,
            prerequisites: course.prerequisites,
            offerings: course.offerings,
            difficulty: course.difficulty,
            college: course.college,
            course_type: (course as any).course_type || (course as any).type || "elective",
        department: (course as any).department || dept,
            // Planning properties
            semesterId: semesterId,
            status: "planned",
            grade: null,
            year: semester.year,
            season: semester.season,
        };

        addCourseToSemester(plannedCourse);
        onClose();
    };

    const handleAddCustomCourse = () => {
        if (!customCourse.code || !customCourse.title) return;

        // Generate a numeric ID for custom courses (timestamp-based)
        const customId = Date.now();

    const dept = typeof customCourse.code === 'string' ? (customCourse.code.split(' ')[0] || 'GEN') : 'GEN';
    const plannedCourse: PlannedCourse = {
            // Course properties
            id: customId,
            code: customCourse.code,
            title: customCourse.title,
            credits: customCourse.credits,
            description: "Custom course entry",
            prerequisites: { type: "AND", courses: [] },
            offerings: { fall: true, spring: true, summer: true },
            difficulty: 3,
            course_type: customCourse.type || "elective",
            college: "Custom",
        department: dept,
            // Planning properties
            semesterId: semesterId,
            status: customCourse.status,
            grade: customCourse.grade || null,
            year: customCourse.year,
            season: semester.season,
        };

        addCourseToSemester(plannedCourse);

        setCustomCourse({
            code: "",
            title: "",
            credits: 3,
            semester: "",
            year: new Date().getFullYear(),
            grade: "",
            status: "planned",
            type: "elective",
        });
        
        onClose();
    };

    const CourseCard = ({ course }: { course: Course }) => {
        // Check if prerequisites are met
        const prereqResult = evaluatePrerequisites(
            course.prerequisites,
            completedCourses,
            plannedCourseCodes
        );
        
        const hasUnmetPrereqs = !prereqResult.isValid;
        
        return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer relative ${
                hasUnmetPrereqs ? 'border-orange-200 bg-orange-50' : 'border-slate-200'
            }`}
            onClick={() => setSelectedCourse(course)}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-slate-900">
                            {course.code}
                        </h4>
                        {hasUnmetPrereqs && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPrereqModalCourse(course);
                                }}
                                className="text-orange-600 hover:text-orange-800 transition-colors"
                                title="Prerequisites not met - click to view"
                            >
                                <Lock className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">
                        {course.title}
                    </p>
                    {hasUnmetPrereqs && (
                        <div className="flex items-center space-x-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600">
                                {prereqResult.missingCourses.length} prereq(s) missing
                            </span>
                        </div>
                    )}
                </div>
                <Badge variant="secondary">{course.credits}cr</Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {course.difficulty}/5
                </span>
                <div className="flex space-x-1">
                    {course.offerings?.fall && <Badge variant="outline" className="text-xs px-1">F</Badge>}
                    {course.offerings?.spring && <Badge variant="outline" className="text-xs px-1">S</Badge>}
                    {course.offerings?.summer && <Badge variant="outline" className="text-xs px-1">Su</Badge>}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Button
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddCourse(course);
                    }}
                    className="bg-[#003057] hover:bg-[#002041] flex-1 mr-2"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                    }}
                    className="px-2"
                >
                    <BookOpen className="h-3 w-3" />
                </Button>
            </div>
        </motion.div>
        );
    };

    if (!semester) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription>
                            Semester not found. Please try again.
                        </DialogDescription>
                    </DialogHeader>
                    <Button onClick={onClose}>Close</Button>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Add Courses to {semester.season} {semester.year}
                    </DialogTitle>
                    <DialogDescription>
                        Search for courses to add to your semester plan or
                        create custom entries
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="program" className="relative">
                            Program Courses
                            {!isLoadingProgram && programCourses.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {programCourses.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="search">All Courses</TabsTrigger>
                        <TabsTrigger value="custom">
                            Add Custom
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="program"
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Program Courses Interface */}
                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search program courses..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Loading State */}
                        {(isLoading || isLoadingProgram) && (
                            <div className="text-center py-8 text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                                <div className="space-y-1">
                                    <div>Loading program courses...</div>
                                    {totalCount > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {courses.length} of {totalCount} courses loaded
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center text-red-500 py-8">
                                <div className="mb-2">Error loading courses</div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => window.location.reload()}
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {/* Program Course Results */}
                        {!isLoading && !isLoadingProgram && !error && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                                    <AnimatePresence>
                                        {filteredCourses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Load More Button for Program Tab */}
                                {hasMore && filteredCourses.length > 0 && (
                                    <div className="text-center pt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={loadMore}
                                            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                        >
                                            Load More Program Courses
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isLoading && !isLoadingProgram && !error && filteredCourses.length === 0 && programCourses.length > 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>
                                    No program courses found matching &quot;{searchQuery}&quot;
                                </p>
                                <p className="text-sm">
                                    Try a different search term or check the &quot;All Courses&quot; tab
                                </p>
                            </div>
                        )}

                        {!isLoading && !isLoadingProgram && !error && programCourses.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No degree program found</p>
                                <p className="text-sm">
                                    Check your profile settings or use the &quot;All Courses&quot; tab
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="search"
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Search Interface */}
                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by course code or title..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-8 text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                                <div className="space-y-1">
                                    <div>Loading all courses...</div>
                                    {totalCount > 0 && (
                                        <div className="text-xs text-slate-400">
                                            {courses.length} of {totalCount} courses loaded
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-400">
                                        {searchQuery ? 'Filtering results...' : 'Fetching course catalog...'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="text-center text-red-500 py-8">
                                <div className="mb-2">Error loading courses</div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => window.location.reload()}
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {/* All Course Results */}
                        {!isLoading && !error && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                                    <div>
                                        Showing <span className="font-semibold text-slate-900">{courses.length}</span> 
                                        {totalCount > courses.length && (
                                            <span> of <span className="font-semibold text-slate-900">{totalCount}</span></span>
                                        )} courses
                                        {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
                                    </div>
                                    {hasMore && (
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                            More available
                                        </Badge>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                                    <AnimatePresence>
                                        {courses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Load More Button */}
                                {hasMore && courses.length > 0 && (
                                    <div className="text-center pt-4">
                                        <Button 
                                            variant="outline" 
                                            onClick={loadMore}
                                            className="bg-slate-50 hover:bg-slate-100 border-slate-200"
                                        >
                                            Load More Courses ({totalCount - courses.length} remaining)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isLoading && !error && courses.length === 0 && searchQuery && (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>
                                    No courses found matching &quot;
                                    {searchQuery}&quot;
                                </p>
                                <p className="text-sm">
                                    Try a different search term or add a custom
                                    course
                                </p>
                            </div>
                        )}

                        {!isLoading && !error && courses.length === 0 && !searchQuery && (
                            <div className="text-center py-8 text-slate-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Loading complete course catalog...</p>
                                <p className="text-sm">
                                    All courses will appear here when loaded
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Add Custom Course
                                </CardTitle>
                                <CardDescription>
                                    Create a custom course entry for transfer
                                    credits, special studies, or courses not in
                                    the catalog
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="courseCode">
                                            Course Code *
                                        </Label>
                                        <Input
                                            id="courseCode"
                                            value={customCourse.code}
                                            onChange={(e) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    code: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., CS 1301"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="credits">
                                            Credits *
                                        </Label>
                                        <Select
                                            value={customCourse.credits.toString()}
                                            onValueChange={(value) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    credits: parseInt(value),
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6].map(
                                                    (credit) => (
                                                        <SelectItem
                                                            key={credit}
                                                            value={credit.toString()}
                                                        >
                                                            {credit}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="courseTitle">
                                        Course Title *
                                    </Label>
                                    <Input
                                        id="courseTitle"
                                        value={customCourse.title}
                                        onChange={(e) =>
                                            setCustomCourse({
                                                ...customCourse,
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., Introduction to Computing"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={customCourse.status}
                                            onValueChange={(
                                                value:
                                                    | "completed"
                                                    | "in-progress"
                                                    | "planned",
                                            ) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    status: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="completed">
                                                    Completed
                                                </SelectItem>
                                                <SelectItem value="in-progress">
                                                    In Progress
                                                </SelectItem>
                                                <SelectItem value="planned">
                                                    Planned
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="year">Year</Label>
                                        <Select
                                            value={customCourse.year.toString()}
                                            onValueChange={(value) =>
                                                setCustomCourse({
                                                    ...customCourse,
                                                    year: parseInt(value),
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YEARS.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                    >
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {customCourse.status === "completed" && (
                                        <div>
                                            <Label htmlFor="grade">Grade</Label>
                                            <Select
                                                value={customCourse.grade}
                                                onValueChange={(value) =>
                                                    setCustomCourse({
                                                        ...customCourse,
                                                        grade: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {GRADES.map((grade) => (
                                                        <SelectItem
                                                            key={grade}
                                                            value={grade}
                                                        >
                                                            {grade}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddCustomCourse}
                                        disabled={
                                            !customCourse.code ||
                                            !customCourse.title
                                        }
                                        className="bg-[#B3A369] hover:bg-[#9A8F5A]"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Course
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Course Details Modal */}
                {selectedCourse && (
                    <Dialog
                        open={!!selectedCourse}
                        onOpenChange={() => setSelectedCourse(null)}
                    >
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedCourse.code} -{" "}
                                    {selectedCourse.title}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedCourse.credits} credits • {selectedCourse.college}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <p className="text-slate-700">
                                    {selectedCourse.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Course Details
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Difficulty:</span>
                                                <span>{selectedCourse.difficulty}/5</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Prerequisites:</span>
                                                <span>{selectedCourse.prerequisites?.courses?.length || "None"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">
                                            Availability
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedCourse.offerings.fall && (
                                                <Badge variant="outline">
                                                    Fall
                                                </Badge>
                                            )}
                                            {selectedCourse.offerings.spring && (
                                                <Badge variant="outline">
                                                    Spring
                                                </Badge>
                                            )}
                                            {selectedCourse.offerings.summer && (
                                                <Badge variant="outline">
                                                    Summer
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedCourse(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleAddCourse(selectedCourse);
                                            setSelectedCourse(null);
                                        }}
                                        className="bg-[#003057] hover:bg-[#002041]"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add to Semester
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                
                {/* Prerequisites Modal */}
                <PrereqModal
                    course={prereqModalCourse}
                    isOpen={!!prereqModalCourse}
                    onClose={() => setPrereqModalCourse(null)}
                    completedCourses={completedCourses}
                    plannedCourses={plannedCourseCodes}
                    allCourses={courses}
                />
            </DialogContent>
        </Dialog>
    );
};

export default CourseManager;