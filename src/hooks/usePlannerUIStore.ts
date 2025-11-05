import { create } from 'zustand';

type ModalState = {
  plannerSettingsOpen: boolean;
  courseDetailsOpen: boolean;
  activeCourseId?: number | null;
};

type PlannerUIState = {
  // UI-only state
  selectedSemester: number | null;
  draggedCourse: { id: number; code: string } | null;
  sidebarOpen: boolean;
  modals: ModalState;

  // Actions
  setSelectedSemester: (id: number | null) => void;
  setDraggedCourse: (course: { id: number; code: string } | null) => void;
  setSidebarOpen: (open: boolean) => void;
  openPlannerSettings: () => void;
  closePlannerSettings: () => void;
  openCourseDetails: (courseId: number) => void;
  closeCourseDetails: () => void;
};

export const usePlannerUIStore = create<PlannerUIState>((set) => ({
  selectedSemester: null,
  draggedCourse: null,
  sidebarOpen: true,
  modals: {
    plannerSettingsOpen: false,
    courseDetailsOpen: false,
    activeCourseId: null,
  },

  setSelectedSemester: (id) => set({ selectedSemester: id }),
  setDraggedCourse: (course) => set({ draggedCourse: course }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
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
