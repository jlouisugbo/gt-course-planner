/**
 * Notifications API Routes
 * GET: Fetch user's notifications
 * PATCH: Mark notification as read
 * DELETE: Delete notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import type { Notification, NotificationsResponse } from '@/types';

/**
 * GET /api/notifications
 * Fetches user's notifications with pagination
 *
 * Query params:
 * - limit: number of notifications to fetch (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * - unreadOnly: boolean to fetch only unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Unauthorized access to notifications:', authError);
      return NextResponse.json(
        { error: 'Authentication required to access notifications' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter for unread only if specified
    if (unreadOnly) {
      query = query.eq('read', false);
    }

    // Execute query with RLS policies (user can only see their own notifications)
    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Database error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count separately
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (countError) {
      console.error('Error fetching unread count:', countError);
      // Don't fail the request, just log and return 0
    }

    const response: NotificationsResponse = {
      notifications: notifications as Notification[] || [],
      unreadCount: unreadCount || 0,
      total: count || 0
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification as read or update its properties
 *
 * Body: { id: string, read?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Unauthorized update attempt:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, read } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Partial<Notification> = {};
    if (typeof read === 'boolean') {
      updates.read = read;
    }

    // Update notification (RLS policy ensures user can only update their own)
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Database error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification: data });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete a notification
 *
 * Query params: id (notification ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Unauthorized delete attempt:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get notification ID from query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Delete notification (RLS policy ensures user can only delete their own)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Extra safety check

    if (error) {
      console.error('Database error deleting notification:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
