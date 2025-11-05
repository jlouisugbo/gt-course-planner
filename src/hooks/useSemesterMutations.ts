import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export const useCreateSemester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.semesters.create(data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

export const useUpdateSemester = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: any }) => {
      const res = await api.semesters.update(id, data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['semesters'] });
    },
  });
};

const semesterMutations = { useCreateSemester, useUpdateSemester };
export default semesterMutations;
