/**
 * Notifications Library Barrel Export
 */

export {
  createDeadlineNotification,
  createRequirementNotification,
  createCourseNotification,
  createGpaNotification,
  createAdvisorNotification,
  createSystemNotification,
  createNotifications
} from './notificationService';

export {
  checkDeadlinesAndNotify,
  checkRequirementsAndNotify,
  notifyOnCourseCompletion,
  notifyOnCourseAdded,
  checkGpaAndNotify,
  initializeNotificationTriggers,
  shouldCreateNotification
} from './notificationTriggers';
