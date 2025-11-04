/**
 * Notification System Type Definitions
 * GT Course Planner - Smart Notifications
 */

// =====================================================
// CORE NOTIFICATION TYPES
// =====================================================

export type NotificationType =
  | 'deadline'      // Academic deadline reminders
  | 'requirement'   // Degree requirement progress alerts
  | 'course'        // Course-related updates
  | 'gpa'           // GPA alerts and warnings
  | 'advisor'       // Advisor-related notifications
  | 'system';       // System announcements

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  priority: NotificationPriority;
  read: boolean;
  created_at: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

export interface NotificationPreferences {
  id: string;
  user_id: number;

  // Notification type toggles
  deadline_reminders: boolean;
  requirement_alerts: boolean;
  course_updates: boolean;
  gpa_alerts: boolean;
  advisor_notifications: boolean;
  system_notifications: boolean;

  // Delivery preferences
  email_notifications: boolean;
  email_digest_frequency: 'none' | 'daily' | 'weekly';

  // Timing preferences
  deadline_reminder_days: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  priority?: NotificationPriority;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  read?: boolean;
}

export interface UpdatePreferencesRequest {
  deadline_reminders?: boolean;
  requirement_alerts?: boolean;
  course_updates?: boolean;
  gpa_alerts?: boolean;
  advisor_notifications?: boolean;
  system_notifications?: boolean;
  email_notifications?: boolean;
  email_digest_frequency?: 'none' | 'daily' | 'weekly';
  deadline_reminder_days?: number;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

// =====================================================
// NOTIFICATION CREATION HELPERS
// =====================================================

export interface DeadlineNotificationData {
  deadline: {
    id: string;
    title: string;
    due_date: string;
    type?: string;
  };
  daysUntil: number;
}

export interface RequirementNotificationData {
  requirement: {
    category: string;
    name: string;
    progress: number;
  };
  isComplete: boolean;
}

export interface CourseNotificationData {
  course: {
    id: string;
    code: string;
    title: string;
  };
  action: 'added' | 'completed' | 'removed' | 'prerequisite_met';
}

export interface GpaNotificationData {
  gpa: number;
  trend: 'up' | 'down' | 'stable';
  threshold?: number;
}

export interface AdvisorNotificationData {
  advisor: {
    id: string;
    name: string;
  };
  action: 'appointment_scheduled' | 'appointment_reminder' | 'message_received';
  appointment?: {
    id: string;
    date: string;
  };
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  updatePreferences: (updates: UpdatePreferencesRequest) => Promise<void>;
}

// =====================================================
// COMPONENT PROP TYPES
// =====================================================

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export interface NotificationIconProps {
  type: NotificationType;
  priority: NotificationPriority;
  className?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface NotificationTriggerConfig {
  enabled: boolean;
  checkInterval?: number; // in milliseconds
  batchSize?: number;
}

export interface NotificationFilter {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  startDate?: string;
  endDate?: string;
}
