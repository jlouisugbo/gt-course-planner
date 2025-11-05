import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from '@/lib/api/client';

import { StudentInfo, SemesterData, PlannedCourse, UserProfile } from "@/types";
// Requirements fetching moved to dedicated hooks; no direct import of visual types here
import { convertToSeasonYear, isValidSeasonYear} from "@/lib/utils/dateUtils";
interface PlannerState {
    // Planning data only
    semesters: Record<number, SemesterData>;

    // Local planner UI refs
    selectedSemester: number | null;
    draggedCourse: PlannedCourse | null;

    // Lifecycle/init
    initializeStore: () => Promise<void>;
    // Compatibility shim to trigger semester generation from profile info
    updateStudentInfo: (info: Partial<StudentInfo> | UserProfile) => void;
    generateSemesters: (startDate: string, graduationDate: string) => void;

    // Course/semester CRUD
    addCourseToSemester: (course: PlannedCourse) => void;
    removeCourseFromSemester: (courseId: number, semesterId: number) => void;
    moveCourse: (courseId: number, fromSemester: number, toSemester: number) => void;
    moveCourseToSemester: (courseId: string, targetSemesterId: number) => void;
    updateCourseGrade: (courseId: number, semesterId: number, grade: string) => void;
    updateCourseStatus: (courseId: number, semesterId: number, status: PlannedCourse["status"], grade?: string) => void;
    setSelectedSemester: (semesterId: number | null) => void;

    // Derived (semester scope)
    updateSemesterGPA: (semesterId: number) => void;
    calculateSemesterGPA: (semesterId: number) => number;

    // Helpers
    getAllCourses: () => PlannedCourse[];
    getCoursesByStatus: (status: PlannedCourse["status"]) => PlannedCourse[];
    getSafeSemesters: () => SemesterData[];

    // Utilities
    exportPlanningData: () => string;
    importPlanningData: (data: string) => Promise<boolean>;
    clearAllPlannedCourses: () => void;
    getCompletionStats: () => { totalCourses: number; completedCourses: number; inProgressCourses: number; plannedCourses: number; completionRate: number };
    validateSemesterPlan: (semesterId: number) => { isValid: boolean; warnings: string[]; errors: string[] };
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
            semesters: createInitialSemesters(),
            selectedSemester: null,
            draggedCourse: null,

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

            // Deadlines are handled by useDeadlines hook; removed from store

            // Initialize store with database data (or demo data in demo mode)
            initializeStore: async () => {

                // Check for demo mode
                if (typeof window !== 'undefined') {
                    const { isDemoMode } = await import('@/lib/demo-mode');

                    if (isDemoMode()) {
                        console.log('[Demo Mode] Initializing store with demo data');

                        // Import demo data
                        const { generateDemoSemesters } = await import('@/lib/demo-data');

                        // Set demo semesters
                        const demoSemesters = generateDemoSemesters();
                        set({ semesters: demoSemesters });

                        // Demo activity exists but is no longer stored in planner store

                        // Academic progress moved to derived hooks/services

                        console.log('[Demo Mode] Store initialized with demo data');
                        return;
                    }
                }

                // Normal mode - no-op; data comes from dedicated hooks
                return;
            },

            // Degree program requirements are fetched via dedicated hooks; removed from store

