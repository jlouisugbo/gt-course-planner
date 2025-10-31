import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/advisors/appointments/[id] - Get specific appointment
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Demo mode check
    if (user.id === 'demo-user-auth-id') {
      const { getDemoAppointments, getDemoAdvisors } = await import('@/lib/demo-data');
      const appointments = getDemoAppointments();
      const advisors = getDemoAdvisors();

      const appointment = appointments.find(apt => apt.id === parseInt(id));
      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      const appointmentWithAdvisor = {
        ...appointment,
        advisor: advisors.find(adv => adv.id === appointment.advisor_id)
      };

      return NextResponse.json({ data: appointmentWithAdvisor });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch appointment (RLS ensures user can only see their own)
    const { data: appointment, error } = await supabase
      .from('advisor_appointments')
      .select(`
        *,
        advisor:advisors(*)
      `)
      .eq('id', id)
      .eq('student_id', userData.id)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment });

  } catch (error: any) {
    console.error('Error in get appointment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/advisors/appointments/[id] - Update appointment
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Demo mode check
    if (user.id === 'demo-user-auth-id') {
      const body = await request.json();
      const {
        appointment_date,
        duration_minutes,
        meeting_type,
        meeting_link,
        topic,
        notes,
        status,
      } = body;

      // Return mock updated appointment
      const mockUpdated: any = {
        id: parseInt(id),
        student_id: -1,
        updated_at: new Date().toISOString()
      };

      if (appointment_date !== undefined) mockUpdated.appointment_date = appointment_date;
      if (duration_minutes !== undefined) mockUpdated.duration_minutes = duration_minutes;
      if (meeting_type !== undefined) mockUpdated.meeting_type = meeting_type;
      if (meeting_link !== undefined) mockUpdated.meeting_link = meeting_link;
      if (topic !== undefined) mockUpdated.topic = topic;
      if (notes !== undefined) mockUpdated.notes = notes;
      if (status !== undefined) mockUpdated.status = status;

      return NextResponse.json({ data: mockUpdated });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      appointment_date,
      duration_minutes,
      meeting_type,
      meeting_link,
      topic,
      notes,
      status,
    } = body;

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (appointment_date !== undefined) updateData.appointment_date = appointment_date;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (meeting_type !== undefined) updateData.meeting_type = meeting_type;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (topic !== undefined) updateData.topic = topic;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update appointment (RLS ensures user can only update their own)
    const { data: appointment, error } = await supabase
      .from('advisor_appointments')
      .update(updateData)
      .eq('id', id)
      .eq('student_id', userData.id)
      .select()
      .single();

    if (error || !appointment) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: appointment });

  } catch (error: any) {
    console.error('Error in update appointment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/advisors/appointments/[id] - Delete/Cancel appointment
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Demo mode check
    if (user.id === 'demo-user-auth-id') {
      // Return success without actually deleting
      return NextResponse.json({ success: true });
    }

    // Get user's database ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete appointment (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('advisor_appointments')
      .delete()
      .eq('id', id)
      .eq('student_id', userData.id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in delete appointment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
