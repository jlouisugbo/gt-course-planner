import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// GET /api/advisors/connections - Get user's advisor connections
export async function GET(request: Request) {
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
      const { getDemoConnections, getDemoAdvisors } = await import('@/lib/demo-data');
      const connections = getDemoConnections();
      const advisors = getDemoAdvisors();

      // Join connections with advisor data
      const connectionsWithAdvisors = connections.map(conn => ({
        ...conn,
        advisor: advisors.find(adv => adv.id === conn.advisor_id)
      }));

      return NextResponse.json({ data: connectionsWithAdvisors });
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

    // Fetch connections with advisor details
    const { data: connections, error } = await supabase
      .from('student_advisor_connections')
      .select(`
        *,
        advisor:advisors(*)
      `)
      .eq('student_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: connections || [] });

  } catch (error: any) {
    console.error('Error in connections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/advisors/connections - Create new connection request
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
      const { advisor_id, connection_type = 'requested', notes } = body;

      // Validate required fields
      if (!advisor_id) {
        return NextResponse.json(
          { error: 'Advisor ID is required' },
          { status: 400 }
        );
      }

      // Return mock connection
      const mockConnection = {
        id: Date.now(),
        student_id: -1,
        advisor_id,
        connection_type,
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json({ data: mockConnection }, { status: 201 });
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
    const { advisor_id, connection_type = 'requested', notes } = body;

    // Validate required fields
    if (!advisor_id) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      );
    }

    // Verify advisor exists and is accepting students
    const { data: advisor, error: advError } = await supabase
      .from('advisors')
      .select('id, is_active, is_accepting_students')
      .eq('id', advisor_id)
      .single();

    if (advError || !advisor || !advisor.is_active) {
      return NextResponse.json(
        { error: 'Advisor not found or inactive' },
        { status: 404 }
      );
    }

    if (!advisor.is_accepting_students) {
      return NextResponse.json(
        { error: 'Advisor is not currently accepting students' },
        { status: 400 }
      );
    }

    // Create connection
    const connectionData: any = {
      student_id: userData.id,
      advisor_id,
      connection_type,
      status: 'pending',
      notes: notes || null,
    };

    const { data: connection, error } = await supabase
      .from('student_advisor_connections')
      .insert(connectionData)
      .select()
      .single();

    if (error) {
      // Handle duplicate connection error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You already have a connection with this advisor' },
          { status: 409 }
        );
      }
      console.error('Error creating connection:', error);
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: connection }, { status: 201 });

  } catch (error: any) {
    console.error('Error in create connection API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