            updateStudentInfo: (info: Partial<StudentInfo> | UserProfile) => {
                // Compatibility shim: only triggers semester generation based on provided dates
                // Does not store user profile/student info in planner store
                const startDate = (info as any).startDate || (info as any).startYear;
                const graduationDate = (info as any).expectedGraduation;
                if (!startDate || !graduationDate) return;

                let startSemester = 'Fall';
                let startYear = new Date().getFullYear();
                if (typeof startDate === 'string') {
                    if (startDate.includes('Fall') || startDate.includes('Spring') || startDate.includes('Summer')) {
                        const parts = startDate.split(' ');
                        startSemester = parts[0];
                        startYear = parseInt(parts[1]) || new Date().getFullYear();
                    } else {
                        const yearMatch = startDate.match(/\d{4}/);
                        if (yearMatch) startYear = parseInt(yearMatch[0]);
                    }
                } else if (typeof startDate === 'number') {
                    startYear = startDate;
                }

                const formattedStartDate = `${startSemester} ${startYear}`;
                let formattedGraduationDate: any = graduationDate;
                if (typeof graduationDate === 'string' && !graduationDate.match(/^(Fall|Spring|Summer)\s+\d{4}$/)) {
                    try {
                        formattedGraduationDate = convertToSeasonYear(graduationDate);
                    } catch {
                        const currentYear = new Date().getFullYear();
                        formattedGraduationDate = `Spring ${currentYear + 4}`;
                    }
                }

                const { semesters } = get();
                if (Object.keys(semesters).length === 0) {
                    get().generateSemesters(formattedStartDate, formattedGraduationDate);
                }
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

                    return {
                        semesters: updatedSemesters,
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(course.semesterId);

                // External persistence handled via API hooks/migration helper
            },

            removeCourseFromSemester: (
                courseId: number,
                semesterId: number,
            ) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.filter(
                        (c) => c?.id !== courseId,
                    );
                    const totalCredits = updatedCourses.reduce(
                        (sum, c) => sum + (c?.credits || 0),
                        0,
                    );

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                                totalCredits,
                            },
                        },
                    };
                });

                // Use batch update instead of setTimeout to prevent unnecessary re-renders
                get().updateSemesterGPA(semesterId);

                // External persistence handled via API hooks/migration helper
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

                // External persistence handled via API hooks/migration helper
            },

            setSelectedSemester: (semesterId: number | null) => {
                set({ selectedSemester: semesterId });
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

            

            // Removed thread/minor updates and progress; handled by dedicated hooks/profile

            generateSemesters: (startDate: string, graduationDate: string) => {
                // Comprehensive input validation
                if (!startDate || !graduationDate) {
                    console.error("[usePlannerStore] Invalid date format: dates are null/undefined", { startDate, graduationDate });
                    return {};
                }

                if (typeof startDate !== 'string' || typeof graduationDate !== 'string') {
                    console.error("[usePlannerStore] Invalid date format: dates must be strings", {
                        startDate: typeof startDate,
                        graduationDate: typeof graduationDate
                    });
                    return {};
                }

                if (!isValidSeasonYear(startDate) || !isValidSeasonYear(graduationDate)) {
                    const error = new Error(
                        `[usePlannerStore] Invalid date format. ` +
                        `Expected 'Season YYYY' format (e.g., 'Fall 2024'). ` +
                        `Received: start='${startDate}', graduation='${graduationDate}'. ` +
                        `Please complete your profile with valid dates.`
                    );
                    console.error(error.message);
                    throw error;
                }

                const [startSeason, startYear] = startDate.split(" ");
                const [gradSeason, gradYear] = graduationDate.split(" ");

                if (!startSeason || !startYear || !gradSeason || !gradYear) {
                    console.error("[usePlannerStore] Invalid date format: missing season or year after split", {
                        startDate,
                        startSeason,
                        startYear,
                        graduationDate,
                        gradSeason,
                        gradYear
                    });
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

                // Determine current semester based on current date
                const now = new Date();
                const currentCalendarYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
                
                let currentSemesterSeason: string;
                if (currentMonth >= 8 && currentMonth <= 12) {
                    currentSemesterSeason = 'Fall';
                } else if (currentMonth >= 1 && currentMonth <= 5) {
                    currentSemesterSeason = 'Spring';
                } else {
                    currentSemesterSeason = 'Summer';
                }

                // Generate ALL semesters from start to extended final year
                while (currentYear <= extendedFinalYear) {
                    const season = seasons[currentSeasonIndex];
                    // Unique semester ID generation: YYYYSS (year + season index)
                    const semesterId = currentYear * 100 + currentSeasonIndex;

                    // Check if this is the current semester
                    const isCurrentSemester = currentYear === currentCalendarYear && season === currentSemesterSeason;

                    semesters[semesterId] = {
                        id: semesterId,
                        year: currentYear,
                        season: season as "Fall" | "Spring" | "Summer",
                        courses: [], // Always initialize as empty array
                        totalCredits: 0,
                        maxCredits: 18,
                        isActive: isCurrentSemester,
                        isCompleted: false,
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

                // Persist generated semesters to the backend where possible.
                // Fire-and-forget: don't block UI if user is unauthenticated or API fails.
                if (typeof window !== 'undefined') {
                    (async () => {
                        try {
                            const semesterArray = Object.values(semesters).map(s => ({
                                semesterId: s.id,
                                year: s.year,
                                season: s.season,
                                courses: s.courses || [],
                                maxCredits: (s as any).maxCredits || (s as any).max_credits || 18,
                                isActive: !!s.isActive,
                            }));

                            // Use batch endpoint to upsert all semesters at once
                            await api.semesters.bulkCreate(semesterArray);
                        } catch (err) {
                            // Ignore persistence errors; store is still updated locally.
                            console.warn('Failed to persist generated semesters (bulk):', err);
                        }
                    })();
                }

                return semesters;
            },

            // Enhanced planning state management methods
            exportPlanningData: () => {
                const state = get();
                const exportData = {
                    semesters: state.semesters,
                    exportedAt: new Date().toISOString(),
                    version: "1.0"
                };
                return JSON.stringify(exportData, null, 2);
            },

            importPlanningData: async (data: string): Promise<boolean> => {
                try {
                    const importedData = JSON.parse(data);
                    
                    // Validate the imported data structure
                    if (!importedData.semesters) {
                        console.error("Invalid import data: missing required fields");
                        return false;
                    }

                    // Merge imported data with current state
                    set((state) => ({
                        ...state,
                        semesters: importedData.semesters || {},
                    }));

                    // Progress now derived via hooks/services
                    
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

                // Progress now derived via hooks/services
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

            // Removed direct Supabase sync

            clearUserData: () => {
                set((state) => ({
                    ...state,
                    semesters: {},
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
                const migrated = typeof window !== 'undefined' && localStorage.getItem('gt-semesters-migrated') === 'true';
                // Only persist semesters prior to migration; afterwards, persist metadata only
                const base = {
                    // Store timestamp to track when data was last updated
                    lastUpdated: Date.now(),
                    // Store session ID for anonymous users only
                    sessionId: getAnonymousSessionId(),
                } as Record<string, any>;

                const dataToStore = migrated ? base : { ...base, semesters: state.semesters };

                if (!migrated) {
                    // Estimate storage size (rough calculation) only when persisting semesters
                    const storageSize = JSON.stringify(dataToStore).length;
                    const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

                    if (storageSize > MAX_STORAGE_SIZE) {
                        console.warn('Planner data exceeds storage limit, reducing data size');
                        return {
                            ...base,
                            semesters: Object.fromEntries(
                                Object.entries(state.semesters)
                                    .filter(([_, sem]) => (sem.courses || []).length > 0)
                                    .slice(0, 20)
                            ),
                        };
                    }
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