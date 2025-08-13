import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import { debounce } from 'lodash';
import { SemesterData, PlannedCourse, StudentInfo, UserProfile } from '@/types';

interface HybridPlannerState {
    // Local UI state
    isLoading: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    syncError: string | null;
    
    // User profile data (from DB)
    userProfile: UserProfile | null;
    studentInfo: StudentInfo;
    
    // Academic data (from DB)
    semesters: Record<number, SemesterData>;
    completedCourses: string[];
    semesterGPAs: any[];
    overallGPA: number;
    
    // UI state
    selectedSemester: number | null;
    draggedCourse: PlannedCourse | null;
    
    // Actions - Immediate UI updates
    updateStudentInfo: (info: Partial<StudentInfo>) => Promise<void>;
    addCourseToSemester: (semesterId: number, course: PlannedCourse) => Promise<void>;
    removeCourseFromSemester: (courseId: number, semesterId: number) => Promise<void>;
    moveCourse: (courseId: number, fromSemester: number, toSemester: number) => Promise<void>;
    addCompletedCourse: (courseCode: string, grade: string, semester: string, credits: number) => Promise<void>;
    removeCompletedCourse: (courseCode: string, semester?: string) => Promise<void>;
    
    // Sync actions
    syncWithDatabase: () => Promise<void>;
    loadUserData: () => Promise<void>;
    
    // Utility actions
    setSelectedSemester: (semesterId: number | null) => void;
    setDraggedCourse: (course: PlannedCourse | null) => void;
    calculateGPA: () => number;
}

// Debounced sync function to avoid too many API calls
const debouncedSync = debounce(async (syncFn: () => Promise<void>) => {
    await syncFn();
}, 2000); // 2 second delay

