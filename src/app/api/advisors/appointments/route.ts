import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// GET /api/advisors/appointments - Get user's appointments
export async function GET(_request: Request) {
  try {
    const supabase = await createClient();

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

      // Join appointments with advisor data
      const appointmentsWithAdvisors = appointments.map(apt => ({
        ...apt,
        advisor: advisors.find(adv => adv.id === apt.advisor_id)
      }));

      return NextResponse.json({ data: appointmentsWithAdvisors });
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

    // Fetch appointments with advisor details
    const { data: appointments, error } = await supabase
      .from('advisor_appointments')
      .select(`
        *,
        advisor:advisors(*)
      `)
      .eq('student_id', userData.id)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: appointments || [] });

  } catch (error: any) {
    console.error('Error in appointments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/advisors/appointments - Create new appointment
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

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
        advisor_id,
        appointment_date,
        duration_minutes = 30,
        meeting_type,
        meeting_link,
        topic,
        notes,
      } = body;

      // Validate required fields
      if (!advisor_id || !appointment_date || !meeting_type) {
        return NextResponse.json(
          { error: 'Advisor ID, appointment date, and meeting type are required' },
          { status: 400 }
        );
      }

      // Return mock appointment
      const mockAppointment = {
        id: Date.now(),
        student_id: -1,
        advisor_id,
        appointment_date,
        duration_minutes,
        meeting_type,
        meeting_link: meeting_link || null,
        topic: topic || null,
        notes: notes || null,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json({ data: mockAppointment }, { status: 201 });
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
      advisor_id,
      appointment_date,
      duration_minutes = 30,
      meeting_type,
      meeting_link,
      topic,
      notes,
    } = body;

    // Validate required fields
    if (!advisor_id || !appointment_date || !meeting_type) {
      return NextResponse.json(
        { error: 'Advisor ID, appointment date, and meeting type are required' },
        { status: 400 }
      );
    }

    // Verify advisor exists and is active
    const { data: advisor, error: advError } = await supabase
      .from('advisors')
      .select('id, is_active')
      .eq('id', advisor_id)
      .single();

    if (advError || !advisor || !advisor.is_active) {
      return NextResponse.json(
        { error: 'Advisor not found or inactive' },
        { status: 404 }
      );
    }

    // Verify user has active connection with advisor
    const { data: connection, error: connError } = await supabase
      .from('student_advisor_connections')
      .select('id, status')
      .eq('student_id', userData.id)
      .eq('advisor_id', advisor_id)
      .eq('status', 'active')
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'You must have an active connection with this advisor to book appointments' },
        { status: 403 }
      );
    }

    // Create appointment
    const appointmentData: any = {
      student_id: userData.id,
      advisor_id,
      appointment_date,
      duration_minutes,
      meeting_type,
      meeting_link: meeting_link || null,
      topic: topic || null,
      notes: notes || null,
      status: 'scheduled',
    };

    const { data: appointment, error } = await supabase
      .from('advisor_appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: appointment }, { status: 201 });

  } catch (error: any) {
    console.error('Error in create appointment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
