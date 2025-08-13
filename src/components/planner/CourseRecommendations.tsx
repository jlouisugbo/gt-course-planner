// CourseRecommendations.tsx - With comprehensive safety checks
"use client";
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    Calculator,
    Beaker,
    Navigation,
    X,
    AlertTriangle,
    Lock,
    ShieldAlert,
    TrendingUp,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { 
    Course, 
    PlannedCourse, 
    DragTypes, 
    VisualMinorProgram, 
    CourseRecommendationsProps,
    TabType 
} from "@/types";
import { usePlannerStore } from "@/hooks/usePlannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import CourseDetailsModal from "./parts/CourseDetailsModal";
import { FlexibleCourseCard } from "./parts/FlexibleCourseCard";
import { usePrerequisiteValidation } from "@/hooks/usePrereqValidation";
import { supabase } from "@/lib/supabaseClient";
import { authService } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";

const CourseRecommendations: React.FC<CourseRecommendationsProps> = ({
    onDragStart,
}) => {
    const { semesters, addCourseToSemester, removeCourseFromSemester } = usePlannerStore();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(["core-cs"]),
    );
    const [showQuickNav, setShowQuickNav] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("program");

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

    // Fetch courses from degree program requirements and course database
    const [courses, setCourses] = useState<Course[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]); // New state for ALL courses
    const [degreeProgramCourses, setDegreeProgramCourses] = useState<{[key: string]: Course[]}>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCoursesFromDegreeProgram = async () => {
            console.log("🔍 Starting degree program course fetch...");
            setIsLoading(true);
            setError(null);

            try {
                if (!user) {
                    setError("No authenticated user");
                    setIsLoading(false);
                    return;
                }

                // Get user's major
                const { data: userRecord, error: userError } = await supabase
                    .from('users')
                    .select('major, minors')
                    .eq('auth_id', user.id)
                    .single();

                if (userError || !userRecord?.major) {
                    setError("User major not found. Please complete profile setup.");
                    setIsLoading(false);
                    return;
                }

                const { data: sessionData } = await authService.getSession();
                if (!sessionData.session?.access_token) {
                    setError("Authentication required. Please sign in again.");
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(userRecord.major)}&degree_type=BS`, {
                    headers: {
                        'Authorization': `Bearer ${sessionData.session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    console.error("No degree program found for major:", userRecord.major);
                    setError(`No degree program found for ${userRecord.major}`);
                    setIsLoading(false);
                    return;
                }
                
                const program = await response.json();
                
                if (!program?.requirements) {
                    console.error("No requirements found for degree program:", userRecord.major);
                    setError(`No requirements found for ${userRecord.major}`);
                    setIsLoading(false);
                    return;
                }

                const minorPrograms: VisualMinorProgram[] = [];
                if(userRecord.minors && Array.isArray(userRecord.minors)) {
                    for (const minor of userRecord.minors) {
                        try {
                            const minorResponse = await fetch(`/api/degree-programs?major=${encodeURIComponent(minor)}&degree_type=Minor`, {
                                headers: {
                                    'Authorization': `Bearer ${sessionData.session.access_token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            if(minorResponse.ok){
                                const minorData = await minorResponse.json();
                                minorPrograms.push({
                                    id: minorData.id,
                                    name: minorData.name,
                                    requirements: Array.isArray(minorData.requirements) ? minorData.requirements : [],
                                    footnotes: Array.isArray(minorData.footnotes) ? minorData.footnotes : []
                                });
                            }
                        } catch (error) {
                            console.error("Error fetching minor program:", error);
                        }
                    }
                }

                // Extract all course codes from requirements
                const extractCourseCodesFromRequirements = (requirements: any[]): string[] => {
                    const courseCodes: string[] = [];
                    
                    requirements.forEach(category => {
                        if (Array.isArray(category.courses)) {
                            category.courses.forEach((course: any) => {
                                // Handle simple string format (seeded data)
                                if (typeof course === 'string') {
                                    courseCodes.push(course);
                                }
                                // Handle complex course object format
                                else if (typeof course === 'object' && course !== null) {
                                    if (course.courseType === 'regular' || course.courseType === 'flexible') {
                                        courseCodes.push(course.code);
                                    } else if (course.courseType === 'and_group' || course.courseType === 'or_group' || course.courseType === 'AND_GROUP' || course.courseType === 'OR_GROUP') {
                                        if (Array.isArray(course.groupCourses)) {
                                            course.groupCourses.forEach((groupCourse: any) => {
                                                if (groupCourse.code) {
                                                    courseCodes.push(groupCourse.code);
                                                }
                                            });
                                        }
                                    } else if (course.courseType === 'selection') {
                                        if (Array.isArray(course.selectionOptions)) {
                                            course.selectionOptions.forEach((option: any) => {
                                                if (option.code) {
                                                    courseCodes.push(option.code);
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    });
                    
                    return [...new Set(courseCodes)]; // Remove duplicates
                };

                // Parse requirements JSON string to array
                let parsedRequirements;
                try {
                    parsedRequirements = typeof program.requirements === 'string' 
                        ? JSON.parse(program.requirements) 
                        : program.requirements;
                    
                    // Ensure parsedRequirements is an array
                    if (!Array.isArray(parsedRequirements)) {
                        console.error("Requirements is not an array:", parsedRequirements);
                        setError("Invalid degree program requirements format");
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error("Error parsing requirements JSON:", error);
                    setError("Error parsing degree program requirements");
                    setIsLoading(false);
                    return;
                }

                console.log("📋 Parsed requirements structure:", parsedRequirements);
                const courseCodesFromRequirements = extractCourseCodesFromRequirements(parsedRequirements);
                
                // Also extract courses from minor programs
                const courseCodesFromMinors: string[] = [];
                minorPrograms.forEach(minorProgram => {
                    if (Array.isArray(minorProgram.requirements)) {
                        const minorCourses = extractCourseCodesFromRequirements(minorProgram.requirements);
                        courseCodesFromMinors.push(...minorCourses);
                    }
                });
                
                // Combine course codes from major and minors
                const allCourseCodes = [...new Set([...courseCodesFromRequirements, ...courseCodesFromMinors])];
                console.log("📚 Extracted course codes from requirements:", allCourseCodes);

                // Fetch full course data from database for these codes
                if (allCourseCodes.length > 0) {
                    const { data: courseData, error: courseError } = await supabase
                        .from('courses')
                        .select('*')
                        .in('code', allCourseCodes);

                    if (courseError) {
                        console.error("Error fetching course data:", courseError);
                        setError("Error fetching course data from database");
                    } else {
                        const normalizedCourses = (courseData || [])
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
                        
                        // Organize courses by requirement categories with AND group preservation
                        const categorizedCourses: {[key: string]: any} = {};
                        program.requirements.forEach((category: any) => {
                            categorizedCourses[category.name] = {
                                courses: [],
                                andGroups: [],
                                flexibleRequirements: []
                            };
                            
                            if (Array.isArray(category.courses)) {
                                category.courses.forEach((reqCourse: any) => {
                                    if ((reqCourse.courseType === 'and_group' || reqCourse.courseType === 'AND_GROUP') && Array.isArray(reqCourse.groupCourses)) {
                                        // Handle AND group - find all matching courses and group them
                                        const andGroupCourses = reqCourse.groupCourses
                                            .map((groupCourse: any) => normalizedCourses.find(course => course.code === groupCourse.code))
                                            .filter(Boolean);
                                        
                                        if (andGroupCourses.length > 0) {
                                            categorizedCourses[category.name].andGroups.push({
                                                name: reqCourse.name || `AND Group ${categorizedCourses[category.name].andGroups.length + 1}`,
                                                courses: andGroupCourses,
                                                description: reqCourse.description || 'Courses that must be taken together'
                                            });
                                        }
                                    } else if (reqCourse.courseType === 'flexible' || reqCourse.code === 'FLEXIBLE') {
                                        // Handle FLEXIBLE requirements
                                        categorizedCourses[category.name].flexibleRequirements.push({
                                            title: reqCourse.title || 'Flexible Requirement',
                                            requirementType: reqCourse.title || category.name,
                                            description: reqCourse.description || `Choose a course that satisfies the ${reqCourse.title || category.name} requirement`,
                                            footnoteRefs: reqCourse.footnoteRefs || []
                                        });
                                    } else {
                                        // Handle regular courses
                                        const matchingCourse = normalizedCourses.find(course => course.code === reqCourse.code);
                                        if (matchingCourse) {
                                            categorizedCourses[category.name].courses.push(matchingCourse);
                                        }
                                    }
                                });
                            }
                        });
                        
                        setDegreeProgramCourses(categorizedCourses);
                        console.log(`📊 Set ${normalizedCourses.length} courses from degree program`);
                    }
                }

                setIsLoading(false);
            } catch (err) {
                console.error("💥 Fetch error:", err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`Fetch failed: ${errorMessage}`);
                setIsLoading(false);
            }
        };

        fetchCoursesFromDegreeProgram();
    }, [user]);

    // Fetch ALL courses for search tab
    useEffect(() => {
        const fetchAllCourses = async () => {
            if (!user) return;
            
            try {
                console.log("🔍 Fetching ALL courses for search tab...");
                
                // Fetch all courses from database
                const { data: allCoursesData, error: allCoursesError } = await supabase
                    .from('courses')
                    .select('*')
                    .order('code');

                if (allCoursesError) {
                    console.error("Error fetching all courses:", allCoursesError);
                } else {
                    const normalizedAllCourses = (allCoursesData || [])
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

                    setAllCourses(normalizedAllCourses);
                    console.log(`📊 Set ${normalizedAllCourses.length} total courses for search`);
                }
            } catch (err) {
                console.error("💥 Error fetching all courses:", err);
            }
        };

        fetchAllCourses();
    }, [user]);

    // Safe semester access
    const safeSemesters = useMemo(() => {
        return semesters && typeof semesters === 'object' ? semesters : {};
    }, [semesters]);

    // Course categories from degree program requirements - Dynamic mapping based on actual JSON
    const courseCategories = useMemo(() => {
        const categories: {[key: string]: any} = {};
        
        // Create categories from degree program requirements with smarter keyword matching
        Object.entries(degreeProgramCourses).forEach(([categoryName, categoryData], index) => {
            // Dynamic icon and color mapping based on category keywords
            const getIconAndColor = (name: string) => {
                const lowerName = name.toLowerCase();
                
                // Core/Major requirements
                if (lowerName.includes('core') || lowerName.includes('major') || lowerName.includes('required')) {
                    return { icon: BookOpen, color: 'bg-[#003057] text-white' };
                }
                
                // Math/Calculus/Statistics
                if (lowerName.includes('math') || lowerName.includes('calculus') || lowerName.includes('statistics')) {
                    return { icon: Calculator, color: 'bg-[#B3A369] text-white' };
                }
                
                // Science/Physics/Chemistry/Biology
                if (lowerName.includes('science') || lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) {
                    return { icon: Beaker, color: 'bg-emerald-600 text-white' };
                }
                
                // Thread-related (Intelligence, Systems, etc.)
                if (lowerName.includes('thread') || lowerName.includes('intelligence') || lowerName.includes('systems') || lowerName.includes('architecture')) {
                    return { icon: Target, color: 'bg-purple-600 text-white' };
                }
                
                // Electives/Free/Flexible
                if (lowerName.includes('elective') || lowerName.includes('free') || lowerName.includes('flexible')) {
                    return { icon: Star, color: 'bg-blue-600 text-white' };
                }
                
                // Communication/Writing/Wellness
                if (lowerName.includes('communication') || lowerName.includes('writing') || lowerName.includes('wellness') || lowerName.includes('ethics')) {
                    return { icon: Plus, color: 'bg-gray-600 text-white' };
                }
                
                // Default fallback with rotating colors
                const colors = [
                    'bg-slate-500 text-white',
                    'bg-gray-600 text-white', 
                    'bg-zinc-600 text-white',
                    'bg-neutral-600 text-white'
                ];
                return { 
                    icon: BookOpen, 
                    color: colors[index % colors.length]
                };
            };
            
            const { icon, color } = getIconAndColor(categoryName);
            
            // Handle both old format (array) and new format (object with courses, andGroups, and flexibleRequirements)
            const categoryInfo = Array.isArray(categoryData) 
                ? { courses: categoryData, andGroups: [], flexibleRequirements: [] }
                : categoryData;

            categories[categoryName.toLowerCase().replace(/\s+/g, '-')] = {
                name: categoryName,
                description: `${categoryName} from your degree program requirements`,
                color: color,
                icon: icon,
                courses: Array.isArray(categoryInfo.courses) ? categoryInfo.courses : [],
                andGroups: Array.isArray(categoryInfo.andGroups) ? categoryInfo.andGroups : [],
                flexibleRequirements: Array.isArray(categoryInfo.flexibleRequirements) ? categoryInfo.flexibleRequirements : [],
            };
        });
        
        // If no degree program categories, fall back to default
        if (Object.keys(categories).length === 0) {
            const safeCourses = Array.isArray(courses) ? courses : [];
            return {
                "all-courses": {
                    name: "All Available Courses",
                    description: "All courses from your degree program",
                    color: "bg-[#003057] text-white",
                    icon: BookOpen,
                    courses: safeCourses,
                },
            };
        }
        
        return categories;
    }, [degreeProgramCourses, courses]);

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

    // Available courses for search (includes ALL courses, not just degree program)
    const availableCoursesForSearch = useMemo(() => {
        const searchCourses = Array.isArray(allCourses) ? allCourses : [];
        return searchCourses.filter((course) => {
            if (!course || !course.code) return false;
            return !allPlannedCourses.some((planned) => planned?.code === course.code);
        });
    }, [allCourses, allPlannedCourses]);

    const filteredCourses = useMemo(() => {
        // Use all courses for search tab, degree program courses for other tabs
        const courseList = activeTab === "search" ? availableCoursesForSearch : availableCourses;
        
        // For search tab, only show results if user has searched and entered query
        if (activeTab === "search") {
            if (!hasSearched || !searchQuery || typeof searchQuery !== 'string') {
                return [];
            }
        }
        
        if (!searchQuery || typeof searchQuery !== 'string') return courseList;

        const query = searchQuery.toLowerCase();
        return courseList.filter((course) => {
            if (!course) return false;
            
            const code = (course.code || '').toLowerCase();
            const title = (course.title || '').toLowerCase();
            const description = (course.description || '').toLowerCase();
            
            return code.includes(query) || 
                   title.includes(query) || 
                   description.includes(query);
        });
    }, [activeTab, availableCourses, availableCoursesForSearch, searchQuery, hasSearched]);

    // Get completed courses from both planner and requirements tab
    const [completedFromRequirements, setCompletedFromRequirements] = useState<string[]>([]);
    
    useEffect(() => {
        const loadCompletedCourses = async () => {
            if (!user) return;
            
            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('completed_courses')
                    .eq('auth_id', user.id)
                    .single();

                if (!error && userData && Array.isArray(userData.completed_courses)) {
                    setCompletedFromRequirements(userData.completed_courses);
                }
            } catch (error) {
                console.error('Error loading completed courses from requirements:', error);
            }
        };

        loadCompletedCourses();
    }, [user]);

    const recommendedCourses = useMemo(() => {
        // Combine completed courses from planner and requirements tab
        const completedFromPlanner = allPlannedCourses
            .filter((c) => c?.status === "completed")
            .map((c) => c?.code)
            .filter(Boolean);
        
        const allCompletedCourses = [...new Set([...completedFromPlanner, ...completedFromRequirements])];

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
                        return prereq.courses.some((code: string) => allCompletedCourses.includes(code));
                    } else {
                        return prereq.courses.every((code: string) => allCompletedCourses.includes(code));
                    }
                });
            })
            .slice(0, 8);
    }, [availableCourses, allPlannedCourses, completedFromRequirements]);

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

    // Component for rendering linked AND group courses
    const LinkedCourseGroup = ({ courses, groupName }: { courses: Course[], groupName?: string }) => {
        if (!Array.isArray(courses) || courses.length === 0) return null;
        
        return (
            <div className="border-2 border-dashed border-[#B3A369] rounded-lg p-2 bg-[#B3A369]/5">
                {groupName && (
                    <div className="text-xs font-semibold text-[#B3A369] mb-2 flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        {groupName} (Linked Group)
                    </div>
                )}
                <div className="space-y-2">
                    {courses.map((course, index) => (
                        <WiderCourseCard key={course?.id || index} course={course} />
                    ))}
                </div>
                <div className="text-xs text-[#B3A369] mt-2 text-center">
                    ↳ These courses must be taken together
                </div>
            </div>
        );
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

        // Implement proper drag functionality using react-dnd
        const [{ isDragging }, drag] = useDrag(() => ({
            type: DragTypes.COURSE,
            item: {
                type: DragTypes.COURSE,
                id: course?.id || 0,
                course: course,
            },
            canDrag: !isBlocked && !!course,
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }), [course, isBlocked]);

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
        const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };
        const missingPrereqs = Array.isArray(validation.missingPrereqs) ? validation.missingPrereqs : [];
        const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];

        return (
            <motion.div
                ref={drag as any}
                initial={{ opacity: 0, y: 2 }}
                animate={{
                    opacity: isBlocked ? 0.6 : isDragging ? 0.5 : 1,
                    y: 0,
                    scale: isBlocked ? 0.98 : isDragging ? 1.05 : 1,
                }}
                className={cn(
                    "group bg-white border rounded-md p-2 transition-all duration-200 relative",
                    isBlocked
                        ? "border-red-300 bg-red-50 cursor-not-allowed"
                        : hasWarnings
                          ? "border-yellow-300 bg-yellow-50 cursor-move hover:shadow-md"
                          : "border-slate-300 cursor-move hover:shadow-md",
                    isBlocked && "animate-pulse",
                    isDragging && "shadow-xl border-[#B3A369] ring-2 ring-[#B3A369]/50",
                )}
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

                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-1 flex-1">
                        <GripVertical
                            className={cn(
                                "h-3 w-3 transition-opacity",
                                isBlocked
                                    ? "text-red-400 opacity-50"
                                    : "text-slate-400 opacity-0 group-hover:opacity-100",
                            )}
                        />
                        <div className="flex-1">
                            <span
                                className={cn(
                                    "font-bold text-xs",
                                    isBlocked ? "text-red-700" : "text-slate-900",
                                )}
                            >
                                {courseCode}
                            </span>
                            <p
                                className={cn(
                                    "text-xs font-medium line-clamp-1",
                                    isBlocked ? "text-red-600" : "text-slate-700",
                                )}
                            >
                                {courseTitle}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs h-4 px-1",
                                isBlocked && "bg-red-200 text-red-800",
                            )}
                        >
                            {courseCredits}cr
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCourse(course);
                            }}
                        >
                            <Info className="h-2 w-2" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                        {courseDifficulty > 0 && (
                            <span className="flex items-center text-xs">
                                <Star className="h-2 w-2 mr-1" />
                                {courseDifficulty}/5
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-0.5">
                        {courseOfferings.fall && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                F
                            </Badge>
                        )}
                        {courseOfferings.spring && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                S
                            </Badge>
                        )}
                        {courseOfferings.summer && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                Su
                            </Badge>
                        )}
                    </div>
                </div>

                {missingPrereqs.length > 0 && (
                    <Alert className="mb-1 py-1 border-red-200 bg-red-50">
                        <ShieldAlert className="h-2 w-2 text-red-600" />
                        <AlertDescription className="text-xs text-red-700">
                            Missing: {missingPrereqs.slice(0, 1).join(", ")}
                            {missingPrereqs.length > 1 && ` +${missingPrereqs.length - 1}`}
                        </AlertDescription>
                    </Alert>
                )}

                {warnings.length > 0 && !isBlocked && (
                    <Alert className="mb-1 py-1 border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-2 w-2 text-yellow-600" />
                        <AlertDescription className="text-xs text-yellow-700">
                            {String(warnings[0]).slice(0, 30)}...
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                    size="sm"
                    className={cn(
                        "w-full text-xs h-5 transition-all",
                        isBlocked
                            ? "bg-red-400 hover:bg-red-400 cursor-not-allowed opacity-50"
                            : "bg-[#003057] hover:bg-[#002041]",
                    )}
                    onClick={handleAddClick}
                    disabled={isBlocked}
                >
                    {isBlocked ? (
                        <>
                            <Lock className="h-2 w-2 mr-1" />
                            Blocked
                        </>
                    ) : (
                        <>
                            <Plus className="h-2 w-2 mr-1" />
                            Add
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
        const categoryAndGroups = Array.isArray(category?.andGroups) ? category.andGroups : [];
        const categoryFlexibleRequirements = Array.isArray(category?.flexibleRequirements) ? category.flexibleRequirements : [];

        return (
            <div
                ref={(el) => {
                    categoryRefs.current[categoryKey] = el;
                }}
                className="space-y-2"
            >
                <div
                    className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-slate-50 transition-colors border border-slate-200"
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
                            {categoryCourses.length + categoryAndGroups.reduce((total: number, group: any) => total + group.courses.length, 0) + categoryFlexibleRequirements.length}
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
                                {/* Display AND Groups first */}
                                {categoryAndGroups.map((andGroup: any, groupIndex: number) => (
                                    <LinkedCourseGroup
                                        key={`and-group-${groupIndex}`}
                                        courses={andGroup.courses}
                                        groupName={andGroup.name}
                                    />
                                ))}
                                
                                {/* Display flexible requirements */}
                                {categoryFlexibleRequirements.map((flexReq: any, flexIndex: number) => (
                                    <FlexibleCourseCard
                                        key={`flex-req-${flexIndex}`}
                                        title={flexReq.title}
                                        requirementType={flexReq.requirementType}
                                        description={flexReq.description}
                                        onSelectCourse={handleAddCourse}
                                    />
                                ))}
                                
                                {/* Display regular courses */}
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

                            {categoryCourses.length === 0 && categoryAndGroups.length === 0 && categoryFlexibleRequirements.length === 0 && (
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

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setHasSearched(true);
    };

    const handleSearchInputChange = (value: string) => {
        setSearchInput(value);
        // For non-search tabs, still do live search
        if (activeTab !== "search") {
            setSearchQuery(value);
        }
    };

    const safeCoursesLength = Array.isArray(courses) ? courses.length : 0;

    // Drop functionality to return courses to library
    const [{ isOver }, drop] = useDrop(() => ({
        accept: DragTypes.PLANNED_COURSE,
        drop: (item: any) => {
            if (item.course && item.semesterId && removeCourseFromSemester) {
                removeCourseFromSemester(item.course.id, item.semesterId);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [removeCourseFromSemester]);

    return (
        <>
            <Card 
                ref={drop as any}
                className={cn(
                    "h-fit sticky top-6 border-slate-300 transition-colors duration-200",
                    isOver && "border-green-400 bg-green-50"
                )}
            >
                <CardHeader className="pb-2 pt-3">
                    <CardTitle className="flex items-center text-slate-900 text-base">
                        <BookOpen className={cn("h-4 w-4 mr-2", isOver ? "text-green-600" : "text-[#B3A369]")} />
                        {isOver ? "Drop to Remove Course" : "Course Library"}
                    </CardTitle>

                    {/* Compact Tab Navigation */}
                    <div className="grid grid-cols-4 gap-0.5 bg-slate-100 rounded-md p-0.5 mt-2">
                        <button
                            className={cn(
                                "text-xs px-1 py-1 rounded-sm transition-colors",
                                activeTab === "program"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("program")}
                        >
                            <BookOpen className="h-3 w-3 inline mr-1" />
                            Program
                        </button>
                        <button
                            className={cn(
                                "text-xs px-1 py-1 rounded-sm transition-colors",
                                activeTab === "recommended"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("recommended")}
                        >
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            Rec
                        </button>
                        <button
                            className={cn(
                                "text-xs px-1 py-1 rounded-sm transition-colors",
                                activeTab === "search"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => {
                                setActiveTab("search");
                                setHasSearched(false);
                                setSearchQuery("");
                                setSearchInput("");
                            }}
                        >
                            <Search className="h-3 w-3 inline mr-1" />
                            Search
                        </button>
                        <button
                            className={cn(
                                "text-xs px-1 py-1 rounded-sm transition-colors",
                                activeTab === "categories"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                            onClick={() => setActiveTab("categories")}
                        >
                            <Filter className="h-3 w-3 inline mr-1" />
                            Cat
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-1 pt-1">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center text-slate-500 text-sm py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-2"></div>
                            Loading courses...
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center text-red-500 text-sm py-4">
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
                            {/* Compact Search and Filters */}
                            <div className="space-y-1">
                                <form onSubmit={handleSearchSubmit} className="relative">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                                    <Input
                                        placeholder={activeTab === "search" ? "Type and press Enter to search..." : "Search courses..."}
                                        value={searchInput}
                                        onChange={(e) => handleSearchInputChange(e.target.value)}
                                        className="pl-7 border-slate-300 text-xs h-7"
                                    />
                                </form>

                                <div className="flex space-x-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-slate-300 text-xs h-6"
                                    >
                                        <Filter className="h-3 w-3 mr-1" />
                                        Filters
                                    </Button>

                                    {/* Quick Navigation Button */}
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-300 text-xs h-6 px-2"
                                            onClick={() => setShowQuickNav(!showQuickNav)}
                                        >
                                            <Navigation className="h-3 w-3 mr-1" />
                                            Nav
                                        </Button>

                                        <QuickNavigationPopup />
                                    </div>
                                </div>
                            </div>

                            {/* Course Content Based on Active Tab - Increased height to show 4-5 courses */}
                            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-2">
                                {/* Program Tab - Shows courses from degree requirements */}
                                {activeTab === "program" && (
                                    <div className="space-y-3">
                                        {Object.keys(degreeProgramCourses).length > 0 ? (
                                            Object.entries(degreeProgramCourses).map(([categoryName, categoryData]) => {
                                                // Handle both old format (array) and new format (object with courses, andGroups, and flexibleRequirements)
                                                const categoryInfo = Array.isArray(categoryData) 
                                                    ? { courses: categoryData, andGroups: [], flexibleRequirements: [] }
                                                    : categoryData;
                                                    
                                                return (
                                                    <div key={categoryName} className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-slate-700 border-b border-slate-200 pb-1">
                                                            {categoryName}
                                                        </h4>
                                                        
                                                        {/* Display AND Groups first */}
                                                        {Array.isArray(categoryInfo.andGroups) && categoryInfo.andGroups.map((andGroup: any, groupIndex: number) => (
                                                            <LinkedCourseGroup
                                                                key={`${categoryName}-and-group-${groupIndex}`}
                                                                courses={andGroup.courses}
                                                                groupName={andGroup.name}
                                                            />
                                                        ))}
                                                        
                                                        {/* Display flexible requirements */}
                                                        {Array.isArray(categoryInfo.flexibleRequirements) && categoryInfo.flexibleRequirements.map((flexReq: any, flexIndex: number) => (
                                                            <FlexibleCourseCard
                                                                key={`${categoryName}-flex-req-${flexIndex}`}
                                                                title={flexReq.title}
                                                                requirementType={flexReq.requirementType}
                                                                description={flexReq.description}
                                                                onSelectCourse={handleAddCourse}
                                                            />
                                                        ))}
                                                        
                                                        {/* Display regular courses */}
                                                        {Array.isArray(categoryInfo.courses) && categoryInfo.courses.map((course) => (
                                                            <WiderCourseCard
                                                                key={course?.id || Math.random()}
                                                                course={course}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-8">
                                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-medium">No degree program courses found</p>
                                                <p className="text-xs text-slate-400 mt-1">Complete your profile setup to see program courses</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Recommended Tab */}
                                {activeTab === "recommended" && (
                                    <div className="space-y-3">
                                        {recommendedCourses.length > 0 ? (
                                            <>
                                                <div className="text-xs text-slate-600 mb-2 bg-green-50 border border-green-200 rounded-md p-2">
                                                    ✅ Based on {completedFromRequirements.length + allPlannedCourses.filter(c => c?.status === "completed").length} completed courses (includes Requirements tab)
                                                </div>
                                                {recommendedCourses.map((course) => (
                                                    <WiderCourseCard
                                                        key={course?.id || Math.random()}
                                                        course={course}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-4">
                                                <Target className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">Complete prerequisites to see recommendations</p>
                                                <p className="text-xs text-slate-400 mt-1">Mark courses as completed in Requirements tab</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Search Tab */}
                                {activeTab === "search" && (
                                    <div className="space-y-2">
                                        {filteredCourses.length > 0 ? (
                                            <>
                                                <div className="text-xs text-slate-600 mb-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                                                    🔍 Searching {allCourses.length} total courses (all departments)
                                                </div>
                                                {filteredCourses.map((course) => (
                                                    <WiderCourseCard
                                                        key={course?.id || Math.random()}
                                                        course={course}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-4">
                                                <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">
                                                    {hasSearched && searchQuery
                                                        ? `No courses found for "${searchQuery}"`
                                                        : "Type a search term and press Enter"}
                                                </p>
                                                {(!hasSearched || !searchQuery) && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Search all {allCourses.length} GT courses by code, title, or description
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Categories Tab */}
                                {activeTab === "categories" && (
                                    <div className="space-y-3">
                                        {Object.keys(courseCategories).length > 0 ? (
                                            <>
                                                <div className="text-xs text-slate-600 mb-2 bg-green-50 border border-green-200 rounded-md p-2">
                                                    📋 Categories from your degree program requirements
                                                </div>
                                                {Object.entries(courseCategories).map(([key, category]) => (
                                                    <CategorySection
                                                        key={key}
                                                        categoryKey={key}
                                                        category={category}
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-500 text-sm py-8">
                                                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-medium">No degree program categories found</p>
                                                <p className="text-xs text-slate-400 mt-1">Complete your profile setup to see requirement categories</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Quick Stats */}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-gradient-to-br from-[#003057] to-[#002041] rounded-lg text-white text-center">
                                        <div className="text-lg font-bold">{activeTab === "search" ? allCourses.length : safeCoursesLength}</div>
                                        <div className="text-xs opacity-90">Available Courses</div>
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg text-white text-center">
                                        <div className="text-lg font-bold">{availableCourses.reduce((total, course) => total + (course.credits || 3), 0)}</div>
                                        <div className="text-xs opacity-90">Available Credits</div>
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