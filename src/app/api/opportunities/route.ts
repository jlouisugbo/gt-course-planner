import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities
 * Fetch all active opportunities
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Demo mode check
    if (user.id === 'demo-user-auth-id') {
      const { getDemoOpportunities } = await import('@/lib/demo-data');
      let opportunities = getDemoOpportunities();

      // Apply same filters as production
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');

      if (type && type !== 'all') {
        opportunities = opportunities.filter(opp => opp.opportunity_type === type);
      }

      return NextResponse.json(opportunities);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .order('application_deadline', { ascending: true });

    // Filter by type if provided
    if (type && type !== 'all') {
      query = query.eq('opportunity_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching opportunities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
