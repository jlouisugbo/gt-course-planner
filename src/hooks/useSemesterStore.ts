/**
 * Optimized Semester Management Store
 * Split from the main planner store for better performance and separation of concerns
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SemesterData, PlannedCourse } from "@/types";

interface SemesterState {
    // Core semester data
    semesters: Record<number, SemesterData>;
    selectedSemester: number | null;
    
    // UI state
    draggedCourse: PlannedCourse | null;
    
    // Actions - optimized for performance
    addCourseToSemester: (course: PlannedCourse) => void;
    removeCourseFromSemester: (courseId: number, semesterId: number) => void;
    moveCourse: (courseId: number, fromSemester: number, toSemester: number) => void;
    updateCourseGrade: (courseId: number, semesterId: number, grade: string) => void;
    updateCourseStatus: (courseId: number, semesterId: number, status: PlannedCourse["status"], grade?: string) => void;
    setSelectedSemester: (semesterId: number | null) => void;
    setDraggedCourse: (course: PlannedCourse | null) => void;
    generateSemesters: (startDate: string, graduationDate: string) => Record<number, SemesterData>;
    calculateSemesterGPA: (semesterId: number) => number;
    updateSemesterGPA: (semesterId: number) => void;
    
    // Helper methods
    getAllCourses: () => PlannedCourse[];
    getCoursesByStatus: (status: PlannedCourse["status"]) => PlannedCourse[];
    getSafeSemesters: () => SemesterData[];
    clearAllPlannedCourses: () => void;
    validateSemesterPlan: (semesterId: number) => {
        isValid: boolean;
        warnings: string[];
        errors: string[];
    };
}

const gradeToGPA = (grade: string): number => {
    const gradeMap: Record<string, number> = {
        A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0,
    };
    return gradeMap[grade] || 0;
};

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

export const useSemesterStore = create<SemesterState>()(
    persist(
        (set, get) => ({
            semesters: {},
            selectedSemester: null,
            draggedCourse: null,

            // Optimized helper methods
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
                return get().getAllCourses().filter(course => course.status === status);
            },

            getSafeSemesters: () => {
                const state = get();
                return Object.values(state.semesters || {}).filter(ensureSemesterIntegrity);
            },

            // Optimized course management
            addCourseToSemester: (course: PlannedCourse) => {
                set((state) => {
                    const semester = state.semesters[course.semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    
                    // Check if course already exists
                    if (safeCourses.some((c) => c?.id === course.id)) return state;

                    const courseWithStatus = {
                        ...course,
                        status: course.status || "planned"
                    } as PlannedCourse;

                    const updatedCourses = [...safeCourses, courseWithStatus];
                    const totalCredits = updatedCourses.reduce(
                        (sum, c) => sum + (c?.credits || 0), 0
                    );

                    return {
                        semesters: {
                            ...state.semesters,
                            [course.semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                                totalCredits,
                            },
                        },
                    };
                });

                // Batch GPA update
                get().updateSemesterGPA(course.semesterId);
            },

            removeCourseFromSemester: (courseId: number, semesterId: number) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.filter((c) => c?.id !== courseId);
                    const totalCredits = updatedCourses.reduce(
                        (sum, c) => sum + (c?.credits || 0), 0
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

                get().updateSemesterGPA(semesterId);
            },

            moveCourse: (courseId: number, fromSemester: number, toSemester: number) => {
                set((state) => {
                    const fromSem = state.semesters[fromSemester];
                    const toSem = state.semesters[toSemester];

                    if (!fromSem || !toSem) return state;

                    const fromCourses = fromSem.courses || [];
                    const toCourses = toSem.courses || [];

                    const course = fromCourses.find((c) => c?.id === courseId);
                    if (!course || toCourses.some((c) => c?.id === courseId)) return state;

                    const updatedCourse = { ...course, semesterId: toSemester };
                    const newFromCourses = fromCourses.filter((c) => c?.id !== courseId);
                    const newToCourses = [...toCourses, updatedCourse];

                    return {
                        semesters: {
                            ...state.semesters,
                            [fromSemester]: {
                                ...fromSem,
                                courses: newFromCourses,
                                totalCredits: newFromCourses.reduce((sum, c) => sum + (c?.credits || 0), 0),
                            },
                            [toSemester]: {
                                ...toSem,
                                courses: newToCourses,
                                totalCredits: newToCourses.reduce((sum, c) => sum + (c?.credits || 0), 0),
                            },
                        },
                    };
                });

                // Batch GPA updates
                get().updateSemesterGPA(fromSemester);
                get().updateSemesterGPA(toSemester);
            },

            updateCourseGrade: (courseId: number, semesterId: number, grade: string) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.map((course) =>
                        course?.id === courseId ? { ...course, grade } : course
                    );

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: { ...semester, courses: updatedCourses },
                        },
                    };
                });

                get().updateSemesterGPA(semesterId);
            },

            updateCourseStatus: (courseId: number, semesterId: number, status: PlannedCourse["status"], grade?: string) => {
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const safeCourses = semester.courses || [];
                    const updatedCourses = safeCourses.map((course) =>
                        course?.id === courseId
                            ? { ...course, status, grade: grade || course.grade }
                            : course
                    );

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: { ...semester, courses: updatedCourses },
                        },
                    };
                });

                get().updateSemesterGPA(semesterId);
            },

            setSelectedSemester: (semesterId: number | null) => {
                set({ selectedSemester: semesterId });
            },

            setDraggedCourse: (course: PlannedCourse | null) => {
                set({ draggedCourse: course });
            },

            calculateSemesterGPA: (semesterId: number) => {
                const state = get();
                const semester = state.semesters[semesterId];
                if (!semester) return 0;

                const safeCourses = semester.courses || [];
                const completedCourses = safeCourses.filter(
                    (c) => c?.status === "completed" && c.grade
                );

                if (completedCourses.length === 0) return 0;

                const totalPoints = completedCourses.reduce((sum, course) => {
                    return sum + gradeToGPA(course.grade!) * (course.credits || 0);
                }, 0);

                const totalCredits = completedCourses.reduce(
                    (sum, course) => sum + (course.credits || 0), 0
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

                if (currentSeasonIndex === -1) {
                    console.error("Invalid start season:", startSeason);
                    return {};
                }

                const finalYear = parseInt(gradYear);
                const extendedFinalYear = finalYear + 1;

                while (currentYear <= extendedFinalYear) {
                    const season = seasons[currentSeasonIndex];
                    const semesterId = currentYear * 100 + currentSeasonIndex;

                    semesters[semesterId] = {
                        id: semesterId,
                        year: currentYear,
                        season: season as "Fall" | "Spring" | "Summer",
                        courses: [],
                        totalCredits: 0,
                        maxCredits: 18,
                        isActive: semesterCount === 0,
                        gpa: 0,
                    };

                    semesterCount++;
                    currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
                    if (currentSeasonIndex === 0) currentYear++;

                    if (semesterCount > 25) break; // Safety break
                }

                set({ semesters });
                return semesters;
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

                    return { semesters: clearedSemesters };
                });
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

                if (totalCredits > semester.maxCredits) {
                    errors.push(`Semester exceeds maximum credits (${totalCredits}/${semester.maxCredits})`);
                }
                
                if (totalCredits < 12 && courses.length > 0) {
                    warnings.push(`Semester has fewer than 12 credits (${totalCredits})`);
                }

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
        }),
        {
            name: `gt-semester-storage`,
            partialize: (state) => ({
                semesters: state.semesters,
                selectedSemester: state.selectedSemester,
            }),
        }
    )
);