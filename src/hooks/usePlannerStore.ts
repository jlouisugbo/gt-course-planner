import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabaseClient";

import {
    StudentInfo,
    AcademicProgress,
    ActivityItem,
    SemesterData,
    PlannedCourse,
    RequirementCategory,
    UserProfile,
    DegreeProgramDisplay,
    Deadline,
    ProgressItem,
} from "@/types";
import { VisualDegreeProgram, VisualMinorProgram } from "@/types/requirements";

interface PlannerState {
    // User data
    studentInfo: StudentInfo;
    userProfile: UserProfile | null;

    // Planning data
    semesters: Record<number, SemesterData>;

    // Database data
    degreePrograms: DegreeProgramDisplay[];
    minorPrograms: DegreeProgramDisplay[];
    deadlines: Deadline[];
    selectedThreads: number[];
    selectedMinors: number[];

    // UI state
    selectedSemester: number | null;
    draggedCourse: PlannedCourse | null;
    sidebarOpen: boolean;
    isLoadingPrograms: boolean;
    isLoadingDeadlines: boolean;

    // Computed values
    academicProgress: AcademicProgress;
    recentActivity: ActivityItem[];
    requirementProgress: RequirementCategory[];

    // Actions
    updateStudentInfo: (info: Partial<StudentInfo>) => void;
    addCourseToSemester: (course: PlannedCourse) => void;
    removeCourseFromSemester: (courseId: number, semesterId: number) => void;
    moveCourse: (
        courseId: number,
        fromSemester: number,
        toSemester: number,
    ) => void;
    moveCourseToSemester: (courseId: string, targetSemesterId: number) => void;
    updateCourseGrade: (
        courseId: number,
        semesterId: number,
        grade: string,
    ) => void;
    updateCourseStatus: (
        courseId: number,
        semesterId: number,
        status: PlannedCourse["status"],
        grade?: string,
    ) => void;
    setSelectedSemester: (semesterId: number | null) => void;
    setSidebarOpen: (open: boolean) => void;
    updateAcademicProgress: () => void;
    addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
    generateSemesters: (startDate: string, graduationDate: string) => void;
    calculateGPA: () => number;
    getTotalCredits: () => number;
    updateStudentThreads: (threads: number[]) => Promise<void>;
    updateStudentMinors: (minors: number[]) => Promise<void>;
    updateStudentMajor: (major: string) => Promise<void>;
    fetchAndUpdateRequirements: () => Promise<void>;
    calculateThreadProgress: () => void;
    calculateMinorProgress: () => void;
    updateSemesterGPA: (semesterId: number) => void;
    calculateSemesterGPA: (semesterId: number) => number;
    getGPAHistory: () => Array<{
        semester: string;
        year: number;
        gpa: number;
        credits: number;
    }>;

    fetchDeadlines: () => Promise<void>;
    
    // New methods for visual requirements system
    fetchDegreeProgramRequirements: () => Promise<VisualDegreeProgram | null>;
    fetchMinorProgramsRequirements: () => Promise<VisualMinorProgram[]>;
    getThreadProgress: () => ProgressItem[];
    getThreadMinorProgress: () => ProgressItem[];
    getUpcomingDeadlines: () => (Deadline & {
        daysLeft: number;
        formattedDate: string;
    })[];
    getAvailableThreads: () => DegreeProgramDisplay[];
    getAvailableMinors: () => DegreeProgramDisplay[];
    setSelectedThreads: (threadIds: number[]) => void;
    setSelectedMinors: (minorIds: number[]) => void;
    initializeStore: () => Promise<void>;
    
    // Helper methods for safe data access
    getAllCourses: () => PlannedCourse[];
    getCoursesByStatus: (status: PlannedCourse["status"]) => PlannedCourse[];
    getSafeSemesters: () => SemesterData[];
    
    // Enhanced planning state management
    exportPlanningData: () => string;
    importPlanningData: (data: string) => Promise<boolean>;
    clearAllPlannedCourses: () => void;
    getCompletionStats: () => {
        totalCourses: number;
        completedCourses: number;
        inProgressCourses: number;
        plannedCourses: number;
        completionRate: number;
    };
    validateSemesterPlan: (semesterId: number) => {
        isValid: boolean;
        warnings: string[];
        errors: string[];
    };
    
    // User isolation methods - DEPRECATED: Use useUserAwarePlannerStore instead
    checkAndHandleUserChange: () => void;
    getCurrentStorageUserId: () => string;
    clearUserData: () => void;
}

const createInitialSemesters = (): Record<number, SemesterData> => {
    return {};
};

const gradeToGPA = (grade: string): number => {
    const gradeMap: Record<string, number> = {
        A: 4.0,
        B: 3.0,
        C: 2.0,
        D: 1.0,
        F: 0.0,
    };
    return gradeMap[grade] || 0;
};

// Helper function to ensure course has required properties
const ensureCourseIntegrity = (course: any): course is PlannedCourse => {
    return (
        course &&
        typeof course === 'object' &&
        typeof course.id === 'number' &&
        typeof course.code === 'string' &&
        typeof course.title === 'string' &&
        typeof course.credits === 'number' &&
        typeof course.semesterId === 'number' &&
        ['completed', 'in-progress', 'planned'].includes(course.status)
    );
};

// Helper function to ensure semester has required properties
const ensureSemesterIntegrity = (semester: any): semester is SemesterData => {
    return (
        semester &&
        typeof semester === 'object' &&
        typeof semester.id === 'number' &&
        typeof semester.year === 'number' &&
        typeof semester.season === 'string' &&
        Array.isArray(semester.courses)
    );
};

