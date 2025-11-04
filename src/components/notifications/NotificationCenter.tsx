/**
 * NotificationCenter Component
 * Dropdown panel for displaying and managing notifications
 */

'use client';

import React from 'react';
import { Bell, CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = React.useState(false);

  const hasNotifications = notifications.length > 0;
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notifications ${hasUnread ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-gray-600" />

          {/* Unread badge */}
          {hasUnread && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] max-h-[600px] overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <DropdownMenuLabel className="p-0 font-semibold text-base">
              Notifications
            </DropdownMenuLabel>
            {hasUnread && (
              <p className="text-xs text-gray-500 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>

          {/* Mark all as read button */}
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-2">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1 font-medium">
                Failed to load notifications
              </p>
              <p className="text-xs text-gray-500">
                Please try again later
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && !hasNotifications && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-gray-100 p-4 mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">
                No notifications yet
              </p>
              <p className="text-xs text-gray-500">
                We'll notify you when something important happens
              </p>
            </div>
          )}

          {/* Notifications list */}
          {!isLoading && !isError && hasNotifications && (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasNotifications && !isLoading && !isError && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page (if you create one)
                  // window.location.href = '/notifications';
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
