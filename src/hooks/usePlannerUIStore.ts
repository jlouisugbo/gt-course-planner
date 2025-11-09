import { create } from 'zustand';
import { PlannedCourse } from '@/types';

type ModalState = {
  plannerSettingsOpen: boolean;
  courseDetailsOpen: boolean;
  activeCourseId?: number | null;
};

type PlannerUIState = {
  // UI-only state
  selectedSemester: number | null;
  draggedCourse: PlannedCourse | null;
  sidebarOpen: boolean;
  expandedSemesters: Record<number, boolean>; // Track which semesters are expanded/collapsed
  modals: ModalState;

  // Filter state (UI only)
  courseFilter: string;
  statusFilter: 'all' | 'planned' | 'in-progress' | 'completed';

  // Actions
  setSelectedSemester: (id: number | null) => void;
  setDraggedCourse: (course: PlannedCourse | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSemesterExpanded: (id: number) => void;
  expandAllSemesters: () => void;
  collapseAllSemesters: () => void;
  setCourseFilter: (filter: string) => void;
  setStatusFilter: (filter: 'all' | 'planned' | 'in-progress' | 'completed') => void;
  openPlannerSettings: () => void;
  closePlannerSettings: () => void;
  openCourseDetails: (courseId: number) => void;
  closeCourseDetails: () => void;
  resetFilters: () => void;
};

export const usePlannerUIStore = create<PlannerUIState>((set) => ({
  // Initial UI state
  selectedSemester: null,
  draggedCourse: null,
  sidebarOpen: true,
  expandedSemesters: {},
  courseFilter: '',
  statusFilter: 'all',
  modals: {
    plannerSettingsOpen: false,
    courseDetailsOpen: false,
    activeCourseId: null,
  },

  // Basic UI actions
  setSelectedSemester: (id) => set({ selectedSemester: id }),
  setDraggedCourse: (course) => set({ draggedCourse: course }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Semester expand/collapse
  toggleSemesterExpanded: (id) =>
    set((state) => ({
      expandedSemesters: {
        ...state.expandedSemesters,
        [id]: !state.expandedSemesters[id],
      },
    })),
  expandAllSemesters: () =>
    set((state) => {
      const allExpanded: Record<number, boolean> = {};
      Object.keys(state.expandedSemesters).forEach((key) => {
        allExpanded[Number(key)] = true;
      });
      return { expandedSemesters: allExpanded };
    }),
  collapseAllSemesters: () =>
    set((state) => {
      const allCollapsed: Record<number, boolean> = {};
      Object.keys(state.expandedSemesters).forEach((key) => {
        allCollapsed[Number(key)] = false;
      });
      return { expandedSemesters: allCollapsed };
    }),

  // Filter actions
  setCourseFilter: (filter) => set({ courseFilter: filter }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  resetFilters: () => set({ courseFilter: '', statusFilter: 'all' }),

  // Modal actions
  openPlannerSettings: () =>
    set((s) => ({ modals: { ...s.modals, plannerSettingsOpen: true } })),
  closePlannerSettings: () =>
    set((s) => ({ modals: { ...s.modals, plannerSettingsOpen: false } })),
  openCourseDetails: (courseId) =>
    set((s) => ({ modals: { ...s.modals, courseDetailsOpen: true, activeCourseId: courseId } })),
  closeCourseDetails: () =>
    set((s) => ({ modals: { ...s.modals, courseDetailsOpen: false, activeCourseId: null } })),
}));

export default usePlannerUIStore;
