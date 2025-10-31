import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/advisors/[id] - Get specific advisor details
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
      const { getDemoAdvisors } = await import('@/lib/demo-data');
      const advisors = getDemoAdvisors();

      const advisor = advisors.find(adv => adv.id === parseInt(id));
      if (!advisor) {
        return NextResponse.json(
          { error: 'Advisor not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: advisor });
    }

    // Fetch advisor
    const { data: advisor, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: advisor });

  } catch (error: any) {
    console.error('Error in get advisor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
