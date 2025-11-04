/**
 * Mark All Notifications As Read API Route
 * POST: Mark all user's notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/**
 * POST /api/notifications/mark-all-read
 * Marks all unread notifications as read for the authenticated user
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Unauthorized mark-all-read attempt:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update all unread notifications for this user
    const { error, count } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .select();

    if (error) {
      console.error('Database error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: count || 0,
      message: `Marked ${count || 0} notifications as read`
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/notifications/mark-all-read:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
