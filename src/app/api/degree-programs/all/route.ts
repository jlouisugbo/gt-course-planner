import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/degree-programs/all
 * List all active degree programs (public data, no auth required)
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from('degree_programs')
      .select('id, name, degree_type, total_credits, requirements, footnotes')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[Degree Programs API] Failed to fetch:', error);
      return NextResponse.json({ error: 'Failed to fetch degree programs' }, { status: 500 });
    }

    return NextResponse.json({ programs: data ?? [] });
  } catch (error) {
    console.error('[Degree Programs API] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
