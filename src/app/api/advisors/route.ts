 
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// GET /api/advisors - Fetch all active advisors with optional filters
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
      const { getDemoAdvisors } = await import('@/lib/demo-data');
      let advisors = getDemoAdvisors();

      // Apply filters (same as production)
      const { searchParams } = new URL(request.url);
      const specialization = searchParams.get('specialization');
      const department = searchParams.get('department');
      const acceptingStudents = searchParams.get('acceptingStudents');

      if (specialization) {
        advisors = advisors.filter((adv: any) =>
          adv.specializations.some((s: any) => String(s).toLowerCase().includes(specialization.toLowerCase()))
        );
      }

      if (department) {
        advisors = advisors.filter((adv: any) =>
          adv.departments.some((d: any) => String(d).toLowerCase().includes(department.toLowerCase()))
        );
      }

      if (acceptingStudents === 'true') {
        advisors = advisors.filter(adv => adv.is_accepting_students);
      }

      return NextResponse.json({ data: advisors });
    }

    // Get query parameters
    const url = new URL(request.url);
    const specialization = url.searchParams.get('specialization');
    const department = url.searchParams.get('department');
    const acceptingStudents = url.searchParams.get('acceptingStudents');

    // Build query
    let query = supabase
      .from('advisors')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    // Apply filters
    if (specialization) {
      query = query.contains('specializations', [specialization]);
    }

    if (department) {
      query = query.contains('departments', [department]);
    }

    if (acceptingStudents === 'true') {
      query = query.eq('is_accepting_students', true);
    }

    const { data: advisors, error } = await query;

    if (error) {
      console.error('Error fetching advisors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch advisors' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: advisors || [] });

  } catch (error: any) {
    console.error('Error in advisors API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
