import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudentInfo, AcademicProgress, ActivityItem } from '@/types/planner';
import { SemesterData, PlannedCourse } from '@/types/courses';
import { RequirementCategory } from '@/types/requirements';
import { UserProfile } from "@/types/user";
import { supabase } from '@/lib/supabaseClient';

// Add these types for database integration
interface DegreeProgram {
  id: string;
  name: string;
  degree_type: 'Thread' | 'Minor' | 'Major';
  required_credits: number;
  description?: string;
  requirements?: {
    core_courses?: string[];
    elective_credits?: number;
    categories?: {
      name: string;
      required_credits: number;
      eligible_courses: string[];
    }[];
  };
}

interface Deadline {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  type: 'critical' | 'important' | 'normal' | 'future';
  category: 'registration' | 'academic' | 'graduation' | 'thread_selection' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProgressItem {
  id: string;
  name: string;
  type: 'thread' | 'minor';
  completed: number;
  required: number;
  percentage: number;
  color: string;
  courses: {
    completed: string[];
    inProgress: string[];
    planned: string[];
    remaining: string[];
  };
}

interface PlannerState {
  // User data
  studentInfo: StudentInfo;
  userProfile: UserProfile | null;
  
  // Planning data
  semesters: Record<string, SemesterData>;
  
  // Database data
  degreePrograms: DegreeProgram[];
  deadlines: Deadline[];
  selectedThreads: string[];
  selectedMinors: string[];
  
