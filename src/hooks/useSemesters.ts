import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

// Hook: useSemesters
// Returns semesters object keyed by semesterId (same shape the planner store expects)
export const useSemesters = () => {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const res = await api.semesters.getAll();
      return res?.semesters || {};
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
};

export default useSemesters;
