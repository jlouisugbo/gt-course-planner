/**
 * Create Notification API Route
 * POST: Create a new notification (server-side only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import type { CreateNotificationRequest } from '@/types';

/**
 * POST /api/notifications/create
 * Creates a new notification for a user
 *
 * This endpoint is intended for server-side notification creation
 * (e.g., from cron jobs, webhooks, or other server processes)
 *
 * Body: CreateNotificationRequest
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate the requesting user (for security)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Unauthorized notification creation attempt:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateNotificationRequest = await request.json();

    // Validate required fields
    if (!body.user_id || !body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title, message' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['deadline', 'requirement', 'course', 'gpa', 'advisor', 'system'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check if user is creating notification for themselves (most common case)
    // or if they have permission to create notifications for others
    const isSelfNotification = body.user_id === user.id;

    // For MVP, we'll allow users to create notifications for themselves
    // In production, you might want to restrict this to admin/system accounts
    if (!isSelfNotification) {
      // Check if user has admin privileges (you can implement this check)
      // For now, we'll allow it but log it
      console.warn(`User ${user.id} creating notification for different user ${body.user_id}`);
    }

    // Check user's notification preferences before creating
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', body.user_id)
      .single();

    // Check if this notification type is enabled for the user
    if (preferences) {
      const prefKey = `${body.type}_${body.type === 'deadline' ? 'reminders' :
                       body.type === 'requirement' ? 'alerts' :
                       body.type === 'course' ? 'updates' :
                       body.type === 'gpa' ? 'alerts' :
                       body.type === 'advisor' ? 'notifications' :
                       'notifications'}`;

      const typeEnabled = preferences[prefKey as keyof typeof preferences];
      if (typeEnabled === false) {
        return NextResponse.json(
          {
            success: false,
            message: 'Notification type disabled by user preferences',
            created: false
          },
          { status: 200 }
        );
      }
    }

    // Create the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: body.user_id,
        type: body.type,
        title: body.title,
        message: body.message,
        action_url: body.action_url || null,
        priority: body.priority || 'medium',
        expires_at: body.expires_at || null,
        metadata: body.metadata || {},
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: true,
      notification
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/create:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