// SECURITY FIX: REMOVED VULNERABLE getUserId() FUNCTION
// This function has been replaced with secure server-side alternatives
// All components should now use useUserAwarePlannerStore for secure user identification

// Secure fallback for anonymous sessions
const getAnonymousSessionId = (): string => {
    // Generate a random session ID for non-authenticated users
    if (typeof window !== 'undefined') {
        let sessionId = sessionStorage.getItem('gt-planner-anonymous-session');
        if (!sessionId) {
            sessionId = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('gt-planner-anonymous-session', sessionId);
        }
        return sessionId;
    }
    return 'anonymous-fallback';
};

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            studentInfo: {
                id: 0,
                name: "",
                email: "",
                major: "",
                threads: [], // Keep as string[] for thread names
                minors: [], // Keep as string[] for minor names
                startYear: new Date().getFullYear(),
                expectedGraduation: "",
                currentGPA: 0,
                majorRequirements: [],
                minorRequirements: [],
                threadRequirements: [],
            },

            userProfile: null,
            semesters: createInitialSemesters(),
            selectedSemester: null,
            draggedCourse: null,
            sidebarOpen: true,

            // Database data
            degreePrograms: [],
            minorPrograms: [],
            deadlines: [],
            selectedThreads: [],
            selectedMinors: [],
            isLoadingPrograms: false,
            isLoadingDeadlines: false,

            academicProgress: {
                totalCreditsRequired: 126,
                creditsCompleted: 0,
                creditsInProgress: 0,
                creditsPlanned: 0,
                currentGPA: 0,
                projectedGPA: 0,
                graduationDate: "",
                onTrack: false,
                threadProgress: 0,
                minorProgress: 0,
            },

            recentActivity: [],
            requirementProgress: [],

            // Helper methods for safe data access
            getAllCourses: () => {
                const state = get();
                const allCourses: PlannedCourse[] = [];
                
                Object.values(state.semesters || {}).forEach(semester => {
                    if (ensureSemesterIntegrity(semester) && Array.isArray(semester.courses)) {
                        semester.courses.forEach(course => {
                            if (ensureCourseIntegrity(course)) {
                                allCourses.push(course);
                            }
                        });
                    }
                });
                
                return allCourses;
            },

            getCoursesByStatus: (status: PlannedCourse["status"]) => {
                const state = get();
                return state.getAllCourses().filter(course => course.status === status);
            },

            getSafeSemesters: () => {
                const state = get();
                return Object.values(state.semesters || {}).filter(ensureSemesterIntegrity);
            },

            // Fetch deadlines
            fetchDeadlines: async () => {
                set({ isLoadingDeadlines: true });
                try {
                    const { data: deadlines, error } = await supabase
                        .from("deadlines")
                        .select("*")
                        .eq("is_active", true)
                        .order("date", { ascending: true });

                    if (error) throw error;

                    set({
                        deadlines: deadlines || [],
                        isLoadingDeadlines: false,
                    });
                } catch (error: any) {
                    const errorInfo = {
                        message: error?.message || 'Unknown error',
                        details: error?.details || 'No details available',
                        stack: error?.stack || 'No stack trace',
                        full_error: JSON.stringify(error, Object.getOwnPropertyNames(error))
                    };
                    console.error("Failed to fetch deadlines:", errorInfo);
                    set({ isLoadingDeadlines: false });
                }
            },

            // Set selected threads/minors
            setSelectedThreads: (threadIds: number[]) => {
                set({ selectedThreads: threadIds });
            },

            setSelectedMinors: (minorIds: number[]) => {
                set({ selectedMinors: minorIds });
            },

            // Get thread progress (legacy method for compatibility)
            getThreadProgress: () => {
                const state = get();
                return state
                    .getThreadMinorProgress()
                    .filter((p) => p.type === "thread");
            },

            // Get thread/minor progress from database data
            getThreadMinorProgress: (): ProgressItem[] => {
                const state = get();
                const allCourses = state.getAllCourses(); // Use safe method

                const calculateProgress = (
                    program: DegreeProgramDisplay,
                ): ProgressItem => {
                    let completedCredits = 0;
                    const completedCourses: number[] = [];
                    const inProgressCourses: number[] = [];
                    const plannedCourses: number[] = [];
                    const remainingCourses: number[] = [];

                    if (program.requirements?.categories) {
                        program.requirements.categories.forEach((category) => {
                            const categoryCompleted = allCourses.filter(
                                (course) =>
                                    category.eligible_courses?.includes(course.id) && 
                                    course.status === "completed",
                            );
                            const categoryInProgress = allCourses.filter(
                                (course) =>
                                    category.eligible_courses?.includes(course.id) && 
                                    course.status === "in-progress",
                            );
                            const categoryPlanned = allCourses.filter(
                                (course) =>
                                    category.eligible_courses?.includes(course.id) && 
                                    course.status === "planned",
                            );

                            categoryCompleted.forEach((course) => {
                                completedCredits += course.credits || 0;
                                completedCourses.push(course.id);
                            });

                            categoryInProgress.forEach((course) => {
                                inProgressCourses.push(course.id);
                            });

                            categoryPlanned.forEach((course) => {
                                plannedCourses.push(course.id);
                            });

                            // Find remaining eligible courses
                            (category.eligible_courses || []).forEach((courseId) => {
                                if (!allCourses.find((c) => c.id === courseId)) {
                                    remainingCourses.push(courseId);
                                }
                            });
                        });
                    } else if (program.requirements?.core_courses) {
                        // Handle simple requirements (typically minors)
                        program.requirements.core_courses.forEach(
                            (courseId) => {
                                const course = allCourses.find(
                                    (c) => c.id === courseId,
                                );
                                if (course) {
                                    if (course.status === "completed") {
                                        completedCredits += course.credits || 0;
                                        completedCourses.push(course.id);
                                    } else if (course.status === "in-progress") {
                                        inProgressCourses.push(course.id);
                                    } else if (course.status === "planned") {
                                        plannedCourses.push(course.id);
                                    }
                                } else {
                                    remainingCourses.push(courseId);
                                }
                            },
                        );
                    }

                    const requiredCredits = program.required_credits || 0;
                    return {
                        id: program.id,
                        name: program.name || "",
                        type: (program.degree_type?.toLowerCase() || "thread") as "thread" | "minor",
                        completed: completedCredits,
                        required: requiredCredits,
                        percentage: requiredCredits > 0 
                            ? Math.min((completedCredits / requiredCredits) * 100, 100)
                            : 0,
                        color: program.degree_type === "Thread" ? "#8B5CF6" : "#F97316",
                        courses: {
                            completed: completedCourses,
                            inProgress: inProgressCourses,
                            planned: plannedCourses,
                            remaining: remainingCourses,
                        },
                    };
                };

                const progress: ProgressItem[] = [];

                // Calculate progress for selected threads
                state.selectedThreads.forEach((threadId) => {
                    const program = state.degreePrograms.find(
                        (p) => p.id === threadId && p.degree_type === "Thread",
                    );
                    if (program) {
                        progress.push(calculateProgress(program));
                    }
                });

                // Calculate progress for selected minors
                state.selectedMinors.forEach((minorId) => {
                    const program = state.degreePrograms.find(
                        (p) => p.id === minorId && p.degree_type === "Minor",
                    );
                    if (program) {
                        progress.push(calculateProgress(program));
                    }
                });

                return progress;
            },

            getUpcomingDeadlines: () => {
                const state = get();
                const now = new Date();

                return (state.deadlines || [])
                    .filter((deadline) => deadline?.is_active)
                    .map((deadline) => {
                        const dueDate = new Date(deadline.date);
                        const timeDiff = dueDate.getTime() - now.getTime();
                        const daysLeft = Math.ceil(
                            timeDiff / (1000 * 3600 * 24),
                        );

                        return {
                            ...deadline,
                            daysLeft,
                            formattedDate: dueDate.toLocaleDateString(),
                        };
                    })
                    .sort((a, b) => a.daysLeft - b.daysLeft);
            },

            // Get available threads from database
            getAvailableThreads: () => {
                const state = get();
                return (state.degreePrograms || []).filter(
                    (p) => p?.degree_type === "Thread",
                );
            },

            // Get available minors from database
            getAvailableMinors: () => {
                const state = get();
                return (state.degreePrograms || []).filter(
                    (p) => p?.degree_type === "Minor",
                );
            },

            // Initialize store with database data
            initializeStore: async () => {
                const state = get();
                await Promise.all([
                    state.fetchDeadlines(),
                ]);
            },

            // Fetch degree program requirements for visual system (NEW: using major column)
            fetchDegreeProgramRequirements: async (): Promise<VisualDegreeProgram | null> => {
                try {
                    // Get the current user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        console.error('No authenticated user found');
                        return null;
                    }

                    // Get user's major from users table (new approach using major text column)
                    const { data: userRecord, error: userError } = await supabase
                        .from('users')
                        .select('major')
                        .eq('auth_id', user.id)
                        .single();

                    if (userError) {
                        console.error('Error fetching user record:', userError);
                        return null;
                    }

                    if (!userRecord?.major) {
                        console.error('User has no major assigned. User needs to complete profile setup.');
                        return null;
                    }

                    const majorName = userRecord.major;

                    // Query degree program by major name with college information
                    const { data: program, error: programError } = await supabase
                        .from('degree_programs')
                        .select(`
                            id, 
                            name, 
                            degree_type, 
                            total_credits, 
                            requirements,
                            colleges!degree_programs_college_id_fkey(name)
                        `)
                        .eq('name', majorName)
                        .eq('is_active', true)
                        .single();

                    if (programError) {
                        const errorDetails = {
                            message: programError?.message || 'Unknown error',
                            details: programError?.details || 'No details available',
                            hint: programError?.hint || 'No hint provided',
                            code: programError?.code || 'No error code',
                            full_error: JSON.stringify(programError, Object.getOwnPropertyNames(programError))
                        };
                        console.error('Error fetching degree program:', errorDetails);

                        // Try case-insensitive fallback
                        const { data: fallbackProgram, error: fallbackError } = await supabase
                            .from('degree_programs')
                            .select(`
                                id, 
                                name, 
                                degree_type, 
                                total_credits, 
                                requirements,
                                colleges!degree_programs_college_id_fkey(name)
                            `)
                            .ilike('name', majorName)
                            .eq('is_active', true)
                            .single();

                        if (fallbackError) {
                            console.error('Case-insensitive fallback also failed:', fallbackError);
                            return null;
                        }

                        
                        // Convert fallback program to visual format
                        const visualProgram: VisualDegreeProgram = {
                            id: fallbackProgram.id,
                            name: fallbackProgram.name,
                            degreeType: fallbackProgram.degree_type,
                            college: (fallbackProgram.colleges as any)?.name || undefined,
                            totalCredits: fallbackProgram.total_credits || undefined,
                            requirements: Array.isArray(fallbackProgram.requirements) ? fallbackProgram.requirements : [],
                            footnotes: []
                        };
                        
                        return visualProgram;
                    }

                    if (!program) {
                        console.error(`No degree program found for major: ${majorName}`);
                        return null;
                    }


                    // Convert to visual program format
                    const visualProgram: VisualDegreeProgram = {
                        id: program.id,
                        name: program.name,
                        degreeType: program.degree_type,
                        college: (program.colleges as any)?.name || undefined,
                        totalCredits: program.total_credits || undefined,
                        requirements: Array.isArray(program.requirements) ? program.requirements : [],
                        footnotes: []
                    };

                    return visualProgram;

                } catch (error: any) {
                    console.error('Error in fetchDegreeProgramRequirements:', {
                        message: error?.message || 'Unknown error',
                        stack: error?.stack,
                        error: error
                    });
                    return null;
                }
            },

            // Fetch minor program requirements for visual system (NEW: using minors JSON column)
            fetchMinorProgramsRequirements: async (): Promise<VisualMinorProgram[]> => {
                try {
                    // Get the current user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        console.error('No authenticated user found');
                        return [];
                    }

                    // Get user's minors from users table (NEW: using minors JSON column)
                    const { data: userRecord, error: userError } = await supabase
                        .from('users')
                        .select('minors')
                        .eq('auth_id', user.id)
                        .single();

                    if (userError) {
                        console.error('Error fetching user record:', userError);
                        return [];
                    }

                    if (!userRecord?.minors || !Array.isArray(userRecord.minors) || userRecord.minors.length === 0) {
                            return [];
                    }

                    const minorNames = userRecord.minors;

                    // Query minor programs by names
                    const { data: programs, error: programError } = await supabase
                        .from('degree_programs')
                        .select('id, name, requirements')
                        .eq('degree_type', 'Minor')
                        .in('name', minorNames)
                        .eq('is_active', true);

                    if (programError) {
                        console.error('Error fetching minor programs:', programError);
                        return [];
                    }

                    // Transform the database structure to match VisualMinorProgram[]
                    const visualMinors: VisualMinorProgram[] = (programs || []).map(program => ({
                        id: program.id,
                        name: program.name,
                        requirements: Array.isArray(program.requirements) ? program.requirements : [],
                        footnotes: [] // You can add footnotes logic here if needed
                    }));

                    return visualMinors;

                } catch (error) {
                    console.error('Error in fetchMinorProgramsRequirements:', error);
                    return [];
                }
            },

            updateStudentInfo: (info: Partial<StudentInfo> | UserProfile) => {
                set((state) => {
                    // Handle both StudentInfo and UserProfile types
                    const updatedStudentInfo = {
                        ...state.studentInfo,
                        ...info,
                        // Map UserProfile fields to StudentInfo if needed
                        name: (info as any).name || state.studentInfo.name,
                        email: (info as any).email || state.studentInfo.email,
                        major: (info as any).major || state.studentInfo.major,
                        threads: (info as any).threads || state.studentInfo.threads,
                        minors: (info as any).minors || state.studentInfo.minors,
                        expectedGraduation: (info as any).expectedGraduation || state.studentInfo.expectedGraduation,
                        currentGPA: (info as any).currentGPA || state.studentInfo.currentGPA,
                    };

                    // Generate semesters if we have the required data
                    const startDate = (info as any).startDate || (info as any).startYear;
                    const graduationDate = (info as any).expectedGraduation;
                    
                    if (startDate && graduationDate) {
                        // Parse startDate to get semester and year
                        let startSemester = 'Fall';
                        let startYear = new Date().getFullYear();
                        
                        if (typeof startDate === 'string') {
                            if (startDate.includes('Fall') || startDate.includes('Spring') || startDate.includes('Summer')) {
                                const parts = startDate.split(' ');
                                startSemester = parts[0];
                                startYear = parseInt(parts[1]) || new Date().getFullYear();
                            } else {
                                // Try to parse as year
                                const yearMatch = startDate.match(/\d{4}/);
                                if (yearMatch) {
                                    startYear = parseInt(yearMatch[0]);
                                }
                            }
                        } else if (typeof startDate === 'number') {
                            startYear = startDate;
                        }
                        
                        const formattedStartDate = `${startSemester} ${startYear}`;
                        
                        // Generate semesters immediately without setTimeout for better performance
                        const { semesters } = get();
                        if (Object.keys(semesters).length === 0) {
                            get().generateSemesters(formattedStartDate, graduationDate);
                        }
                    }

                    return {
                        studentInfo: updatedStudentInfo,
                        userProfile: info as UserProfile, // Also update userProfile
                    };
                });
            },

            addCourseToSemester: (course: PlannedCourse) => {
                set((state) => {
                    const semester = state.semesters[course.semesterId];
                    if (!semester) return state;

                    // Ensure course has all required properties
                    const safeCourseCourses = semester.courses || [];
                    
                    // Check if course already exists in this semester
                    if (safeCourseCourses.some((c) => c?.id === course.id))
                        return state;

                    // Ensure the course has a status
                    const courseWithStatus = {
                        ...course,
                        status: course.status || "planned"
                    } as PlannedCourse;

                    const updatedCourses = [...safeCourseCourses, courseWithStatus];
                    const totalCredits = updatedCourses.reduce(
                        (sum, c) => sum + (c?.credits || 0),
                        0,
                    );

                    const updatedSemesters = {
                        ...state.semesters,
                        [course.semesterId]: {
                            ...semester,
                            courses: updatedCourses,
                            totalCredits,
                        },
                    };

                    const newActivity: ActivityItem = {
                        id: Date.now(),
                        type: "course_added",
                        title: `Added ${course.code} to ${semester.season} ${semester.year}`,
                        description: course.title,
                        timestamp: new Date(),
                    };

                    // Use constant to prevent infinite growth
                    const MAX_ACTIVITY_ITEMS = 10;
                    return {
                        semesters: updatedSemesters,
                        recentActivity: [
                            newActivity,
                            ...state.recentActivity.slice(0, MAX_ACTIVITY_ITEMS - 1),
                        ],
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(course.semesterId);
            },

            removeCourseFromSemester: (
                courseId: number,
                semesterId: number,
            ) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const courseToRemove = safeCourses.find(c => c?.id === courseId);
                    const updatedCourses = safeCourses.filter(
                        (c) => c?.id !== courseId,
                    );
                    const totalCredits = updatedCourses.reduce(
                        (sum, c) => sum + (c?.credits || 0),
                        0,
                    );

                    // Add removal activity
                    const newActivity: ActivityItem = {
                        id: Date.now(),
                        type: "course_added", // Using course_added as generic activity type
                        title: `Removed ${courseToRemove?.code || 'course'} from ${semester.season} ${semester.year}`,
                        description: courseToRemove?.title || 'Course removed',
                        timestamp: new Date(),
                    };

                    const MAX_ACTIVITY_ITEMS = 10;
                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                                totalCredits,
                            },
                        },
                        recentActivity: [
                            newActivity,
                            ...state.recentActivity.slice(0, MAX_ACTIVITY_ITEMS - 1),
                        ],
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(semesterId);
            },

            moveCourse: (
                courseId: number,
                fromSemester: number,
                toSemester: number,
            ) => {
                set((state) => {
                    const fromSem = state.semesters[fromSemester];
                    const toSem = state.semesters[toSemester];

                    if (!fromSem || !toSem) return state;

                    const fromCourses = fromSem.courses || [];
                    const toCourses = toSem.courses || [];

                    const course = fromCourses.find((c) => c?.id === courseId);
                    if (!course) return state;

                    // Check if course already exists in target semester
                    if (toCourses.some((c) => c?.id === courseId))
                        return state;

                    const updatedCourse = { ...course, semesterId: toSemester };
                    const newFromCourses = fromCourses.filter(
                        (c) => c?.id !== courseId,
                    );
                    const newToCourses = [...toCourses, updatedCourse];

                    return {
                        semesters: {
                            ...state.semesters,
                            [fromSemester]: {
                                ...fromSem,
                                courses: newFromCourses,
                                totalCredits: newFromCourses.reduce(
                                    (sum, c) => sum + (c?.credits || 0),
                                    0,
                                ),
                            },
                            [toSemester]: {
                                ...toSem,
                                courses: newToCourses,
                                totalCredits: newToCourses.reduce(
                                    (sum, c) => sum + (c?.credits || 0),
                                    0,
                                ),
                            },
                        },
                    };
                });

                // Use batch updates instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(fromSemester);
                get().updateSemesterGPA(toSemester);
            },

            moveCourseToSemester: (courseId: string, targetSemesterId: number) => {
                set((state) => {
                    // Find the course in any semester
                    let sourceSemesterId: number | null = null;
                    let course: PlannedCourse | null = null;
                    
                    for (const [semId, semester] of Object.entries(state.semesters)) {
                        const foundCourse = semester.courses?.find(c => 
                            (c?.id?.toString() === courseId || c?.code === courseId)
                        );
                        if (foundCourse) {
                            course = foundCourse;
                            sourceSemesterId = parseInt(semId);
                            break;
                        }
                    }
                    
                    if (!course || sourceSemesterId === null) return state;
                    if (sourceSemesterId === targetSemesterId) return state;
                    
                    const sourceSem = state.semesters[sourceSemesterId];
                    const targetSem = state.semesters[targetSemesterId];
                    
                    if (!sourceSem || !targetSem) return state;
                    
                    // Remove from source
                    const newSourceCourses = (sourceSem.courses || []).filter(
                        c => c?.id !== course?.id
                    );
                    
                    // Add to target with updated semesterId
                    const courseForTarget = {
                        ...course,
                        semesterId: targetSemesterId
                    };
                    const newTargetCourses = [...(targetSem.courses || []), courseForTarget];
                    
                    return {
                        semesters: {
                            ...state.semesters,
                            [sourceSemesterId]: {
                                ...sourceSem,
                                courses: newSourceCourses,
                                totalCredits: newSourceCourses.reduce(
                                    (sum, c) => sum + (c?.credits || 0),
                                    0,
                                ),
                            },
                            [targetSemesterId]: {
                                ...targetSem,
                                courses: newTargetCourses,
                                totalCredits: newTargetCourses.reduce(
                                    (sum, c) => sum + (c?.credits || 0),
                                    0,
                                ),
                            },
                        },
                    };
                });
                
                // Update GPAs for both semesters
                const state = get();
                const sourceSem = Object.entries(state.semesters).find(([_, sem]) => 
                    sem.courses?.some(c => c?.id?.toString() === courseId || c?.code === courseId)
                );
                if (sourceSem) {
                    get().updateSemesterGPA(parseInt(sourceSem[0]));
                }
                get().updateSemesterGPA(targetSemesterId);
            },

            updateCourseGrade: (
                courseId: number,
                semesterId: number,
                grade: string,
            ) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.map((course) =>
                        course?.id === courseId ? { ...course, grade } : course,
                    );

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                            },
                        },
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(semesterId);
            },

            updateCourseStatus: (
                courseId: number,
                semesterId: number,
                status: PlannedCourse["status"],
                grade?: string,
            ) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.map((course) =>
                        course?.id === courseId
                            ? {
                                  ...course,
                                  status,
                                  grade: grade || course.grade,
                              }
                            : course,
                    );

                    const course = safeCourses.find((c) => c?.id === courseId);
                    const newActivity: ActivityItem = {
                        id: Date.now(),
                        type: status === "completed" ? "requirement_completed" : "course_added",
                        title: `${course?.code || 'Course'} marked as ${status}`,
                        description: grade
                            ? `Grade: ${grade}`
                            : `Status updated to ${status}`,
                        timestamp: new Date(),
                    };

                    const MAX_ACTIVITY_ITEMS = 10;
                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                            },
                        },
                        recentActivity: [
                            newActivity,
                            ...state.recentActivity.slice(0, MAX_ACTIVITY_ITEMS - 1),
                        ],
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(semesterId);
            },

            setSelectedSemester: (semesterId: number | null) => {
                set({ selectedSemester: semesterId });
            },

            setSidebarOpen: (open: boolean) => {
                set({ sidebarOpen: open });
            },

            updateAcademicProgress: () => {
                const state = get();
                const allCourses = state.getAllCourses(); // Use safe method

                const creditsCompleted = allCourses
                    .filter((c) => c.status === "completed")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const creditsInProgress = allCourses
                    .filter((c) => c.status === "in-progress")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const creditsPlanned = allCourses
                    .filter((c) => c.status === "planned")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const currentGPA = get().calculateGPA();

                set({
                    academicProgress: {
                        ...state.academicProgress,
                        creditsCompleted,
                        creditsInProgress,
                        creditsPlanned,
                        currentGPA,
                    },
                });
            },

            calculateGPA: () => {
                const state = get();
                const allCourses = state.getAllCourses(); // Use safe method
                const completedCourses = allCourses.filter(
                    (c) => c.status === "completed" && c.grade
                );

                if (completedCourses.length === 0) return 0;

                const totalPoints = completedCourses.reduce((sum, course) => {
                    return sum + gradeToGPA(course.grade!) * (course.credits || 0);
                }, 0);

                const totalCredits = completedCourses.reduce(
                    (sum, course) => sum + (course.credits || 0),
                    0,
                );

                return totalCredits > 0 ? totalPoints / totalCredits : 0;
            },

            getTotalCredits: () => {
                const state = get();
                const allCourses = state.getAllCourses(); // Use safe method
                return allCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
            },

            calculateSemesterGPA: (semesterId: number) => {
                const state = get();
                const semester = state.semesters[semesterId];
                if (!semester) return 0;

                const safeCourses = semester.courses || [];
                const completedCourses = safeCourses.filter(
                    (c) => c?.status === "completed" && c.grade,
                );

                if (completedCourses.length === 0) return 0;

                const totalPoints = completedCourses.reduce((sum, course) => {
                    return sum + gradeToGPA(course.grade!) * (course.credits || 0);
                }, 0);

                const totalCredits = completedCourses.reduce(
                    (sum, course) => sum + (course.credits || 0),
                    0,
                );

                return totalCredits > 0 ? totalPoints / totalCredits : 0;
            },

            updateSemesterGPA: (semesterId: number) => {
                set((state) => {
                    const gpa = get().calculateSemesterGPA(semesterId);
                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...state.semesters[semesterId],
                                gpa,
                            },
                        },
                    };
                });
            },

            getGPAHistory: () => {
                const state = get();
                const safeSemesters = state.getSafeSemesters(); // Use safe method
                
                return safeSemesters
                    .map((semester) => ({
                        semester: `${semester.season} ${semester.year}`,
                        year: semester.year,
                        gpa: semester.gpa || 0,
                        credits: (semester.courses || [])
                            .filter((c) => c?.status === "completed")
                            .reduce((sum, c) => sum + (c?.credits || 0), 0),
                    }))
                    .filter((s) => s.credits > 0)
                    .sort(
                        (a, b) =>
                            a.year - b.year ||
                            a.semester.localeCompare(b.semester),
                    );
            },

            addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => {
                set((state) => {
                    // Limit recent activity to maximum 10 items to prevent memory leaks
                    const MAX_ACTIVITY_ITEMS = 10;
                    const newActivity = {
                        ...activity,
                        id: Date.now(),
                        timestamp: new Date(),
                    };
                    
                    return {
                        recentActivity: [
                            newActivity,
                            ...state.recentActivity.slice(0, MAX_ACTIVITY_ITEMS - 1),
                        ],
                    };
                });
            },

            updateStudentThreads: async (threads: number[]) => {
                // Update both the numeric IDs and convert to names for studentInfo
                const state = get();
                const threadNames = threads
                    .map((id) => {
                        const program = state.degreePrograms.find(
                            (p) => p?.id === id,
                        );
                        return program?.name || "";
                    })
                    .filter(Boolean);

                set((state) => ({
                    studentInfo: { ...state.studentInfo, threads: threadNames },
                    selectedThreads: threads,
                }));

                await get().fetchAndUpdateRequirements();
                get().calculateThreadProgress();
            },

            updateStudentMinors: async (minors: number[]) => {
                // Update both the numeric IDs and convert to names for studentInfo
                const state = get();
                const minorNames = minors
                    .map((id) => {
                        const program = state.degreePrograms.find(
                            (p) => p?.id === id,
                        );
                        return program?.name || "";
                    })
                    .filter(Boolean);

                set((state) => ({
                    studentInfo: { ...state.studentInfo, minors: minorNames },
                    selectedMinors: minors,
                }));

                await get().fetchAndUpdateRequirements();
                get().calculateMinorProgress();
            },

            updateStudentMajor: async (major: string) => {
                set((state) => ({
                    studentInfo: { ...state.studentInfo, major },
                }));
                await get().fetchAndUpdateRequirements();
            },

            fetchAndUpdateRequirements: async () => {
                const state = get();
                try {
                    // Fetch thread requirements
                    if (state.studentInfo.threads?.length > 0) {
                        const { data: threadReqs, error: threadError } =
                            await supabase
                                .from("degree_programs")
                                .select("*")
                                .eq("degree_type", "Thread")
                                .in("id", state.studentInfo.threads);

                        if (threadError) throw threadError;

                        set((state) => ({
                            studentInfo: {
                                ...state.studentInfo,
                                threadRequirements: threadReqs || [],
                            },
                        }));
                    }

                    // Fetch minor requirements
                    if (state.studentInfo.minors?.length > 0) {
                        const { data: minorReqs, error: minorError } =
                            await supabase
                                .from("degree_programs")
                                .select("*")
                                .eq("degree_type", "Minor")
                                .in("id", state.studentInfo.minors);

                        if (minorError) throw minorError;

                        set((state) => ({
                            studentInfo: {
                                ...state.studentInfo,
                                minorRequirements: minorReqs || [],
                            },
                        }));
                    }

                    // Fetch major requirements
                    if (state.studentInfo.major) {
                        const { data: majorReqs, error: majorError } =
                            await supabase
                                .from("degree_programs")
                                .select("*")
                                .eq("degree_type", "BS")
                                .eq("name", state.studentInfo.major);

                        if (majorError) throw majorError;

                        set((state) => ({
                            studentInfo: {
                                ...state.studentInfo,
                                majorRequirements: majorReqs || [],
                            },
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching requirements:", error);
                }
            },

            calculateThreadProgress: () => {
                // This will be calculated in getThreadMinorProgress()
                // keeping for backward compatibility
            },

            calculateMinorProgress: () => {
                // This will be calculated in getThreadMinorProgress()
                // keeping for backward compatibility
            },

            generateSemesters: (startDate: string, graduationDate: string) => {
                const [startSeason, startYear] = startDate.split(" ");
                const [gradSeason, gradYear] = graduationDate.split(" ");

                if (!startSeason || !startYear || !gradSeason || !gradYear) {
                    console.error("Invalid date format for semester generation");
                    return {};
                }

                const semesters: Record<number, SemesterData> = {};
                const seasons = ["Fall", "Spring", "Summer"];

                let currentYear = parseInt(startYear);
                let currentSeasonIndex = seasons.indexOf(startSeason);
                let semesterCount = 0;

                // Safety check for invalid season
                if (currentSeasonIndex === -1) {
                    console.error("Invalid start season:", startSeason);
                    return {};
                }

                const finalYear = parseInt(gradYear);
                
                // Add extra semesters beyond graduation to ensure all options are available
                const extendedFinalYear = finalYear + 1;

                // Generate ALL semesters from start to extended final year
                while (currentYear <= extendedFinalYear) {
                    const season = seasons[currentSeasonIndex];
                    // Unique semester ID generation: YYYYSS (year + season index)
                    const semesterId = currentYear * 100 + currentSeasonIndex;

                    semesters[semesterId] = {
                        id: semesterId,
                        year: currentYear,
                        season: season as "Fall" | "Spring" | "Summer",
                        courses: [], // Always initialize as empty array
                        totalCredits: 0,
                        maxCredits: 18,
                        isActive: semesterCount === 0,
                        gpa: 0,
                    };

                    semesterCount++;
                    currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
                    if (currentSeasonIndex === 0) {
                        currentYear++;
                    }

                    // Safety break to prevent infinite loops
                    if (semesterCount > 25) {
                        break;
                    }
                }

                set({ semesters });
                return semesters;
            },

            // Enhanced planning state management methods
            exportPlanningData: () => {
                const state = get();
                const exportData = {
                    studentInfo: state.studentInfo,
                    semesters: state.semesters,
                    selectedThreads: state.selectedThreads,
                    selectedMinors: state.selectedMinors,
                    academicProgress: state.academicProgress,
                    exportedAt: new Date().toISOString(),
                    version: "1.0"
                };
                return JSON.stringify(exportData, null, 2);
            },

            importPlanningData: async (data: string): Promise<boolean> => {
                try {
                    const importedData = JSON.parse(data);
                    
                    // Validate the imported data structure
                    if (!importedData.studentInfo || !importedData.semesters) {
                        console.error("Invalid import data: missing required fields");
                        return false;
                    }

                    // Merge imported data with current state
                    set((state) => ({
                        ...state,
                        studentInfo: importedData.studentInfo,
                        semesters: importedData.semesters || {},
                        selectedThreads: importedData.selectedThreads || [],
                        selectedMinors: importedData.selectedMinors || [],
                        academicProgress: importedData.academicProgress || state.academicProgress,
                    }));

                    // Recalculate progress after import
                    get().updateAcademicProgress();
                    
                    return true;
                } catch (error) {
                    console.error("Failed to import planning data:", error);
                    return false;
                }
            },

            clearAllPlannedCourses: () => {
                set((state) => {
                    const clearedSemesters = Object.keys(state.semesters).reduce((acc, semesterKey) => {
                        const semesterId = parseInt(semesterKey);
                        const semester = state.semesters[semesterId];
                        
                        acc[semesterId] = {
                            ...semester,
                            courses: semester.courses.filter(course => course.status !== 'planned'),
                            totalCredits: semester.courses
                                .filter(course => course.status !== 'planned')
                                .reduce((sum, course) => sum + (course.credits || 0), 0)
                        };
                        
                        return acc;
                    }, {} as Record<number, SemesterData>);

                    return {
                        semesters: clearedSemesters,
                    };
                });

                // Update progress after clearing
                get().updateAcademicProgress();
            },

            getCompletionStats: () => {
                const state = get();
                const allCourses = state.getAllCourses();
                
                const completed = allCourses.filter(c => c.status === 'completed');
                const inProgress = allCourses.filter(c => c.status === 'in-progress');
                const planned = allCourses.filter(c => c.status === 'planned');
                
                return {
                    totalCourses: allCourses.length,
                    completedCourses: completed.length,
                    inProgressCourses: inProgress.length,
                    plannedCourses: planned.length,
                    completionRate: allCourses.length > 0 ? (completed.length / allCourses.length) * 100 : 0,
                };
            },

            validateSemesterPlan: (semesterId: number) => {
                const state = get();
                const semester = state.semesters[semesterId];
                const warnings: string[] = [];
                const errors: string[] = [];
                
                if (!semester) {
                    return { isValid: false, warnings, errors: ['Semester not found'] };
                }

                const courses = semester.courses || [];
                const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

                // Credit validation
                if (totalCredits > semester.maxCredits) {
                    errors.push(`Semester exceeds maximum credits (${totalCredits}/${semester.maxCredits})`);
                }
                
                if (totalCredits < 12 && courses.length > 0) {
                    warnings.push(`Semester has fewer than 12 credits (${totalCredits})`);
                }

                // Prerequisite validation (basic)
                courses.forEach(course => {
                    if (course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0) {
                        warnings.push(`Check prerequisites for ${course.code}`);
                    }
                });

                return {
                    isValid: errors.length === 0,
                    warnings,
                    errors,
                };
            },

            // User isolation methods - SECURITY FIX: These methods are now deprecated
            // Components should use useUserAwarePlannerStore instead
            checkAndHandleUserChange: () => {
                // For backward compatibility, still clear data if somehow called
                get().clearUserData();
            },

            getCurrentStorageUserId: () => {
                return getAnonymousSessionId();
            },

            clearUserData: () => {
                set((state) => ({
                    ...state,
                    studentInfo: {
                        id: 0,
                        name: "",
                        email: "",
                        major: "",
                        threads: [],
                        minors: [],
                        startYear: new Date().getFullYear(),
                        expectedGraduation: "",
                        currentGPA: 0,
                        majorRequirements: [],
                        minorRequirements: [],
                        threadRequirements: [],
                    },
                    semesters: {},
                    academicProgress: {
                        totalCreditsRequired: 126,
                        creditsCompleted: 0,
                        creditsInProgress: 0,
                        creditsPlanned: 0,
                        currentGPA: 0,
                        projectedGPA: 0,
                        graduationDate: "",
                        onTrack: false,
                        threadProgress: 0,
                        minorProgress: 0,
                    },
                    recentActivity: [],
                    selectedThreads: [],
                    selectedMinors: [],
                }));
            },
        }),
        {
            name: `gt-planner-storage-${getAnonymousSessionId()}`,
            // Check cookie consent before persisting
            storage: {
                getItem: async (name: string) => {
                    // Allow reading if necessary cookies are accepted or no consent decision made yet
                    const consent = localStorage.getItem('gt-course-planner-cookie-consent');
                    const settings = localStorage.getItem('gt-course-planner-cookie-settings');
                    
                    if (!consent || (settings && JSON.parse(settings).functional)) {
                        const value = localStorage.getItem(name);
                        return value ? JSON.parse(value) : null;
                    }
                    return null;
                },
                setItem: async (name: string, value: any) => {
                    // Only persist if functional cookies are allowed or no consent decision made
                    const consent = localStorage.getItem('gt-course-planner-cookie-consent');
                    const settings = localStorage.getItem('gt-course-planner-cookie-settings');
                    
                    if (!consent || (settings && JSON.parse(settings).functional)) {
                        localStorage.setItem(name, JSON.stringify(value));
                    }
                },
                removeItem: async (name: string) => {
                    localStorage.removeItem(name);
                }
            },
            partialize: (state) => {
                // Calculate storage size and implement cleanup if needed
                const dataToStore = {
                    studentInfo: state.studentInfo,
                    userProfile: state.userProfile,
                    semesters: state.semesters,
                    academicProgress: state.academicProgress,
                    selectedThreads: state.selectedThreads,
                    selectedMinors: state.selectedMinors,
                    // Limit recent activity to prevent localStorage bloat
                    recentActivity: state.recentActivity.slice(0, 10),
                    // Store timestamp to track when data was last updated
                    lastUpdated: Date.now(),
                    // Store session ID for anonymous users only
                    sessionId: getAnonymousSessionId(),
                };
                
                // Estimate storage size (rough calculation)
                const storageSize = JSON.stringify(dataToStore).length;
                const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
                
                if (storageSize > MAX_STORAGE_SIZE) {
                    console.warn('Planner data exceeds storage limit, reducing data size');
                    // Reduce data size by removing older activity and limiting semesters
                    return {
                        ...dataToStore,
                        recentActivity: state.recentActivity.slice(0, 5),
                        // Keep only active semesters if storage is too large
                        semesters: Object.fromEntries(
                            Object.entries(state.semesters)
                                .filter(([_, sem]) => (sem.courses || []).length > 0)
                                .slice(0, 20) // Limit to 20 semesters
                        ),
                    };
                }
                
                return dataToStore;
            },
            version: 1,
            migrate: (persistedState: any, version: number) => {
                // Handle migration from older versions
                if (version === 0) {
                    return {
                        ...persistedState,
                        lastUpdated: Date.now(),
                        sessionId: getAnonymousSessionId(),
                    };
                }
                return persistedState;
            },
        },
    ),
);