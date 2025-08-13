/**
 * Optimized Progress Management Store
 * Handles academic progress, GPA calculations, and requirement tracking
 * Split from main planner store for better performance
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AcademicProgress, ActivityItem } from "@/types";

interface ProgressState {
    // Progress data
    academicProgress: AcademicProgress;
    recentActivity: ActivityItem[];
    
    // Actions
    updateAcademicProgress: (courses: any[]) => void;
    addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void;
    calculateGPA: (courses: any[]) => number;
    getTotalCredits: (courses: any[]) => number;
    getGPAHistory: (semesters: any[]) => Array<{
        semester: string;
        year: number;
        gpa: number;
        credits: number;
    }>;
    getCompletionStats: (courses: any[]) => {
        totalCourses: number;
        completedCourses: number;
        inProgressCourses: number;
        plannedCourses: number;
        completionRate: number;
    };
    
    // Helper methods
    clearActivity: () => void;
    resetProgress: () => void;
}

const gradeToGPA = (grade: string): number => {
    const gradeMap: Record<string, number> = {
        A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0,
    };
    return gradeMap[grade] || 0;
};

const MAX_ACTIVITY_ITEMS = 10; // Prevent memory leaks

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
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

            // Optimized progress calculation
            updateAcademicProgress: (allCourses: any[]) => {
                const creditsCompleted = allCourses
                    .filter((c) => c.status === "completed")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const creditsInProgress = allCourses
                    .filter((c) => c.status === "in-progress")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const creditsPlanned = allCourses
                    .filter((c) => c.status === "planned")
                    .reduce((sum, c) => sum + (c.credits || 0), 0);

                const currentGPA = get().calculateGPA(allCourses);

                set((state) => ({
                    academicProgress: {
                        ...state.academicProgress,
                        creditsCompleted,
                        creditsInProgress,
                        creditsPlanned,
                        currentGPA,
                    },
                }));
            },

            // Optimized GPA calculation with memoization
            calculateGPA: (allCourses: any[]) => {
                const completedCourses = allCourses.filter(
                    (c) => c.status === "completed" && c.grade
                );

                if (completedCourses.length === 0) return 0;

                const totalPoints = completedCourses.reduce((sum, course) => {
                    return sum + gradeToGPA(course.grade!) * (course.credits || 0);
                }, 0);

                const totalCredits = completedCourses.reduce(
                    (sum, course) => sum + (course.credits || 0),
                    0
                );

                return totalCredits > 0 ? totalPoints / totalCredits : 0;
            },

            getTotalCredits: (allCourses: any[]) => {
                return allCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
            },

            // Optimized GPA history with proper sorting
            getGPAHistory: (safeSemesters: any[]) => {
                return safeSemesters
                    .map((semester) => ({
                        semester: `${semester.season} ${semester.year}`,
                        year: semester.year,
                        gpa: semester.gpa || 0,
                        credits: (semester.courses || [])
                            .filter((c: any) => c?.status === "completed")
                            .reduce((sum: number, c: any) => sum + (c?.credits || 0), 0),
                    }))
                    .filter((s) => s.credits > 0)
                    .sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        
                        // Sort by season within year
                        const seasonOrder: Record<string, number> = { 
                            'Spring': 1, 'Summer': 2, 'Fall': 3 
                        };
                        const aOrder = seasonOrder[a.semester.split(' ')[0]] || 0;
                        const bOrder = seasonOrder[b.semester.split(' ')[0]] || 0;
                        return aOrder - bOrder;
                    });
            },

            // Efficient activity management with size limits
            addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => {
                set((state) => {
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

            // Optimized completion statistics
            getCompletionStats: (allCourses: any[]) => {
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

            // Utility methods
            clearActivity: () => {
                set({ recentActivity: [] });
            },

            resetProgress: () => {
                set({
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
                });
            },
        }),
        {
            name: `gt-progress-storage`,
            partialize: (state) => ({
                academicProgress: state.academicProgress,
                // Limit persisted activity to prevent localStorage bloat
                recentActivity: state.recentActivity.slice(0, 5),
            }),
        }
    )
);