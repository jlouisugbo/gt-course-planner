import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Advisor,
  AdvisorConnection,
  AdvisorAppointment,
  AdvisorFilters,
  CreateConnectionData,
  CreateAppointmentData,
  UpdateAppointmentData,
} from '@/types';

// Fetch all advisors with optional filters
export const useAdvisors = (filters?: AdvisorFilters) => {
  return useQuery({
    queryKey: ['advisors', filters],
    queryFn: async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_ADVISORS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useAdvisors: Using mock data, NO API calls');

          let filtered = DEMO_ADVISORS;
          if (filters?.specialization) {
            filtered = DEMO_ADVISORS.filter((adv: any) =>
              adv.specializations.includes(filters.specialization)
            );
          }
          if (filters?.department) {
            filtered = filtered.filter((adv: any) =>
              adv.departments.includes(filters.department)
            );
          }
          if (filters?.acceptingStudents !== undefined) {
            filtered = filtered.filter((adv: any) =>
              adv.is_accepting_students === filters.acceptingStudents
            );
          }

          return filtered as Advisor[];
        }
      }

      const params = new URLSearchParams();
      if (filters?.specialization) params.set('specialization', filters.specialization);
      if (filters?.department) params.set('department', filters.department);
      if (filters?.acceptingStudents !== undefined) {
        params.set('acceptingStudents', String(filters.acceptingStudents));
      }

      const response = await fetch(`/api/advisors?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch advisors');
      }

      const data = await response.json();
      return data.data as Advisor[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get specific advisor
export const useAdvisor = (id: number) => {
  return useQuery({
    queryKey: ['advisor', id],
    queryFn: async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_ADVISORS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useAdvisor: Using mock data, NO API calls');

          const advisor = DEMO_ADVISORS.find((a: any) => a.id === id);
          if (!advisor) {
            throw new Error('Advisor not found');
          }

          return advisor as Advisor;
        }
      }

      const response = await fetch(`/api/advisors/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch advisor');
      }

      const data = await response.json();
      return data.data as Advisor;
    },
    enabled: !!id,
  });
};

// Fetch user's advisor connections
export const useMyAdvisors = () => {
  return useQuery({
    queryKey: ['my-advisors'],
    queryFn: async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_ADVISOR_CONNECTIONS, DEMO_ADVISORS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useMyAdvisors: Using mock data, NO API calls');

          // Populate the advisor field by joining with DEMO_ADVISORS
          const connectionsWithAdvisor = DEMO_ADVISOR_CONNECTIONS.map((conn: any) => ({
            ...conn,
            advisor: DEMO_ADVISORS.find((adv: any) => adv.id === conn.advisor_id)
          }));

          return connectionsWithAdvisor as AdvisorConnection[];
        }
      }

      const response = await fetch('/api/advisors/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch advisor connections');
      }

      const data = await response.json();
      return data.data as AdvisorConnection[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create advisor connection request
export const useCreateConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useCreateConnection: No-op, NO API calls');
          return {} as AdvisorConnection;
        }
      }

      const response = await fetch('/api/advisors/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create connection');
      }

      const result = await response.json();
      return result.data as AdvisorConnection;
    },
    onSuccess: () => {
      // Invalidate connections list to refetch
      queryClient.invalidateQueries({ queryKey: ['my-advisors'] });
    },
  });
};

// Fetch user's appointments
export const useAppointments = () => {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_APPOINTMENTS, DEMO_ADVISORS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useAppointments: Using mock data, NO API calls');

          // Populate the advisor field by joining with DEMO_ADVISORS
          const appointmentsWithAdvisor = DEMO_APPOINTMENTS.map((apt: any) => ({
            ...apt,
            advisor: DEMO_ADVISORS.find((adv: any) => adv.id === apt.advisor_id)
          }));

          return appointmentsWithAdvisor as AdvisorAppointment[];
        }
      }

      const response = await fetch('/api/advisors/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      return data.data as AdvisorAppointment[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get specific appointment
export const useAppointment = (id: number) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      // DEMO MODE: Return mock data immediately, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          const { DEMO_APPOINTMENTS } = await import('@/lib/demo-data');

          console.log('[Demo Mode] useAppointment: Using mock data, NO API calls');

          const appointment = DEMO_APPOINTMENTS.find((a: any) => a.id === id);
          if (!appointment) {
            throw new Error('Appointment not found');
          }

          return appointment as AdvisorAppointment;
        }
      }

      const response = await fetch(`/api/advisors/appointments/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointment');
      }

      const data = await response.json();
      return data.data as AdvisorAppointment;
    },
    enabled: !!id,
  });
};

// Create new appointment
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useCreateAppointment: No-op, NO API calls');
          return {} as AdvisorAppointment;
        }
      }

      const response = await fetch('/api/advisors/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create appointment');
      }

      const result = await response.json();
      return result.data as AdvisorAppointment;
    },
    onSuccess: () => {
      // Invalidate appointments list to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

// Update appointment
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAppointmentData }) => {
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useUpdateAppointment: No-op, NO API calls');
          return {} as AdvisorAppointment;
        }
      }

      const response = await fetch(`/api/advisors/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update appointment');
      }

      const result = await response.json();
      return result.data as AdvisorAppointment;
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific appointment
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
    },
  });
};

// Delete/Cancel appointment
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // DEMO MODE: No-op, NO API CALLS
      if (typeof window !== 'undefined') {
        const { isDemoMode } = await import('@/lib/demo-mode');
        if (isDemoMode()) {
          console.log('[Demo Mode] useDeleteAppointment: No-op, NO API calls');
          return { success: true };
        }
      }

      const response = await fetch(`/api/advisors/appointments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete appointment');
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate appointments list to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