  // UI state
  selectedSemester: string | null;
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
  removeCourseFromSemester: (courseId: string, semesterId: string) => void;
  moveCourse: (courseId: string, fromSemester: string, toSemester: string) => void;
  updateCourseGrade: (courseId: string, semesterId: string, grade: string) => void;
  updateCourseStatus: (courseId: string, semesterId: string, status: PlannedCourse['status'], grade?: string) => void;
  setSelectedSemester: (semesterId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  updateAcademicProgress: () => void;
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void;
  generateSemesters: (startDate: string, graduationDate: string) => void;
  calculateGPA: () => number;
  getTotalCredits: () => number;
  updateStudentThreads: (threads: string[]) => Promise<void>;
  updateStudentMinors: (minors: string[]) => Promise<void>;
  updateStudentMajor: (major: string) => Promise<void>;
  fetchAndUpdateRequirements: () => Promise<void>;
  calculateThreadProgress: () => void;
  calculateMinorProgress: () => void;
  updateSemesterGPA: (semesterId: string) => void;
  calculateSemesterGPA: (semesterId: string) => number;
  getGPAHistory: () => Array<{ semester: string; year: number; gpa: number; credits: number; }>;
  
  // New database integration methods
  fetchDegreePrograms: () => Promise<void>;
  fetchDeadlines: () => Promise<void>;
  getThreadProgress: () => ProgressItem[];
  getThreadMinorProgress: () => ProgressItem[];
  getUpcomingDeadlines: () => (Deadline & { daysLeft: number; formattedDate: string })[];
  getAvailableThreads: () => DegreeProgram[];
  getAvailableMinors: () => DegreeProgram[];
  setSelectedThreads: (threadIds: string[]) => void;
  setSelectedMinors: (minorIds: string[]) => void;
  initializeStore: () => Promise<void>;
}

const createInitialSemesters = (): Record<string, SemesterData> => {
  return {};
};

const gradeToGPA = (grade: string): number => {
  const gradeMap: Record<string, number> = {
    'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0,
  };
  return gradeMap[grade] || 0;
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      studentInfo: {
        id: "",
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
      
      userProfile: null,
      semesters: createInitialSemesters(),
      selectedSemester: null,
      draggedCourse: null,
      sidebarOpen: true,
      
      // Database data
      degreePrograms: [],
      deadlines: [],
      selectedThreads: [],
      selectedMinors: [],
      isLoadingPrograms: false,
      isLoadingDeadlines: false,
      
      academicProgress: {
        totalCreditsRequired: 126, // Default for CS
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

      // Fetch degree programs from database
      fetchDegreePrograms: async () => {
        set({ isLoadingPrograms: true });
        try {
          const { data: programs, error } = await supabase
            .from('degree_programs')
            .select('*')
            .in('degree_type', ['Thread', 'Minor']);
          
          if (error) throw error;
          
          set({ degreePrograms: programs || [], isLoadingPrograms: false });
        } catch (error) {
          console.error('Failed to fetch degree programs:', error);
          set({ isLoadingPrograms: false });
        }
      },

      // Fetch deadlines (you'll need to create this table)
      fetchDeadlines: async () => {
        set({ isLoadingDeadlines: true });
        try {
          const { data: deadlines, error } = await supabase
            .from('deadlines')
            .select('*')
            .eq('is_active', true)
            .order('due_date', { ascending: true });
          
          if (error) throw error;
          
          set({ deadlines: deadlines || [], isLoadingDeadlines: false });
        } catch (error) {
          console.error('Failed to fetch deadlines:', error);
          set({ isLoadingDeadlines: false });
        }
      },

      // Set selected threads/minors
      setSelectedThreads: (threadIds: string[]) => {
        set({ selectedThreads: threadIds });
      },

      setSelectedMinors: (minorIds: string[]) => {
        set({ selectedMinors: minorIds });
      },

      // Get thread progress (legacy method for compatibility)
      getThreadProgress: () => {
        const state = get();
        return state.getThreadMinorProgress().filter(p => p.type === 'thread');
      },

      // Get thread/minor progress from database data
      getThreadMinorProgress: (): ProgressItem[] => {
        const state = get();
        const allCourses = Object.values(state.semesters).flatMap(s => s.courses);
        
        const calculateProgress = (program: DegreeProgram): ProgressItem => {
          let completedCredits = 0;
          const completedCourses: string[] = [];
          const inProgressCourses: string[] = [];
          const plannedCourses: string[] = [];
          const remainingCourses: string[] = [];

          if (program.requirements?.categories) {
            // Handle category-based requirements (typically threads)
            program.requirements.categories.forEach(category => {
              const categoryCompleted = allCourses.filter(course => 
                category.eligible_courses.includes(course.id) && course.status === 'completed'
              );
              const categoryInProgress = allCourses.filter(course =>
                category.eligible_courses.includes(course.id) && course.status === 'in-progress'
              );
              const categoryPlanned = allCourses.filter(course =>
                category.eligible_courses.includes(course.id) && course.status === 'planned'
              );

              categoryCompleted.forEach(course => {
                completedCredits += course.credits;
                completedCourses.push(course.id);
              });
              
              categoryInProgress.forEach(course => {
                inProgressCourses.push(course.id);
              });

              categoryPlanned.forEach(course => {
                plannedCourses.push(course.id);
              });

              // Find remaining eligible courses
              category.eligible_courses.forEach(courseId => {
                if (!allCourses.find(c => c.id === courseId)) {
                  remainingCourses.push(courseId);
                }
              });
            });
          } else if (program.requirements?.core_courses) {
            // Handle simple requirements (typically minors)
            program.requirements.core_courses.forEach(courseId => {
              const course = allCourses.find(c => c.id === courseId);
              if (course) {
                if (course.status === 'completed') {
                  completedCredits += course.credits;
                  completedCourses.push(course.id);
                } else if (course.status === 'in-progress') {
                  inProgressCourses.push(course.id);
                } else if (course.status === 'planned') {
                  plannedCourses.push(course.id);
                }
              } else {
                remainingCourses.push(courseId);
              }
            });
          }

          return {
            id: program.id,
            name: program.name,
            type: program.degree_type.toLowerCase() as 'thread' | 'minor',
            completed: completedCredits,
            required: program.required_credits,
            percentage: (completedCredits / program.required_credits) * 100,
            color: program.degree_type === 'Thread' ? '#8B5CF6' : '#F97316',
            courses: {
              completed: completedCourses,
              inProgress: inProgressCourses,
              planned: plannedCourses,
              remaining: remainingCourses
            }
          };
        };

        const progress: ProgressItem[] = [];
        
        // Calculate progress for selected threads
        state.selectedThreads.forEach(threadId => {
          const program = state.degreePrograms.find(p => p.id === threadId && p.degree_type === 'Thread');
          if (program) {
            progress.push(calculateProgress(program));
          }
        });

        // Calculate progress for selected minors
        state.selectedMinors.forEach(minorId => {
          const program = state.degreePrograms.find(p => p.id === minorId && p.degree_type === 'Minor');
          if (program) {
            progress.push(calculateProgress(program));
          }
        });

        return progress;
      },

      // Get upcoming deadlines with calculated days remaining
      getUpcomingDeadlines: () => {
        const state = get();
        const now = new Date();
        
        return state.deadlines
          .filter(deadline => deadline.is_active)
          .map(deadline => {
            const dueDate = new Date(deadline.due_date);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
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
        return state.degreePrograms.filter(p => p.degree_type === 'Thread');
      },

      // Get available minors from database
      getAvailableMinors: () => {
        const state = get();
        return state.degreePrograms.filter(p => p.degree_type === 'Minor');
      },

      // Initialize store with database data
      initializeStore: async () => {
        const state = get();
        await Promise.all([
          state.fetchDegreePrograms(),
          state.fetchDeadlines()
        ]);
      },
      
      updateStudentInfo: (info: Partial<StudentInfo>) => {
        set((state) => {
          const updatedStudentInfo = { ...state.studentInfo, ...info };
          
          if (info.startYear || info.expectedGraduation) {
            const startDate = `Fall ${info.startYear || state.studentInfo.startYear}`;
            const graduationDate = info.expectedGraduation || state.studentInfo.expectedGraduation;
            
            if (graduationDate) {
              get().generateSemesters(startDate, graduationDate);
            }
          }

          return {
            studentInfo: updatedStudentInfo
          };
        });
      },
      
      addCourseToSemester: (course: PlannedCourse) => {
        set((state) => {
          const semester = state.semesters[course.semesterId];
          if (!semester) return state;
          
          if (semester.courses.some(c => c.id === course.id)) return state;
          
          const updatedCourses = [...semester.courses, course];
          const totalCredits = updatedCourses.reduce((sum, c) => sum + c.credits, 0);
          
          const updatedSemesters = {
            ...state.semesters, 
            [course.semesterId]: {
              ...semester,
              courses: updatedCourses,
              totalCredits
            }
          };

          const newActivity: ActivityItem = {
            id: Date.now().toString(),
            type: 'course_added',
            title: `Added ${course.code} to ${semester.season} ${semester.year}`,
            description: course.title,
            timestamp: new Date()
          };

          return {
            semesters: updatedSemesters,
            recentActivity: [newActivity, ...state.recentActivity.slice(0, 9)]
          };
        });
        
        setTimeout(() => get().updateSemesterGPA(course.semesterId), 0);
      },
      
      removeCourseFromSemester: (courseId: string, semesterId: string) => {
        set((state) => {
          const semester = state.semesters[semesterId];
          if(!semester) return state;

          const updatedCourses = semester.courses.filter(c => c.id !== courseId);
          const totalCredits = updatedCourses.reduce((sum, c) => sum + c.credits, 0);

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
        
        setTimeout(() => get().updateSemesterGPA(semesterId), 0);
      },

      moveCourse: (courseId: string, fromSemester: string, toSemester: string) => {
        set((state) => {
          const fromSem = state.semesters[fromSemester];
          const toSem = state.semesters[toSemester];
          
          if (!fromSem || !toSem) return state;
          
          const course = fromSem.courses.find(c => c.id === courseId);
          if (!course) return state;
          
          const updatedCourse = { ...course, semesterId: toSemester };
          const fromCourses = fromSem.courses.filter(c => c.id !== courseId);
          const toCourses = [...toSem.courses, updatedCourse];
          
          return {
            semesters: {
              ...state.semesters,
              [fromSemester]: {
                ...fromSem,
                courses: fromCourses,
                totalCredits: fromCourses.reduce((sum, c) => sum + c.credits, 0)
              },
              [toSemester]: {
                ...toSem,
                courses: toCourses,
                totalCredits: toCourses.reduce((sum, c) => sum + c.credits, 0)
              }
            }
          };
        });
        
        setTimeout(() => {
          get().updateSemesterGPA(fromSemester);
          get().updateSemesterGPA(toSemester);
        }, 0);
      },

      updateCourseGrade: (courseId: string, semesterId: string, grade: string) => {
        set((state) => {
          const semester = state.semesters[semesterId];
          if (!semester) return state;

          const updatedCourses = semester.courses.map(course =>
            course.id === courseId ? { ...course, grade } : course
          );

          return {
            semesters: {
              ...state.semesters,
              [semesterId]: {
                ...semester,
                courses: updatedCourses
              }
            }
          };
        });
        
        setTimeout(() => get().updateSemesterGPA(semesterId), 0);
      },

      updateCourseStatus: (courseId: string, semesterId: string, status: PlannedCourse['status'], grade?: string) => {
        set((state) => {
          const semester = state.semesters[semesterId];
          if (!semester) return state;

          const updatedCourses = semester.courses.map(course =>
            course.id === courseId 
              ? { ...course, status, grade: grade || course.grade } 
              : course
          );

          const course = semester.courses.find(c => c.id === courseId);
          const newActivity: ActivityItem = {
            id: Date.now().toString(),
            type: status === 'completed' ? 'requirement_completed' : 'course_added',
            title: `${course?.code} marked as ${status}`,
            description: grade ? `Grade: ${grade}` : `Status updated to ${status}`,
            timestamp: new Date()
          };

          return {
            semesters: {
              ...state.semesters,
              [semesterId]: {
                ...semester,
                courses: updatedCourses
              }
            },
            recentActivity: [newActivity, ...state.recentActivity.slice(0, 9)]
          };
        });
        
        setTimeout(() => get().updateSemesterGPA(semesterId), 0);
      },
      
      setSelectedSemester: (semesterId: string | null) => {
        set({ selectedSemester: semesterId });
      },
      
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },
      
      updateAcademicProgress: () => {
        const state = get();
        const allCourses = Object.values(state.semesters).flatMap(s => s.courses);

        const creditsCompleted = allCourses
          .filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + c.credits, 0);
          
        const creditsInProgress = allCourses
          .filter(c => c.status === 'in-progress')
          .reduce((sum, c) => sum + c.credits, 0);
          
        const creditsPlanned = allCourses
          .filter(c => c.status === 'planned')
          .reduce((sum, c) => sum + c.credits, 0);

        const currentGPA = get().calculateGPA();

        set({
          academicProgress: {
            ...state.academicProgress,
            creditsCompleted,
            creditsInProgress,
            creditsPlanned,
            currentGPA
          }
        });
      },

      calculateGPA: () => {
        const state = get();
        const completedCourses = Object.values(state.semesters)
          .flatMap(s => s.courses)
          .filter(c => c.status === 'completed' && c.grade);

        if (completedCourses.length === 0) return 0;

        const totalPoints = completedCourses.reduce((sum, course) => {
          return sum + (gradeToGPA(course.grade!) * course.credits);
        }, 0);

        const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);

        return totalCredits > 0 ? totalPoints / totalCredits : 0;
      },

      getTotalCredits: () => {
        const state = get();
        const credits = Object.values(state.semesters).flatMap(s => s.courses).reduce((sum, c) => sum + c.credits, 0)
        return credits;
      },

      calculateSemesterGPA: (semesterId: string) => {
        const state = get();
        const semester = state.semesters[semesterId];
        if (!semester) return 0;
        
        const completedCourses = semester.courses.filter(
          c => c.status === 'completed' && c.grade
        );
        
        if (completedCourses.length === 0) return 0;
        
        const totalPoints = completedCourses.reduce((sum, course) => {
          return sum + (gradeToGPA(course.grade!) * course.credits);
        }, 0);
        
        const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);
        
        return totalCredits > 0 ? totalPoints / totalCredits : 0;
      },

      updateSemesterGPA: (semesterId: string) => {
        set(state => {
          const gpa = get().calculateSemesterGPA(semesterId);
          return {
            semesters: {
              ...state.semesters,
              [semesterId]: {
                ...state.semesters[semesterId],
                gpa
              }
            }
          };
        });
      },

      getGPAHistory: () => {
        const state = get();
        return Object.values(state.semesters)
          .map(semester => ({
            semester: `${semester.season} ${semester.year}`,
            year: semester.year,
            gpa: semester.gpa || 0,
            credits: semester.courses
              .filter(c => c.status === 'completed')
              .reduce((sum, c) => sum + c.credits, 0)
          }))
          .filter(s => s.credits > 0) 
          .sort((a, b) => a.year - b.year || a.semester.localeCompare(b.semester));
      },
      
      addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
        set((state) => ({
          recentActivity: [
            {
              ...activity,
              id: Date.now().toString(),
              timestamp: new Date()
            },
            ...state.recentActivity.slice(0, 9)
          ]
        }));
      },

      updateStudentThreads: async (threads: string[]) => {
        set(state => ({ 
          studentInfo: { ...state.studentInfo, threads },
          selectedThreads: threads 
        }));

        await get().fetchAndUpdateRequirements();
        get().calculateThreadProgress();
      },

      updateStudentMinors: async (minors: string[]) => {
        set(state => ({ 
          studentInfo: { ...state.studentInfo, minors },
          selectedMinors: minors 
        }));

        await get().fetchAndUpdateRequirements();
        get().calculateMinorProgress();
      },

      updateStudentMajor: async (major: string) => {
        set(state => ({ studentInfo: { ...state.studentInfo, major } }));
        await get().fetchAndUpdateRequirements();
      },

      fetchAndUpdateRequirements: async () => {
        const state = get();
        try {
          // Fetch thread requirements
          if (state.studentInfo.threads.length > 0) {
            const { data: threadReqs, error: threadError } = await supabase
              .from('degree_programs')
              .select('*')
              .eq('degree_type', 'Thread')
              .in('name', state.studentInfo.threads);
            
            if (threadError) throw threadError;

            set(state => ({
              studentInfo: {
                ...state.studentInfo,
                threadRequirements: threadReqs || [],
              }
            }));
          }

          // Fetch minor requirements
          if (state.studentInfo.minors.length > 0) {
            const { data: minorReqs, error: minorError } = await supabase
              .from('degree_programs')
              .select('*')
              .eq('degree_type', 'Minor')
              .in('name', state.studentInfo.minors);
            
            if (minorError) throw minorError;
            
            set(state => ({
              studentInfo: {
                ...state.studentInfo,
                minorRequirements: minorReqs || []
              }
            }));
          }

          // Fetch major requirements
          if (state.studentInfo.major) {
            const { data: majorReqs, error: majorError } = await supabase
              .from('degree_programs')
              .select('*')
              .eq('degree_type', 'Major')
              .eq('name', state.studentInfo.major);
            
            if (majorError) throw majorError;
            
            set(state => ({
              studentInfo: {
                ...state.studentInfo,
                majorRequirements: majorReqs || []
              }
            }));
          }
        } catch (error) {
          console.error('Error fetching requirements:', error);
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
        const [startSeason, startYear] = startDate.split(' ');
        const [gradSeason, gradYear] = graduationDate.split(' ');
        
        const semesters: Record<string, SemesterData> = {};
        const seasons = ['Fall', 'Spring', 'Summer'];
        
        let currentYear = parseInt(startYear);
        let currentSeasonIndex = seasons.indexOf(startSeason);
        let semesterCount = 0;
        
        while (currentYear < parseInt(gradYear) || 
               (currentYear === parseInt(gradYear) && seasons[currentSeasonIndex] !== gradSeason)) {
          
          const season = seasons[currentSeasonIndex];
          const semesterId = `${season.toLowerCase()}-${currentYear}`;
          
          semesters[semesterId] = {
            id: semesterId,
            year: currentYear,
            season: season as 'Fall' | 'Spring' | 'Summer',
            courses: [],
            totalCredits: 0,
            maxCredits: 18,
            isActive: semesterCount === 0,
            gpa: 0 
          };
          
          currentSeasonIndex = (currentSeasonIndex + 1) % seasons.length;
          if (currentSeasonIndex === 0) currentYear++;
          semesterCount++;
        }
        
        set({ semesters });
        return semesters;
      }
    }),
    {
      name: 'gt-planner-storage',
      partialize: (state) => ({
        studentInfo: state.studentInfo,
        userProfile: state.userProfile,
        semesters: state.semesters,
        academicProgress: state.academicProgress,
        selectedThreads: state.selectedThreads,
        selectedMinors: state.selectedMinors,
      })
    }
  )
);