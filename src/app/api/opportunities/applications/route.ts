 
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// GET /api/opportunities/applications - Get user's applications
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
      const { getDemoApplications, getDemoOpportunities } = await import('@/lib/demo-data');
      const applications = getDemoApplications();
      const opportunities = getDemoOpportunities();

      // Join applications with opportunities (same as production)
      const applicationsWithOpportunities = applications.map(app => ({
        ...app,
        opportunity: opportunities.find(opp => opp.id === app.opportunity_id)
      }));

      return NextResponse.json({ data: applicationsWithOpportunities });
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

    // Fetch applications with opportunity details
    const { data: applications, error } = await supabase
      .from('user_opportunity_applications')
      .select(`
        *,
        opportunity:opportunities(*)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: applications || [] });

  } catch (error: any) {
    console.error('Error in applications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/opportunities/applications - Create new application
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
      const { opportunity_id, cover_letter, application_answers, status = 'draft' } = body;

      // Validate required fields
      if (!opportunity_id) {
        return NextResponse.json(
          { error: 'Opportunity ID is required' },
          { status: 400 }
        );
      }

      // Return mock created application
      const mockApplication = {
        id: Date.now(),
        user_id: -1,
        opportunity_id,
        status,
        cover_letter: cover_letter || null,
        resume_url: null,
        application_answers: application_answers || null,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json({ data: mockApplication }, { status: 201 });
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
    const { opportunity_id, cover_letter, application_answers, status = 'draft' } = body;

    // Validate required fields
    if (!opportunity_id) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Verify opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id, is_active')
      .eq('id', opportunity_id)
      .single();

    if (oppError || !opportunity || !opportunity.is_active) {
      return NextResponse.json(
        { error: 'Opportunity not found or inactive' },
        { status: 404 }
      );
    }

    // Create application
    const applicationData: any = {
      user_id: userData.id,
      opportunity_id,
      status,
      cover_letter: cover_letter || null,
      application_answers: application_answers || null,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    };

    const { data: application, error } = await supabase
      .from('user_opportunity_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      // Handle duplicate application error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already applied to this opportunity' },
          { status: 409 }
        );
      }
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: application }, { status: 201 });

  } catch (error: any) {
    console.error('Error in create application API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
