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
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_OPPORTUNITIES } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useOpportunities: Using mock data, NO API calls');

          let filtered = DEMO_OPPORTUNITIES;
          if (filters?.type) {
            filtered = DEMO_OPPORTUNITIES.filter((opp: any) => opp.opportunity_type === filters.type);
          }

          return filtered as Opportunity[];
        }
      }

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
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_APPLICATIONS, DEMO_OPPORTUNITIES } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useMyApplications: Using mock data, NO API calls');

          // Populate the opportunity field by joining with DEMO_OPPORTUNITIES
          const applicationsWithOpportunity = DEMO_APPLICATIONS.map((app: any) => ({
            ...app,
            opportunity: DEMO_OPPORTUNITIES.find((opp: any) => opp.id === app.opportunity_id)
          }));

          return applicationsWithOpportunity as OpportunityApplication[];
        }
      }

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
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_APPLICATIONS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useApplication: Using mock data, NO API calls');

          const app = DEMO_APPLICATIONS.find((a: any) => a.id === id);
          if (!app) {
            throw new Error('Application not found');
          }

          return app as OpportunityApplication;
        }
      }

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
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useCreateApplication: No-op, NO API calls');
          return {} as OpportunityApplication;
        }
      }

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
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useUpdateApplication: No-op, NO API calls');
          return {} as OpportunityApplication;
        }
      }

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
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useDeleteApplication: No-op, NO API calls');
          return { success: true };
        }
      }

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
