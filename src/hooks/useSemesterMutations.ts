import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { PlannedCourse, SemesterData } from '@/types';

// Create a new semester
export const useCreateSemester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SemesterData>) => {
      const res = await api.semesters.create(data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Update entire semester data
export const useUpdateSemester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<SemesterData> }) => {
      const res = await api.semesters.update(id, data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Delete a semester
export const useDeleteSemester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (semesterId: number) => {
      const res = await api.semesters.delete({ semesterId });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Add a course to a semester (granular operation)
export const useAddCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ semesterId, course }: { semesterId: number; course: PlannedCourse }) => {
      const res = await api.semesters.update(semesterId, {
        operation: 'addCourse',
        courseData: course,
      });
      return res;
    },
    onMutate: async ({ semesterId, course }) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: ['semesters'] });

      // Snapshot the previous value
      const previousSemesters = qc.getQueryData(['semesters']);

      // Optimistically update to the new value
      qc.setQueryData(['semesters'], (old: any) => {
        if (!old) return old;

        const semester = old[semesterId];
        if (!semester) return old;

        const isDuplicate = semester.courses?.some((c: PlannedCourse) => c.id === course.id);
        if (isDuplicate) return old;

        const updatedCourses = [...(semester.courses || []), course];
        const totalCredits = updatedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

        return {
          ...old,
          [semesterId]: {
            ...semester,
            courses: updatedCourses,
            totalCredits,
          },
        };
      });

      return { previousSemesters };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSemesters) {
        qc.setQueryData(['semesters'], context.previousSemesters);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Remove a course from a semester (granular operation)
export const useRemoveCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ semesterId, courseId }: { semesterId: number; courseId: number }) => {
      const res = await api.semesters.update(semesterId, {
        operation: 'removeCourse',
        courseData: { id: courseId },
      });
      return res;
    },
    onMutate: async ({ semesterId, courseId }) => {
      await qc.cancelQueries({ queryKey: ['semesters'] });
      const previousSemesters = qc.getQueryData(['semesters']);

      qc.setQueryData(['semesters'], (old: any) => {
        if (!old) return old;

        const semester = old[semesterId];
        if (!semester) return old;

        const updatedCourses = (semester.courses || []).filter((c: PlannedCourse) => c.id !== courseId);
        const totalCredits = updatedCourses.reduce((sum: number, c: PlannedCourse) => sum + (c.credits || 0), 0);

        return {
          ...old,
          [semesterId]: {
            ...semester,
            courses: updatedCourses,
            totalCredits,
          },
        };
      });

      return { previousSemesters };
    },
    onError: (err, variables, context) => {
      if (context?.previousSemesters) {
        qc.setQueryData(['semesters'], context.previousSemesters);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Move a course from one semester to another
export const useMoveCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fromSemesterId,
      toSemesterId,
      course,
    }: {
      fromSemesterId: number;
      toSemesterId: number;
      course: PlannedCourse;
    }) => {
      // First remove from old semester
      await api.semesters.update(fromSemesterId, {
        operation: 'removeCourse',
        courseData: { id: course.id },
      });

      // Then add to new semester (with updated semesterId)
      const updatedCourse = { ...course, semesterId: toSemesterId };
      const res = await api.semesters.update(toSemesterId, {
        operation: 'addCourse',
        courseData: updatedCourse,
      });

      return res;
    },
    onMutate: async ({ fromSemesterId, toSemesterId, course }) => {
      await qc.cancelQueries({ queryKey: ['semesters'] });
      const previousSemesters = qc.getQueryData(['semesters']);

      qc.setQueryData(['semesters'], (old: any) => {
        if (!old) return old;

        const fromSemester = old[fromSemesterId];
        const toSemester = old[toSemesterId];

        if (!fromSemester || !toSemester) return old;

        // Remove from old semester
        const fromCourses = (fromSemester.courses || []).filter((c: PlannedCourse) => c.id !== course.id);
        const fromCredits = fromCourses.reduce((sum: number, c: PlannedCourse) => sum + (c.credits || 0), 0);

        // Add to new semester (check for duplicates)
        const isDuplicate = (toSemester.courses || []).some((c: PlannedCourse) => c.id === course.id);
        const toCourses = isDuplicate
          ? toSemester.courses
          : [...(toSemester.courses || []), { ...course, semesterId: toSemesterId }];
        const toCredits = toCourses.reduce((sum: number, c: PlannedCourse) => sum + (c.credits || 0), 0);

        return {
          ...old,
          [fromSemesterId]: {
            ...fromSemester,
            courses: fromCourses,
            totalCredits: fromCredits,
          },
          [toSemesterId]: {
            ...toSemester,
            courses: toCourses,
            totalCredits: toCredits,
          },
        };
      });

      return { previousSemesters };
    },
    onError: (err, variables, context) => {
      if (context?.previousSemesters) {
        qc.setQueryData(['semesters'], context.previousSemesters);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Update course status (e.g., 'planned' -> 'completed')
export const useUpdateCourseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      semesterId,
      courseId,
      status,
      grade,
    }: {
      semesterId: number;
      courseId: number;
      status: 'planned' | 'in-progress' | 'completed';
      grade?: string;
    }) => {
      const res = await api.semesters.update(semesterId, {
        operation: 'updateCourseStatus',
        courseData: { id: courseId, status, grade },
      });
      return res;
    },
    onMutate: async ({ semesterId, courseId, status, grade }) => {
      await qc.cancelQueries({ queryKey: ['semesters'] });
      const previousSemesters = qc.getQueryData(['semesters']);

      qc.setQueryData(['semesters'], (old: any) => {
        if (!old) return old;

        const semester = old[semesterId];
        if (!semester) return old;

        const updatedCourses = (semester.courses || []).map((c: PlannedCourse) =>
          c.id === courseId ? { ...c, status, ...(grade && { grade }) } : c
        );

        // Recalculate GPA if status is 'completed'
        const completedCourses = updatedCourses.filter(
          (c: PlannedCourse) => c.status === 'completed' && c.grade
        );
        let gpa = 0;
        if (completedCourses.length > 0) {
          const gradeToGPA: Record<string, number> = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
          let totalPoints = 0;
          let totalCredits = 0;
          completedCourses.forEach((c: PlannedCourse) => {
            const gpaValue = gradeToGPA[c.grade || ''] || 0;
            const credits = c.credits || 3;
            totalPoints += gpaValue * credits;
            totalCredits += credits;
          });
          gpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
        }

        return {
          ...old,
          [semesterId]: {
            ...semester,
            courses: updatedCourses,
            gpa,
          },
        };
      });

      return { previousSemesters };
    },
    onError: (err, variables, context) => {
      if (context?.previousSemesters) {
        qc.setQueryData(['semesters'], context.previousSemesters);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
      // Also invalidate course completions since status changed
      qc.invalidateQueries({ queryKey: ['courseCompletions'] });
    },
  });
};

