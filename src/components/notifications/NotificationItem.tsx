/**
 * NotificationItem Component
 * Individual notification display with actions
 */

'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  BookOpen,
  TrendingUp,
  User,
  Info,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType, NotificationPriority } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

/**
 * Get icon component based on notification type
 */
function getNotificationIcon(type: NotificationType, priority: NotificationPriority) {
  const iconClass = cn(
    'h-5 w-5 shrink-0',
    priority === 'high' ? 'text-red-500' :
    priority === 'medium' ? 'text-yellow-500' :
    'text-blue-500'
  );

  switch (type) {
    case 'deadline':
      return <AlertCircle className={iconClass} />;
    case 'requirement':
      return <CheckCircle className={iconClass} />;
    case 'course':
      return <BookOpen className={iconClass} />;
    case 'gpa':
      return <TrendingUp className={iconClass} />;
    case 'advisor':
      return <User className={iconClass} />;
    case 'system':
      return <Info className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
}

/**
 * Get background color based on priority
 */
function getPriorityStyles(priority: NotificationPriority, read: boolean) {
  if (read) {
    return 'bg-gray-50 hover:bg-gray-100';
  }

  switch (priority) {
    case 'high':
      return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
    case 'medium':
      return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500';
    case 'low':
      return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500';
    default:
      return 'bg-white hover:bg-gray-50';
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate if action_url is provided
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    // Call custom onClick handler
    onClick?.(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the notification click
    onDelete(notification.id);
  };

  return (
    <div
      className={cn(
        'relative p-4 cursor-pointer transition-all duration-200 rounded-lg mb-2',
        getPriorityStyles(notification.priority, notification.read),
        !notification.read && 'shadow-sm'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className={cn(
              'text-sm font-semibold mb-1',
              notification.read ? 'text-gray-700' : 'text-gray-900'
            )}
          >
            {notification.title}
          </h4>

          {/* Message */}
          <p
            className={cn(
              'text-sm mb-2 line-clamp-2',
              notification.read ? 'text-gray-500' : 'text-gray-700'
            )}
          >
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{timeAgo}</span>

            {/* Unread indicator */}
            {!notification.read && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                New
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-1 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Delete notification"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
}
