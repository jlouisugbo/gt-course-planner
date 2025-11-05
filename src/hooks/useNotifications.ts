/**
 * useNotifications Hook
 * React Query hook for managing user notifications
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  NotificationsResponse,
  UseNotificationsReturn
} from '@/types';
import { handleError } from '@/lib/errorHandlingUtils';

const NOTIFICATIONS_QUERY_KEY = ['notifications'];
const REFETCH_INTERVAL = 30000; // 30 seconds

/**
 * Fetch notifications from API
 */
async function fetchNotifications(): Promise<NotificationsResponse> {
  // DEMO MODE: Return mock data immediately, NO API CALLS
  if (typeof window !== 'undefined') {
    const { isDemoMode } = await import('@/lib/demo-mode');
    if (isDemoMode()) {
      const { DEMO_NOTIFICATIONS } = await import('@/lib/demo-data');

      console.log('[Demo Mode] fetchNotifications: Using mock data, NO API calls');

      return {
        notifications: DEMO_NOTIFICATIONS as any[],
        unreadCount: DEMO_NOTIFICATIONS.filter((n: any) => !n.read).length,
        total: DEMO_NOTIFICATIONS.length,
      };
    }
  }

  const response = await fetch('/api/notifications?limit=50', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch notifications' }));
    throw new Error(error.error || 'Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Mark a single notification as read
 */
async function markNotificationAsRead(notificationId: string): Promise<void> {
  // DEMO MODE: No-op, NO API CALLS
  if (typeof window !== 'undefined') {
    const { isDemoMode } = await import('@/lib/demo-mode');
    if (isDemoMode()) {
      console.log('[Demo Mode] markNotificationAsRead: No-op, NO API calls');
      return;
    }
  }

  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id: notificationId, read: true }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark notification as read' }));
    throw new Error(error.error || 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead(): Promise<void> {
  // DEMO MODE: No-op, NO API CALLS
  if (typeof window !== 'undefined') {
    const { isDemoMode } = await import('@/lib/demo-mode');
    if (isDemoMode()) {
      console.log('[Demo Mode] markAllNotificationsAsRead: No-op, NO API calls');
      return;
    }
  }

  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark all notifications as read' }));
    throw new Error(error.error || 'Failed to mark all notifications as read');
  }
}

/**
 * Delete a notification
 */
async function deleteNotificationApi(notificationId: string): Promise<void> {
  // DEMO MODE: No-op, NO API CALLS
  if (typeof window !== 'undefined') {
    const { isDemoMode } = await import('@/lib/demo-mode');
    if (isDemoMode()) {
      console.log('[Demo Mode] deleteNotificationApi: No-op, NO API calls');
      return;
    }
  }

  const response = await fetch(`/api/notifications?id=${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete notification' }));
    throw new Error(error.error || 'Failed to delete notification');
  }
}

/**
 * Main hook for notifications
 */
export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();

  // Fetch notifications with automatic refetching
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<NotificationsResponse, Error>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    refetchInterval: REFETCH_INTERVAL, // Poll every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication')) {
        return false;
      }
      return failureCount < 3;
    },
    meta: {
      onError: (error: Error) => {
        handleError(error, {
          context: 'useNotifications',
          showToast: false, // Don't show toast for background polling failures
          logToConsole: true
        });
      }
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY, {
          ...previousData,
          notifications: previousData.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1)
        });
      }

      return { previousData };
    },
    onError: (error, notificationId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
      }
      handleError(error, {
        context: 'markAsRead',
        showToast: true,
        userMessage: 'Failed to mark notification as read'
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      const previousData = queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY);

      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY, {
          ...previousData,
          notifications: previousData.notifications.map(notif => ({ ...notif, read: true })),
          unreadCount: 0
        });
      }

      return { previousData };
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
      }
      handleError(error, {
        context: 'markAllAsRead',
        showToast: true,
        userMessage: 'Failed to mark all notifications as read'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationApi,
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      const previousData = queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY);

      if (previousData) {
        const deletedNotif = previousData.notifications.find(n => n.id === notificationId);
        const wasUnread = deletedNotif && !deletedNotif.read;

        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_QUERY_KEY, {
          ...previousData,
          notifications: previousData.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, previousData.unreadCount - 1) : previousData.unreadCount,
          total: Math.max(0, previousData.total - 1)
        });
      }

      return { previousData };
    },
    onError: (error, notificationId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
      }
      handleError(error, {
        context: 'deleteNotification',
        showToast: true,
        userMessage: 'Failed to delete notification'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    }
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError,
    error: error || null,
    markAsRead: async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    },
    markAllAsRead: async () => {
      await markAllAsReadMutation.mutateAsync();
    },
    deleteNotification: async (notificationId: string) => {
      await deleteNotificationMutation.mutateAsync(notificationId);
    },
    refetch: async () => {
      await refetch();
    }
  };
}
