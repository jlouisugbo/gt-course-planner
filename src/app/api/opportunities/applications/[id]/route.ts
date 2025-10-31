import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/opportunities/applications/[id] - Get specific application
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
      const { getDemoApplications, getDemoOpportunities } = await import('@/lib/demo-data');
      const applications = getDemoApplications();
      const opportunities = getDemoOpportunities();

      const application = applications.find(app => app.id === parseInt(id));
      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      const applicationWithOpportunity = {
        ...application,
        opportunity: opportunities.find(opp => opp.id === application.opportunity_id)
      };

      return NextResponse.json({ data: applicationWithOpportunity });
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

    // Fetch application (RLS ensures user can only see their own)
    const { data: application, error } = await supabase
      .from('user_opportunity_applications')
      .select(`
        *,
        opportunity:opportunities(*)
      `)
      .eq('id', id)
      .eq('user_id', userData.id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: application });

  } catch (error: any) {
    console.error('Error in get application API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/opportunities/applications/[id] - Update application
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
      const { cover_letter, application_answers, status } = body;

      // Return mock updated application
      const mockUpdated: any = {
        id: parseInt(id),
        user_id: -1,
        updated_at: new Date().toISOString()
      };

      if (cover_letter !== undefined) mockUpdated.cover_letter = cover_letter;
      if (application_answers !== undefined) mockUpdated.application_answers = application_answers;
      if (status !== undefined) {
        mockUpdated.status = status;
        if (status === 'submitted') {
          mockUpdated.submitted_at = new Date().toISOString();
        }
      }

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
    const { cover_letter, application_answers, status } = body;

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (cover_letter !== undefined) updateData.cover_letter = cover_letter;
    if (application_answers !== undefined) updateData.application_answers = application_answers;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'submitted' && !updateData.submitted_at) {
        updateData.submitted_at = new Date().toISOString();
      }
    }

    // Update application (RLS ensures user can only update their own)
    const { data: application, error } = await supabase
      .from('user_opportunity_applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userData.id)
      .select()
      .single();

    if (error || !application) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: application });

  } catch (error: any) {
    console.error('Error in update application API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/applications/[id] - Delete application
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

    // Delete application (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('user_opportunity_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.id);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in delete application API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
