import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSecureRoute, SECURITY_CONFIGS } from '@/lib/security/middleware';

// List all active degree programs (id, name, degree_type, total_credits, requirements, footnotes)
export const GET = createSecureRoute(async () => {
  const { data, error } = await supabaseAdmin()
    .from('degree_programs')
    .select('id, name, degree_type, total_credits, requirements, footnotes')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch degree programs' }, { status: 500 });
  }

  return NextResponse.json({ programs: data ?? [] });
}, SECURITY_CONFIGS.MEDIUM_SECURITY);
