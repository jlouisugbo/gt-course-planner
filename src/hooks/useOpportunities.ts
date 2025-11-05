import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Opportunity,
  OpportunityApplication,
  OpportunityFilters,
  CreateApplicationData,
  UpdateApplicationData,
} from '@/types';

// Fetch all opportunities with optional type filter
export const useOpportunities = (filters?: OpportunityFilters) => {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filters?.type) params.type = filters.type;
      const data = await api.opportunities.list(params);
      return (data?.data ?? data ?? []) as Opportunity[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch user's applications
export const useMyApplications = () => {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const data = await api.opportunities.applications.list();
      return (data?.data ?? data ?? []) as OpportunityApplication[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get specific application
export const useApplication = (id: number) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const data = await api.opportunities.applications.get(id);
      return (data?.data ?? data) as OpportunityApplication;
    },
    enabled: !!id,
  });
};

// Create new application
export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const result = await api.opportunities.applications.create(data);
      return (result?.data ?? result) as OpportunityApplication;
    },
    onSuccess: () => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};

// Update existing application
export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateApplicationData }) => {
      const result = await api.opportunities.applications.update(id, data);
      return (result?.data ?? result) as OpportunityApplication;
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific application
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', variables.id] });
    },
  });
};

// Delete application
export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.opportunities.applications.delete(id);
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};
