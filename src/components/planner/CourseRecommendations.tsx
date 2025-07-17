// CourseRecommendations.tsx - With comprehensive safety checks
"use client";
import InfoPopout from "./parts/InfoPopout";
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    BookOpen,
    Search,
    Filter,
    Star,
    Plus,
    Target,
    GripVertical,
    Info,
    ChevronDown,
    ChevronUp,
    Zap,
    Award,
    Calculator,
    Beaker,
    Navigation,
    X,
    AlertTriangle,
    Lock,
    ShieldAlert,
    TrendingUp,
} from "lucide-react";
import { Course, PlannedCourse } from "@/types/courses";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import CourseDetailsModal from "./parts/CourseDetailsModal";
import { usePrerequisiteValidation } from "@/hooks/usePrereqValidation";
import { supabase } from "@/lib/supabaseClient";

interface CourseRecommendationsProps {
    onDragStart?: (course: PlannedCourse) => void;
    onDragEnd?: () => void;
}

type TabType = "recommended" | "search" | "categories";

const CourseRecommendations: React.FC<CourseRecommendationsProps> = ({
    onDragStart,
    onDragEnd,
}) => {
    const { semesters, addCourseToSemester } = usePlannerStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(["core-cs"]),
    );
    const [showQuickNav, setShowQuickNav] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("recommended");

    // Safe hook access with error handling
    let validatePrerequisites: ((course: Course) => any) | null = null;
    try {
        const validation = usePrerequisiteValidation();
        validatePrerequisites = validation?.validatePrerequisites || null;
    } catch (error) {
        console.warn('Error accessing prerequisite validation:', error);
    }

    // Refs for scrolling to categories
    const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Database fetch with fallback to sample data
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = () => {
            console.log("🔍 Starting course fetch...");
            setIsLoading(true);
            setError(null);

            const timeoutId = setTimeout(() => {
                console.log("⏰ Fetch timeout - using sample data");
                // Fallback to sample data if database fails
                const sampleCourses: Course[] = [
                    {
                        id: 1,
                        code: "CS 1301",
                        title: "Intro to Computing",
                        credits: 3,
                        description: "Introduction to computing and programming",
                        difficulty: 2,
                        college: "College of Computing",
                        prerequisites: [],
                        corequisites: [],
                        threads: [],
                        attributes: ["CORE"],
                        offerings: { fall: true, spring: true, summer: true },
                    },
                    {
                        id: 2,
                        code: "CS 1331",
                        title: "Object-Oriented Programming",
                        credits: 3,
                        description: "Introduction to object-oriented programming",
                        difficulty: 3,
                        college: "College of Computing",
                        prerequisites: [
                            {
                                type: "course",
                                courses: ["CS 1301"],
                                logic: "AND",
                            },
                        ],
                        corequisites: [],
                        threads: [],
                        attributes: ["CORE"],
                        offerings: { fall: true, spring: true, summer: false },
                    },
                    // Add more sample courses as needed
                ];
                setCourses(sampleCourses);
                setIsLoading(false);
            }, 5000);

            const fetchData = async () => {
                try {
                    if (!supabase) {
                        throw new Error("Supabase client not available");
                    }

                    const { data, error: dbError } = await supabase
                        .from("courses")
                        .select("*")
                        .limit(50);

                    clearTimeout(timeoutId);
                    console.log("✅ Database fetch result:", { data, dbError });

                    if (dbError) {
                        console.error("❌ DB Error:", dbError);
                        setError(`Database error: ${dbError.message}`);
                        // Don't set loading to false here - let timeout handle fallback
                    } else {
                        const normalizedCourses = (data || [])
                            .filter(course => course && typeof course === 'object')
                            .map((course) => ({
                                ...course,
                                prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
                                corequisites: Array.isArray(course.corequisites) ? course.corequisites : [],
                                attributes: Array.isArray(course.attributes) ? course.attributes : [],
                                offerings: course.offerings && typeof course.offerings === 'object' 
                                    ? course.offerings 
                                    : { fall: true, spring: true, summer: false },
                                threads: Array.isArray(course.threads) ? course.threads : [],
                                difficulty: typeof course.difficulty === 'number' ? course.difficulty : 3,
                                workload: typeof course.workload === 'number' ? course.workload : 10,
                                instructors: Array.isArray(course.instructors) ? course.instructors : [],
                                credits: typeof course.credits === 'number' ? course.credits : 3,
                                code: course.code || 'Unknown',
                                title: course.title || 'No title',
                                description: course.description || 'No description',
                                college: course.college || 'Unknown College',
                            }));

                        setCourses(normalizedCourses);
                        console.log(`📊 Set ${normalizedCourses.length} courses from database`);
                        setIsLoading(false);
                    }
                } catch (err) {
                    clearTimeout(timeoutId);
                    console.error("💥 Fetch error:", err);
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    setError(`Fetch failed: ${errorMessage}`);
                    // Don't set loading to false - let timeout handle fallback
                }
            };

            fetchData();
        };

        fetchCourses();
    }, []);

    // Safe semester access
    const safeSemesters = useMemo(() => {
        return semesters && typeof semesters === 'object' ? semesters : {};
    }, [semesters]);

    // Enhanced course categories for better organization with safety checks
    const courseCategories = useMemo(() => {
        const safeCourses = Array.isArray(courses) ? courses : [];
        
        return {
            "core-cs": {
                name: "CS Core Requirements",
                description: "Required Computer Science foundation courses",
                color: "bg-[#003057] text-white",
                icon: BookOpen,
                courses: safeCourses.filter((course) =>
                    ["CS 1301", "CS 1331", "CS 1332", "CS 2110", "CS 2340", "CS 3510"].includes(course?.code || ''),
                ),
            },
            mathematics: {
                name: "Mathematics Requirements",
                description: "Required mathematics and statistics courses",
                color: "bg-[#B3A369] text-white",
                icon: Calculator,
                courses: safeCourses.filter((course) => {
                    const code = course?.code || '';
                    return code.startsWith("MATH") || code.startsWith("STAT");
                }),
            },
            "science-lab": {
                name: "Science Lab Credits",
                description: "Required lab science sequences",
                color: "bg-emerald-600 text-white",
                icon: Beaker,
                courses: safeCourses.filter((course) => {
                    const code = course?.code || '';
                    return code.startsWith("PHYS") || code.startsWith("CHEM") || code.startsWith("BIOL");
                }),
            },
            "cs-electives": {
                name: "CS Electives",
                description: "Upper-level CS electives and specializations",
                color: "bg-blue-600 text-white",
                icon: Star,
                courses: safeCourses.filter((course) => {
                    const code = course?.code || '';
                    const codeNumber = parseInt(code.split(" ")[1] || '0');
                    return code.startsWith("CS") && codeNumber >= 3000 && !["CS 3510"].includes(code);
                }),
            },
            "thread-intelligence": {
                name: "Intelligence Thread",
                description: "AI/ML specialization courses",
                color: "bg-purple-600 text-white",
                icon: Zap,
                courses: safeCourses.filter((course) => {
                    const threads = Array.isArray(course?.threads) ? course.threads : [];
                    return threads.includes("Intelligence");
                }),
            },
            "thread-systems": {
                name: "Systems Thread",
                description: "Systems & Architecture courses",
                color: "bg-orange-600 text-white",
                icon: Award,
                courses: safeCourses.filter((course) => {
                    const threads = Array.isArray(course?.threads) ? course.threads : [];
                    return threads.includes("Systems & Architecture");
                }),
            },
        };
    }, [courses]);

    // Memoized calculations with safety checks
    const allPlannedCourses = useMemo(() => {
        return Object.values(safeSemesters)
            .filter(semester => semester && Array.isArray(semester.courses))
            .flatMap((s) => s.courses)
            .filter(course => course && typeof course === 'object');
    }, [safeSemesters]);

    const availableCourses = useMemo(() => {
        const safeCourses = Array.isArray(courses) ? courses : [];
        return safeCourses.filter((course) => {
            if (!course || !course.code) return false;
            return !allPlannedCourses.some((planned) => planned?.code === course.code);
        });
    }, [courses, allPlannedCourses]);

    const filteredCourses = useMemo(() => {
        if (!searchQuery || typeof searchQuery !== 'string') return availableCourses;

        const query = searchQuery.toLowerCase();
        return availableCourses.filter((course) => {
            if (!course) return false;
            
            const code = (course.code || '').toLowerCase();
            const title = (course.title || '').toLowerCase();
            const description = (course.description || '').toLowerCase();
            
            return code.includes(query) || 
                   title.includes(query) || 
                   description.includes(query);
        });
    }, [availableCourses, searchQuery]);

    const recommendedCourses = useMemo(() => {
        const completedCourses = allPlannedCourses
            .filter((c) => c?.status === "completed")
            .map((c) => c?.code)
            .filter(Boolean);

        return availableCourses
            .filter((course) => {
                if (!course || !Array.isArray(course.prerequisites) || course.prerequisites.length === 0) {
                    return true;
                }

                return course.prerequisites.every((prereq) => {
                    if (!prereq || prereq.type !== "course" || !Array.isArray(prereq.courses)) {
                        return true;
                    }

                    if (prereq.logic === "OR") {
                        return prereq.courses.some((code) => completedCourses.includes(code));
                    } else {
                        return prereq.courses.every((code) => completedCourses.includes(code));
                    }
                });
            })
            .slice(0, 6);
    }, [availableCourses, allPlannedCourses]);

    const scrollToCategory = (categoryKey: string) => {
        const element = categoryRefs.current[categoryKey];
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });
            setExpandedCategories((prev) => new Set([...prev, categoryKey]));
            setShowQuickNav(false);
        }
    };

    const toggleCategory = (categoryKey: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryKey)) {
                newSet.delete(categoryKey);
            } else {
                newSet.add(categoryKey);
            }
            return newSet;
        });
    };

    const WiderCourseCard = ({ course }: { course: Course }) => {
        // Safe validation with fallback
        let validation = { isBlocked: false, warnings: [], missingPrereqs: [] };
        if (validatePrerequisites && course) {
            try {
                validation = validatePrerequisites(course);
            } catch (error) {
                console.warn('Error validating prerequisites for course:', course.code, error);
            }
        }

        const isBlocked = validation.isBlocked;
        const hasWarnings = Array.isArray(validation.warnings) && validation.warnings.length > 0;

        const handleDragStart = (e: React.DragEvent) => {
            if (isBlocked) {
                e.preventDefault();
                return;
            }

            if (!course) return;

            const plannedCourse: PlannedCourse = {
                ...course,
                semesterId: 0, // Default to first semester
                status: "planned" as const,
                year: new Date().getFullYear(),
                season: "Fall" as const,
            };
            
            if (onDragStart) {
                onDragStart(plannedCourse);
            }
        };

        const handleAddClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isBlocked || !course) return;
            handleDragStart(e as any);
        };

        if (!course || typeof course !== 'object') {
            return null;
        }

        // Safe property access
        const courseCode = course.code || 'Unknown';
        const courseTitle = course.title || 'No title';
        const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
        const courseDifficulty = typeof course.difficulty === 'number' ? course.difficulty : 0;
        const courseThreads = Array.isArray(course.threads) ? course.threads : [];
        const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };
        const missingPrereqs = Array.isArray(validation.missingPrereqs) ? validation.missingPrereqs : [];
        const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];

        return (
            <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{
                    opacity: isBlocked ? 0.6 : 1,
                    y: 0,
                    scale: isBlocked ? 0.98 : 1,
                }}
                className={cn(
                    "group bg-white border rounded-lg p-4 transition-all duration-200 relative",
                    isBlocked
                        ? "border-red-300 bg-red-50 cursor-not-allowed"
                        : hasWarnings
                          ? "border-yellow-300 bg-yellow-50 cursor-move hover:shadow-lg"
                          : "border-slate-300 cursor-move hover:shadow-lg",
                    isBlocked && "animate-pulse",
                )}
                draggable={!isBlocked}
                onDragStart={handleDragStart as any}
                onDragEnd={onDragEnd}
                onClick={() => setSelectedCourse(course)}
            >
                {isBlocked && (
                    <div className="absolute inset-0 bg-red-100/80 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                            <Lock className="h-6 w-6 text-red-600 mx-auto mb-1" />
                            <p className="text-xs font-medium text-red-700">
                                Prerequisites Required
                            </p>
                        </div>
                    </div>
                )}

                {hasWarnings && !isBlocked && (
                    <div className="absolute top-2 right-2 z-10">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                )}

                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                        <GripVertical
                            className={cn(
                                "h-4 w-4 transition-opacity",
                                isBlocked
                                    ? "text-red-400 opacity-50"
                                    : "text-slate-400 opacity-0 group-hover:opacity-100",
                            )}
                        />
                        <div className="flex-1">
                            <span
                                className={cn(
                                    "font-bold text-sm",
                                    isBlocked ? "text-red-700" : "text-slate-900",
                                )}
                            >
                                {courseCode}
                            </span>
                            <p
                                className={cn(
                                    "text-xs font-medium line-clamp-2 mt-1",
                                    isBlocked ? "text-red-600" : "text-slate-700",
                                )}
                            >
                                {courseTitle}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs",
                                isBlocked && "bg-red-200 text-red-800",
                            )}
                        >
                            {courseCredits}cr
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourse(course);
                            }}
                        >
                            <Info className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                        {courseDifficulty > 0 && (
                            <span className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {courseDifficulty}/5
                            </span>
                        )}
                
                    </div>

                    <div className="flex space-x-1">
                        {courseOfferings.fall && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                F
                            </Badge>
                        )}
                        {courseOfferings.spring && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                S
                            </Badge>
                        )}
                        {courseOfferings.summer && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                Su
                            </Badge>
                        )}
                    </div>
                </div>

                {courseThreads.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {courseThreads.slice(0, 2).map((thread: string, index: number) => (
                            <Badge
                                key={`${thread}-${index}`}
                                variant="outline"
                                className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]"
                            >
                                {thread}
                            </Badge>
                        ))}
                    </div>
                )}

                {missingPrereqs.length > 0 && (
                    <Alert className="mb-3 border-red-200 bg-red-50">
                        <ShieldAlert className="h-3 w-3 text-red-600" />
                        <AlertDescription className="text-xs text-red-700">
                            Missing:{" "}
                            {missingPrereqs.slice(0, 2).join(", ")}
                            {missingPrereqs.length > 2 &&
                                ` +${missingPrereqs.length - 2} more`}
                        </AlertDescription>
                    </Alert>
                )}

                {warnings.length > 0 && !isBlocked && (
                    <Alert className="mb-3 border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <AlertDescription className="text-xs text-yellow-700">
                            {warnings[0]}
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                    size="sm"
                    className={cn(
                        "w-full text-xs h-7 transition-all",
                        isBlocked
                            ? "bg-red-400 hover:bg-red-400 cursor-not-allowed opacity-50"
                            : "bg-[#003057] hover:bg-[#002041]",
                    )}
                    onClick={handleAddClick}
                    disabled={isBlocked}
                >
                    {isBlocked ? (
                        <>
                            <Lock className="h-3 w-3 mr-1" />
                            Blocked
                        </>
                    ) : (
                        <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add to Plan
                        </>
                    )}
                </Button>
            </motion.div>
        );
    };

    const CategorySection = ({
        categoryKey,
        category,
    }: {
        categoryKey: string;
        category: any;
    }) => {
        const isExpanded = expandedCategories.has(categoryKey);
        const Icon = category?.icon || BookOpen;
        const categoryName = category?.name || 'Unknown Category';
        const categoryDescription = category?.description || 'No description';
        const categoryColor = category?.color || 'bg-gray-500 text-white';
        const categoryCourses = Array.isArray(category?.courses) ? category.courses : [];

        return (
            <div
                ref={(el) => {
                    categoryRefs.current[categoryKey] = el;
                }}
                className="space-y-3"
            >
                <div
                    className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                    onClick={() => toggleCategory(categoryKey)}
                >
                    <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-slate-600" />
                        <div>
                            <h4 className="font-semibold text-slate-900 text-sm">
                                {categoryName}
                            </h4>
                            <p className="text-xs text-slate-600">
                                {categoryDescription}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge className={cn(categoryColor, "text-xs")}>
                            {categoryCourses.length}
                        </Badge>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-1 gap-3">
                                {categoryCourses
                                    .slice(0, 12)
                                    .map((course: Course) => (
                                        <WiderCourseCard
                                            key={course?.id || Math.random()}
                                            course={course}
                                        />
                                    ))}
                            </div>

                            {categoryCourses.length > 12 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-8 border-slate-300"
                                >
                                    View {categoryCourses.length - 12} more courses
                                </Button>
                            )}

                            {categoryCourses.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No courses available</p>
                                    <p className="text-xs">Check back later for updates</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const QuickNavigationPopup = () => (
        <AnimatePresence>
            {showQuickNav && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={() => setShowQuickNav(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl z-50 p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-900 text-sm">
                                Jump to Category
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setShowQuickNav(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                            {Object.entries(courseCategories).map(([key, category]) => {
                                const Icon = category?.icon || BookOpen;
                                const categoryName = category?.name || 'Unknown';
                                const categoryDescription = category?.description || '';
                                const categoryColor = category?.color || 'bg-gray-500 text-white';
                                const courseCount = Array.isArray(category?.courses) ? category.courses.length : 0;

                                return (
                                    <Button
                                        key={key}
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start h-auto p-3 hover:bg-slate-50"
                                        onClick={() => scrollToCategory(key)}
                                    >
                                        <div className="flex items-center space-x-3 w-full">
                                            <div className={cn("p-2 rounded-md", categoryColor)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium text-sm text-slate-900">
                                                    {categoryName}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {categoryDescription}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {courseCount}
                                            </Badge>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const handleAddCourse = (course: Course) => {
        if (!course || !addCourseToSemester) return;

        const semesterValues = Object.values(safeSemesters)
            .filter(semester => semester && typeof semester === 'object');
            
        const sortedSemesters = semesterValues.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            const seasonOrder: Record<string, number> = { Fall: 0, Spring: 1, Summer: 2 };
            return (seasonOrder[a.season] || 0) - (seasonOrder[b.season] || 0);
        });

        const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };

        const targetSemester = sortedSemesters.find((semester) => {
            if (!semester || typeof semester !== 'object') return false;
            
            const semesterSeason = semester.season?.toLowerCase();
            const offeringKey = semesterSeason as keyof typeof courseOfferings;
            const isOffered = courseOfferings[offeringKey] || false;
            const semesterCredits = typeof semester.totalCredits === 'number' ? semester.totalCredits : 0;
            const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
            const hasSpace = semesterCredits + courseCredits <= 18;
            
            return isOffered && hasSpace;
        });

        if (targetSemester) {
            try {
                addCourseToSemester({
                    ...course,
                    status: "planned",
                    grade: null,
                    semesterId: targetSemester.id,
                    year: targetSemester.year,
                    season: targetSemester.season,
                });
                setSelectedCourse(null);
            } catch (error) {
                console.error('Error adding course to semester:', error);
                alert("Error adding course to plan. Please try again.");
            }
        } else {
            alert("Unable to find a suitable semester for this course. Please add it manually.");
        }
    };

    const handleReload = () => {
        setIsLoading(true);
        setError(null);
        setCourses([]);
        window.location.reload();
    };

    const safeCoursesLength = Array.isArray(courses) ? courses.length : 0;

    return (
        <>
            <Card className="h-fit sticky top-6 border-slate-300">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-slate-900 text-lg">
                        <BookOpen className="h-5 w-5 mr-2 text-[#B3A369]" />
                        Course Library
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                        Drag courses to your academic plan
                    </p>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mt-3">
                        <button
                            className={cn(
                                "flex-1 text-xs px-2 py-1 rounded-md transition-colors",
                                activeTab === "recommended"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("recommended")}
                        >
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Recommended
                        </button>
                        <button
                            className={cn(
                                "flex-1 text-xs px-2 py-1 rounded-md transition-colors",
                                activeTab === "search"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("search")}
                        >
                            <Search className="h-3 w-3 inline mr-1" />
                            Search
                        </button>
                        <button
                            className={cn(
                                "flex-1 text-xs px-2 py-1 rounded-md transition-colors",
                                activeTab === "categories"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("categories")}
                        >
                            <Filter className="h-3 w-3 inline mr-1" />
                            Categories
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center text-slate-500 text-sm py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                            Loading courses...
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center text-red-500 text-sm py-8">
                            <div className="mb-2">Error loading courses</div>
                            <div className="text-xs mb-2 text-gray-600">{error}</div>
                            <Button variant="outline" size="sm" onClick={handleReload}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && !error && (
                        <>
                            {/* Enhanced Search */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search by course code, title, or keyword..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 border-slate-300 text-sm h-9"
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-slate-300 text-sm h-8"
                                    >
                                        <Filter className="h-3 w-3 mr-2" />
                                        Filters
                                    </Button>

                                    {/* Quick Navigation Button */}
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-300 text-sm h-8 w-[500px] px-3"
                                            onClick={() => setShowQuickNav(!showQuickNav)}
                                        >
                                            <Navigation className="h-3 w-3 mr-2" />
                                            Quick Nav
                                        </Button>

                                        <QuickNavigationPopup />
                                    </div>
                                </div>
                            </div>

                            {/* Prerequisite Legend */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-600">
                                    Course status indicators
                                </p>
                                <InfoPopout />
                            </div>
                            <Separator />

                            {/* Course Content Based on Active Tab */}
                            <div className="space-y-6 max-h-[calc(100vh-600px)] overflow-y-auto custom-scrollbar pr-2">
                                {/* Recommended Tab */}
                                {activeTab === "recommended" && (
                                    <div className="space-y-3">
                                        {recommendedCourses.length > 0 ? (
                                            <>
                                                <p className="text-sm text-slate-600 mb-3">
                                                    Based on your completed courses
                                                </p>
                                                {recommendedCourses.map((course) => (
                                                    <WiderCourseCard
                                                        key={course?.id || Math.random()}
                                                        course={course}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-8">
                                                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                Complete some prerequisites to see recommendations
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Search Tab */}
                                {activeTab === "search" && (
                                    <div className="space-y-3">
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => (
                                                <WiderCourseCard
                                                    key={course?.id || Math.random()}
                                                    course={course}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-8">
                                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                {searchQuery
                                                    ? "No courses found"
                                                    : "Start typing to search courses"}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Categories Tab */}
                                {activeTab === "categories" && (
                                    <>
                                        {Object.entries(courseCategories).map(([key, category]) => (
                                            <CategorySection
                                                key={key}
                                                categoryKey={key}
                                                category={category}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Enhanced Quick Stats */}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-gradient-to-br from-[#003057] to-[#002041] rounded-lg text-white text-center">
                                        <div className="text-lg font-bold">{safeCoursesLength}</div>
                                        <div className="text-xs opacity-90">Available Courses</div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-[#B3A369] to-[#9A8F5A] rounded-lg text-white text-center">
                                        <div className="text-lg font-bold">126</div>
                                        <div className="text-xs opacity-90">Credits Required</div>
                                    </div>
                                </div>

                                <div className="mt-3 p-2 bg-slate-50 rounded-md text-center">
                                    <p className="text-xs text-slate-600">
                                        🔒 <strong>Smart Prerequisites:</strong> Blocked courses show missing requirements
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Enhanced Course Details Modal */}
            {selectedCourse && (
                <CourseDetailsModal
                    course={selectedCourse}
                    isOpen={!!selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    onAddCourse={(course) => {
                        if (!course) return;
                        
                        let canAdd = true;
                        if (validatePrerequisites) {
                            try {
                                const validation = validatePrerequisites(course);
                                canAdd = !validation.isBlocked;
                            } catch (error) {
                                console.warn('Error validating prerequisites:', error);
                            }
                        }
                        
                        if (canAdd) {
                            handleAddCourse(course);
                        }
                        setSelectedCourse(null);
                    }}
                />
            )}
        </>
    );
};

export default CourseRecommendations;