// Update course grade
export const useUpdateCourseGrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      semesterId,
      courseId,
      grade,
    }: {
      semesterId: number;
      courseId: number;
      grade: string;
    }) => {
      const res = await api.semesters.update(semesterId, {
        operation: 'updateCourse',
        courseData: { id: courseId, grade },
      });
      return res;
    },
    onMutate: async ({ semesterId, courseId, grade }) => {
      await qc.cancelQueries({ queryKey: ['semesters'] });
      const previousSemesters = qc.getQueryData(['semesters']);

      qc.setQueryData(['semesters'], (old: any) => {
        if (!old) return old;

        const semester = old[semesterId];
        if (!semester) return old;

        const updatedCourses = (semester.courses || []).map((c: PlannedCourse) =>
          c.id === courseId ? { ...c, grade } : c
        );

        // Recalculate GPA
        const completedCourses = updatedCourses.filter(
          (c: PlannedCourse) => c.status === 'completed' && c.grade
        );
        let gpa = 0;
        if (completedCourses.length > 0) {
          const gradeToGPA: Record<string, number> = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
          let totalPoints = 0;
          let totalCredits = 0;
          completedCourses.forEach((c: PlannedCourse) => {
            const gpaValue = gradeToGPA[c.grade || ''] || 0;
            const credits = c.credits || 3;
            totalPoints += gpaValue * credits;
            totalCredits += credits;
          });
          gpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
        }

        return {
          ...old,
          [semesterId]: {
            ...semester,
            courses: updatedCourses,
            gpa,
          },
        };
      });

      return { previousSemesters };
    },
    onError: (err, variables, context) => {
      if (context?.previousSemesters) {
        qc.setQueryData(['semesters'], context.previousSemesters);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Bulk create semesters (for initial generation)
export const useBulkCreateSemesters = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (semesters: Partial<SemesterData>[]) => {
      const res = await api.semesters.bulkCreate(semesters);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

// Combined hook for convenience
export const useSemesterMutations = () => {
  return {
    createSemester: useCreateSemester(),
    updateSemester: useUpdateSemester(),
    deleteSemester: useDeleteSemester(),
    addCourse: useAddCourse(),
    removeCourse: useRemoveCourse(),
    moveCourse: useMoveCourse(),
    updateCourseStatus: useUpdateCourseStatus(),
    updateCourseGrade: useUpdateCourseGrade(),
    bulkCreateSemesters: useBulkCreateSemesters(),
  };
};

// Export individual hooks as well
export default useSemesterMutations;
