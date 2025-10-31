import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);

      const response = await fetch(`/api/opportunities?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }

      const data = await response.json();
      return data.data as Opportunity[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch user's applications
export const useMyApplications = () => {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      const response = await fetch('/api/opportunities/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      return data.data as OpportunityApplication[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get specific application
export const useApplication = (id: number) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await fetch(`/api/opportunities/applications/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }

      const data = await response.json();
      return data.data as OpportunityApplication;
    },
    enabled: !!id,
  });
};

// Create new application
export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const response = await fetch('/api/opportunities/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create application');
      }

      const result = await response.json();
      return result.data as OpportunityApplication;
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
      const response = await fetch(`/api/opportunities/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update application');
      }

      const result = await response.json();
      return result.data as OpportunityApplication;
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
      const response = await fetch(`/api/opportunities/applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete application');
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};
