import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useRequirementProgress(degreeProgramId: string | number) {
  return useQuery({
    queryKey: ['requirement-progress', degreeProgramId],
    queryFn: () => api.requirements.calculate(degreeProgramId),
    staleTime: 1000 * 60 * 10,
  });
}
