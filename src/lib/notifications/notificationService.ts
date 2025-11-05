/**
 * Notification Service
 * Helper functions for creating notifications programmatically
 */

import type {
  CreateNotificationRequest,
  DeadlineNotificationData,
  RequirementNotificationData,
  CourseNotificationData,
  GpaNotificationData,
  AdvisorNotificationData,
  NotificationPriority
} from '@/types';

/**
 * Base function to create a notification via API
 */
async function createNotification(request: CreateNotificationRequest): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create notification' }));
      console.error('Failed to create notification:', error);
      return false;
    }

    const result = await response.json();
    return result.created === true;

  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Create a deadline reminder notification
 */
export async function createDeadlineNotification(
  userId: string,
  data: DeadlineNotificationData
): Promise<boolean> {
  const { deadline, daysUntil } = data;

  // Determine priority based on days until deadline
  let priority: NotificationPriority = 'low';
  if (daysUntil <= 1) {
    priority = 'high';
  } else if (daysUntil <= 3) {
    priority = 'medium';
  }

  // Format message
  let message = `${deadline.title} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
  if (daysUntil === 0) {
    message = `${deadline.title} is due today!`;
  } else if (daysUntil < 0) {
    message = `${deadline.title} was due ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`;
    priority = 'high';
  }

  // Calculate expiration (deadline + 1 day)
  const expiresAt = new Date(deadline.due_date);
  expiresAt.setDate(expiresAt.getDate() + 1);

  return createNotification({
    user_id: userId,
    type: 'deadline',
    title: `Deadline Reminder: ${deadline.title}`,
    message,
    action_url: '/dashboard', // Link to dashboard where deadlines are shown
    priority,
    expires_at: expiresAt.toISOString(),
    metadata: {
      deadline_id: deadline.id,
      deadline_type: deadline.type,
      days_until: daysUntil
    }
  });
}

/**
 * Create a requirement completion notification
 */
export async function createRequirementNotification(
  userId: string,
  data: RequirementNotificationData
): Promise<boolean> {
  const { requirement, isComplete } = data;

  const message = isComplete
    ? `Congratulations! You've completed the ${requirement.name} requirement.`
    : `You've made progress on ${requirement.name} (${Math.round(requirement.progress)}% complete)`;

  return createNotification({
    user_id: userId,
    type: 'requirement',
    title: isComplete ? 'Requirement Completed!' : 'Requirement Progress',
    message,
    action_url: '/requirements',
    priority: isComplete ? 'medium' : 'low',
    metadata: {
      requirement_category: requirement.category,
      requirement_name: requirement.name,
      progress: requirement.progress,
      is_complete: isComplete
    }
  });
}

/**
 * Create a course-related notification
 */
export async function createCourseNotification(
  userId: string,
  data: CourseNotificationData
): Promise<boolean> {
  const { course, action } = data;

  let title = '';
  let message = '';
  let actionUrl = '/planner';

  switch (action) {
    case 'added':
      title = 'Course Added';
      message = `${course.code} - ${course.title} has been added to your plan`;
      break;
    case 'completed':
      title = 'Course Completed!';
      message = `Congratulations on completing ${course.code} - ${course.title}`;
      actionUrl = '/record';
      break;
    case 'removed':
      title = 'Course Removed';
      message = `${course.code} - ${course.title} has been removed from your plan`;
      break;
    case 'prerequisite_met':
      title = 'Prerequisites Met!';
      message = `You can now take ${course.code} - ${course.title}`;
      actionUrl = '/courses';
      break;
  }

  return createNotification({
    user_id: userId,
    type: 'course',
    title,
    message,
    action_url: actionUrl,
    priority: action === 'completed' ? 'medium' : 'low',
    metadata: {
      course_id: course.id,
      course_code: course.code,
      action
    }
  });
}

/**
 * Create a GPA alert notification
 */
export async function createGpaNotification(
  userId: string,
  data: GpaNotificationData
): Promise<boolean> {
  const { gpa, trend, threshold } = data;

  let title = 'GPA Update';
  let message = `Your current GPA is ${gpa.toFixed(2)}`;
  let priority: NotificationPriority = 'low';

  if (threshold && gpa < threshold) {
    title = 'GPA Alert';
    message = `Your GPA (${gpa.toFixed(2)}) is below the ${threshold.toFixed(2)} threshold`;
    priority = 'high';
  } else if (trend === 'up') {
    title = 'GPA Improvement!';
    message = `Great job! Your GPA improved to ${gpa.toFixed(2)}`;
    priority = 'medium';
  } else if (trend === 'down') {
    title = 'GPA Decline';
    message = `Your GPA decreased to ${gpa.toFixed(2)}. Consider meeting with an advisor.`;
    priority = 'medium';
  }

  return createNotification({
    user_id: userId,
    type: 'gpa',
    title,
    message,
    action_url: '/dashboard',
    priority,
    metadata: {
      gpa,
      trend,
      threshold
    }
  });
}

/**
 * Create an advisor-related notification
 */
export async function createAdvisorNotification(
  userId: string,
  data: AdvisorNotificationData
): Promise<boolean> {
  const { advisor, action, appointment } = data;

  let title = '';
  let message = '';
  let priority: NotificationPriority = 'low';
  const actionUrl = '/advisors';

  switch (action) {
    case 'appointment_scheduled':
      title = 'Appointment Scheduled';
      message = `Your appointment with ${advisor.name} has been scheduled`;
      priority = 'medium';
      break;
    case 'appointment_reminder':
      title = 'Appointment Reminder';
      message = `You have an upcoming appointment with ${advisor.name}`;
      priority = 'high';
      if (appointment) {
        const appointmentDate = new Date(appointment.date);
        const daysUntil = Math.ceil((appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntil === 0) {
          message = `Your appointment with ${advisor.name} is today!`;
        } else if (daysUntil === 1) {
          message = `Your appointment with ${advisor.name} is tomorrow`;
        } else {
          message = `Your appointment with ${advisor.name} is in ${daysUntil} days`;
        }
      }
      break;
    case 'message_received':
      title = 'New Message from Advisor';
      message = `${advisor.name} sent you a message`;
      priority = 'medium';
      break;
  }

  return createNotification({
    user_id: userId,
    type: 'advisor',
    title,
    message,
    action_url: actionUrl,
    priority,
    metadata: {
      advisor_id: advisor.id,
      advisor_name: advisor.name,
      action,
      appointment_id: appointment?.id
    }
  });
}

/**
 * Create a system notification (announcements, updates, etc.)
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  options?: {
    priority?: NotificationPriority;
    actionUrl?: string;
    expiresAt?: string;
  }
): Promise<boolean> {
  return createNotification({
    user_id: userId,
    type: 'system',
    title,
    message,
    action_url: options?.actionUrl,
    priority: options?.priority || 'low',
    expires_at: options?.expiresAt,
    metadata: {
      is_system_notification: true
    }
  });
}

/**
 * Batch create notifications (useful for scheduled jobs)
 */
export async function createNotifications(
  requests: CreateNotificationRequest[]
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    requests.map(req => createNotification(req))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;

  return { success, failed };
}