export const useHybridPlannerStore = create<HybridPlannerState>()(
    persist(
        (set, get) => ({
            // Initial state
            isLoading: false,
            isSyncing: false,
            lastSyncTime: null,
            syncError: null,
            userProfile: null,
            studentInfo: {
                id: 0,
                name: '',
                gtId: 0,
                email: '',
                major: '',
                threads: [],
                minors: [],
                majorRequirements: [],
                startYear: new Date().getFullYear(),
                expectedGraduation: '',
                graduationSemester: '',
                currentGPA: 0,
                currentSemester: '',
            },
            semesters: {},
            completedCourses: [],
            semesterGPAs: [],
            overallGPA: 0,
            selectedSemester: null,
            draggedCourse: null,

            // Load user data from database
            loadUserData: async () => {
                set({ isLoading: true, syncError: null });
                try {
                    // Get current user
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error('Not authenticated');

                    // Fetch user profile
                    const response = await fetch('/api/user-profile', {
                        headers: {
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                        }
                    });

                    if (!response.ok) throw new Error('Failed to load profile');
                    const profileData = await response.json();

                    // Fetch completed courses
                    const completionsResponse = await fetch('/api/course-completions', {
                        headers: {
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                        }
                    });

                    const completionsData = await completionsResponse.json();

                    // Update store with fetched data
                    set({
                        userProfile: profileData,
                        studentInfo: {
                            name: profileData.fullName || '',
                            gtId: profileData.gtUsername || '',
                            email: profileData.email || '',
                            major: profileData.major || '',
                            threads: profileData.selectedThreads || [],
                            minors: [],
                            majorRequirements: [],
                            startYear: new Date().getFullYear(),
                            expectedGraduation: profileData.graduationYear ? `Spring ${profileData.graduationYear}` : '',
                            graduationSemester: profileData.graduationYear ? `Spring ${profileData.graduationYear}` : '',
                            currentGPA: profileData.overallGPA || 0,
                            id: 0,
                        },
                        completedCourses: completionsData.completedCourses || [],
                        semesterGPAs: completionsData.semesterGPAs || [],
                        overallGPA: completionsData.overallGPA || 0,
                        isLoading: false,
                        lastSyncTime: new Date()
                    });
                } catch (error) {
                    console.error('Error loading user data:', error);
                    set({ 
                        isLoading: false, 
                        syncError: error instanceof Error ? error.message : 'Failed to load user data' 
                    });
                }
            },

            // Update student info with database sync
            updateStudentInfo: async (info: Partial<StudentInfo>) => {
                // Immediate UI update
                set((state) => ({
                    studentInfo: { ...state.studentInfo, ...info }
                }));

                // Sync to database
                debouncedSync(async () => {
                    set({ isSyncing: true });
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) throw new Error('Not authenticated');

                        const updates: any = {};
                        if (info.name) updates.full_name = info.name;
                        if (info.gtId) updates.gt_username = info.gtId;
                        if (info.major) updates.major = info.major;
                        if (info.graduationSemester) {
                            const year = parseInt(info.graduationSemester.split(' ')[1]);
                            if (!isNaN(year)) updates.graduation_year = year;
                        }

                        await fetch('/api/user-profile', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify(updates)
                        });

                        set({ isSyncing: false, lastSyncTime: new Date() });
                    } catch (error) {
                        console.error('Error syncing student info:', error);
                        set({ isSyncing: false, syncError: 'Failed to sync profile' });
                    }
                });
            },

            // Add course to semester with optimistic update
            addCourseToSemester: async (semesterId: number, course: PlannedCourse) => {
                // Optimistic UI update
                set((state) => {
                    const semester = state.semesters[semesterId] || {
                        id: semesterId,
                        year: Math.floor(semesterId / 10),
                        season: semesterId % 10 === 1 ? 'Fall' : semesterId % 10 === 2 ? 'Spring' : 'Summer',
                        courses: [],
                        totalCredits: 0,
                        isCompleted: false,
                        isActive: false
                    };

                    const updatedCourses = [...semester.courses, course];
                    const totalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                                totalCredits
                            }
                        }
                    };
                });

                // Sync to database
                debouncedSync(async () => {
                    const state = get();
                    const semester = state.semesters[semesterId];
                    if (!semester) return;

                    set({ isSyncing: true });
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) throw new Error('Not authenticated');

                        await fetch('/api/semesters', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                semesterId: `${semester.season} ${semester.year}`,
                                year: semester.year,
                                season: semester.season,
                                courses: semester.courses
                            })
                        });

                        set({ isSyncing: false, lastSyncTime: new Date() });
                    } catch (error) {
                        console.error('Error syncing semester:', error);
                        set({ isSyncing: false, syncError: 'Failed to sync semester' });
                    }
                });
            },

            // Remove course from semester
            removeCourseFromSemester: async (courseId: number, semesterId: number) => {
                // Optimistic UI update
                set((state) => {
                    const semester = state.semesters[semesterId];
                    if (!semester) return state;

                    const updatedCourses = semester.courses.filter(c => c.id !== courseId);
                    const totalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

                    return {
                        semesters: {
                            ...state.semesters,
                            [semesterId]: {
                                ...semester,
                                courses: updatedCourses,
                                totalCredits
                            }
                        }
                    };
                });

                // Sync deletion
                await get().syncWithDatabase();
            },

            // Move course between semesters
            moveCourse: async (courseId: number, fromSemester: number, toSemester: number) => {
                const state = get();
                const course = state.semesters[fromSemester]?.courses.find(c => c.id === courseId);
                if (!course) return;

                // Remove from source
                await state.removeCourseFromSemester(courseId, fromSemester);
                // Add to destination
                await state.addCourseToSemester(toSemester, course);
            },

            // Add completed course with GPA calculation
            addCompletedCourse: async (courseCode: string, grade: string, semester: string, credits: number) => {
                // Optimistic update
                set((state) => ({
                    completedCourses: [...state.completedCourses, courseCode]
                }));

                // Sync to database with GPA calculation
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Not authenticated');

                    const response = await fetch('/api/course-completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ courseCode, grade, semester, credits })
                    });

                    const data = await response.json();
                    
                    // Update store with server-calculated GPAs
                    set({
                        completedCourses: data.completedCourses,
                        semesterGPAs: data.semesterGPAs,
                        overallGPA: data.overallGPA
                    });
                } catch (error) {
                    console.error('Error adding completed course:', error);
                    // Rollback on error
                    set((state) => ({
                        completedCourses: state.completedCourses.filter(c => c !== courseCode)
                    }));
                }
            },

            // Remove completed course
            removeCompletedCourse: async (courseCode: string, semester?: string) => {
                // Optimistic update
                set((state) => ({
                    completedCourses: state.completedCourses.filter(c => c !== courseCode)
                }));

                // Sync to database
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Not authenticated');

                    const url = new URL('/api/course-completions', window.location.origin);
                    url.searchParams.append('courseCode', courseCode);
                    if (semester) url.searchParams.append('semester', semester);

                    const response = await fetch(url.toString(), {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });

                    const data = await response.json();
                    
                    // Update store with server response
                    set({
                        completedCourses: data.completedCourses,
                        semesterGPAs: data.semesterGPAs,
                        overallGPA: data.overallGPA
                    });
                } catch (error) {
                    console.error('Error removing completed course:', error);
                }
            },

            // Manual sync with database
            syncWithDatabase: async () => {
                const state = get();
                if (state.isSyncing) return;

                set({ isSyncing: true, syncError: null });
                try {
                    // Sync all semesters
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) throw new Error('Not authenticated');

                    // Batch sync semesters
                    for (const [, semester] of Object.entries(state.semesters)) {
                        await fetch('/api/semesters', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                semesterId: `${semester.season} ${semester.year}`,
                                year: semester.year,
                                season: semester.season,
                                courses: semester.courses
                            })
                        });
                    }

                    set({ isSyncing: false, lastSyncTime: new Date() });
                } catch (error) {
                    console.error('Sync error:', error);
                    set({ 
                        isSyncing: false, 
                        syncError: error instanceof Error ? error.message : 'Sync failed' 
                    });
                }
            },

            // UI actions
            setSelectedSemester: (semesterId) => set({ selectedSemester: semesterId }),
            setDraggedCourse: (course) => set({ draggedCourse: course }),
            
            // Calculate GPA (uses stored value from server)
            calculateGPA: () => get().overallGPA,
        }),
        {
            name: 'hybrid-planner-storage',
            // Only persist UI state, not server data
            partialize: (state) => ({
                selectedSemester: state.selectedSemester,
                // Don't persist server data - always fetch fresh
            }),
        }
    )
);