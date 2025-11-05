import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
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
      const params: Record<string, unknown> = {};
      if (filters?.specialization) params.specialization = filters.specialization;
      if (filters?.department) params.department = filters.department;
      if (filters?.acceptingStudents !== undefined) params.acceptingStudents = filters.acceptingStudents;
      const data = await api.advisors.list(params);
      return (data?.data ?? data ?? []) as Advisor[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get specific advisor
export const useAdvisor = (id: number) => {
  return useQuery({
    queryKey: ['advisor', id],
    queryFn: async () => {
      const data = await api.advisors.get(id);
      return (data?.data ?? data) as Advisor;
    },
    enabled: !!id,
  });
};

// Fetch user's advisor connections
export const useMyAdvisors = () => {
  return useQuery({
    queryKey: ['my-advisors'],
    queryFn: async () => {
      const data = await api.advisors.connections.list();
      return (data?.data ?? data ?? []) as AdvisorConnection[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create advisor connection request
export const useCreateConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      const result = await api.advisors.connections.create(data);
      return (result?.data ?? result) as AdvisorConnection;
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
      const data = await api.advisors.appointments.list();
      return (data?.data ?? data ?? []) as AdvisorAppointment[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get specific appointment
export const useAppointment = (id: number) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const data = await api.advisors.appointments.get(id);
      return (data?.data ?? data) as AdvisorAppointment;
    },
    enabled: !!id,
  });
};

// Create new appointment
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const result = await api.advisors.appointments.create(data);
      return (result?.data ?? result) as AdvisorAppointment;
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
      const result = await api.advisors.appointments.update(id, data);
      return (result?.data ?? result) as AdvisorAppointment;
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
      await api.advisors.appointments.delete(id);
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate appointments list to refetch
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
