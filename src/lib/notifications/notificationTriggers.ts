/**
 * Notification Triggers
 * Client-side logic to trigger notifications based on app events
 */

'use client';

import { differenceInDays } from 'date-fns';
import {
  createDeadlineNotification,
  createRequirementNotification,
  createCourseNotification,
  createGpaNotification
} from './notificationService';

/**
 * Check deadlines and create notifications for upcoming ones
 * This should be called when the app loads or periodically
 */
export async function checkDeadlinesAndNotify(
  userId: string,
  deadlines: Array<{
    id: string;
    title: string;
    due_date: string;
    type?: string;
  }>
): Promise<void> {
  if (!userId || !deadlines.length) return;

  const now = new Date();
  const notificationPromises: Promise<boolean>[] = [];

  for (const deadline of deadlines) {
    const dueDate = new Date(deadline.due_date);
    const daysUntil = differenceInDays(dueDate, now);

    // Create notifications for deadlines within 7 days
    // Skip if already past (we'll handle overdue separately if needed)
    if (daysUntil >= 0 && daysUntil <= 7) {
      notificationPromises.push(
        createDeadlineNotification(userId, {
          deadline,
          daysUntil
        })
      );
    }

    // Also notify for overdue deadlines (up to 3 days past)
    if (daysUntil < 0 && daysUntil >= -3) {
      notificationPromises.push(
        createDeadlineNotification(userId, {
          deadline,
          daysUntil
        })
      );
    }
  }

  // Execute all notification creations in parallel
  if (notificationPromises.length > 0) {
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    console.log(`Created ${successCount} deadline notifications`);
  }
}

/**
 * Check requirement progress and notify on milestones
 */
export async function checkRequirementsAndNotify(
  userId: string,
  requirements: Array<{
    category: string;
    name: string;
    progress: number;
  }>
): Promise<void> {
  if (!userId || !requirements.length) return;

  const notificationPromises: Promise<boolean>[] = [];

  for (const requirement of requirements) {
    // Notify when requirement is completed (100%)
    if (requirement.progress >= 100) {
      notificationPromises.push(
        createRequirementNotification(userId, {
          requirement,
          isComplete: true
        })
      );
    }
    // Notify at progress milestones (50%, 75%)
    else if (requirement.progress === 50 || requirement.progress === 75) {
      notificationPromises.push(
        createRequirementNotification(userId, {
          requirement,
          isComplete: false
        })
      );
    }
  }

  if (notificationPromises.length > 0) {
    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    console.log(`Created ${successCount} requirement notifications`);
  }
}

/**
 * Notify when a course is completed
 * This should be called from the course completion handler
 */
export async function notifyOnCourseCompletion(
  userId: string,
  course: {
    id: string;
    code: string;
    title: string;
  }
): Promise<boolean> {
  if (!userId || !course) return false;

  return createCourseNotification(userId, {
    course,
    action: 'completed'
  });
}

/**
 * Notify when a course is added to the planner
 */
export async function notifyOnCourseAdded(
  userId: string,
  course: {
    id: string;
    code: string;
    title: string;
  }
): Promise<boolean> {
  if (!userId || !course) return false;

  return createCourseNotification(userId, {
    course,
    action: 'added'
  });
}

/**
 * Check GPA and notify if below threshold or trending
 */
export async function checkGpaAndNotify(
  userId: string,
  currentGpa: number,
  previousGpa?: number,
  threshold?: number
): Promise<void> {
  if (!userId || currentGpa === undefined) return;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (previousGpa !== undefined) {
    if (currentGpa > previousGpa + 0.05) {
      trend = 'up';
    } else if (currentGpa < previousGpa - 0.05) {
      trend = 'down';
    }
  }

  // Only notify on significant changes or threshold breaches
  const shouldNotify =
    (threshold && currentGpa < threshold) ||
    trend !== 'stable';

  if (shouldNotify) {
    await createGpaNotification(userId, {
      gpa: currentGpa,
      trend,
      threshold
    });
  }
}

/**
 * Initialize notification triggers when app loads
 * This function should be called once when the user logs in or app initializes
 */
export async function initializeNotificationTriggers(
  userId: string,
  data: {
    deadlines?: Array<{
      id: string;
      title: string;
      due_date: string;
      type?: string;
    }>;
    requirements?: Array<{
      category: string;
      name: string;
      progress: number;
    }>;
    gpa?: number;
    previousGpa?: number;
  }
): Promise<void> {
  if (!userId) return;

  console.log('Initializing notification triggers for user:', userId);

  const promises: Promise<void>[] = [];

  // Check deadlines
  if (data.deadlines) {
    promises.push(checkDeadlinesAndNotify(userId, data.deadlines));
  }

  // Check requirements
  if (data.requirements) {
    promises.push(checkRequirementsAndNotify(userId, data.requirements));
  }

  // Check GPA
  if (data.gpa !== undefined) {
    promises.push(checkGpaAndNotify(userId, data.gpa, data.previousGpa, 2.0)); // 2.0 GPA threshold
  }

  await Promise.allSettled(promises);
  console.log('Notification triggers initialized');
}

/**
 * Debounce helper to prevent duplicate notifications
 */
const notificationDebounce = new Map<string, number>();

export function shouldCreateNotification(key: string, debounceMs: number = 60000): boolean {
  const lastCreated = notificationDebounce.get(key);
  const now = Date.now();

  if (lastCreated && now - lastCreated < debounceMs) {
    return false; // Skip, too soon
  }

  notificationDebounce.set(key, now);
  return true;
}
