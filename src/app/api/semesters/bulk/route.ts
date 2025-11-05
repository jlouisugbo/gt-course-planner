import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

// POST /api/semesters/bulk - upsert multiple semesters for the authenticated user
export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const semesters = Array.isArray(body?.semesters) ? body.semesters : body;

        if (!Array.isArray(semesters) || semesters.length === 0) {
            return NextResponse.json({ error: 'Missing semesters array' }, { status: 400 });
        }

        // Get internal user id
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Build upsert records
        const records = semesters.map((s: any) => ({
            user_id: userRecord.id,
            semester_id: Number(s.semesterId || s.id),
            year: s.year ? parseInt(s.year) : undefined,
            season: s.season,
            courses: s.courses || [],
            total_credits: s.totalCredits || s.total_credits || 0,
            max_credits: s.maxCredits || s.max_credits || 18,
            is_active: !!s.isActive,
            gpa: s.gpa || 0,
            updated_at: new Date().toISOString(),
        }));

        const { data: upserted, error: upsertError } = await supabaseAdmin()
            .from('user_semesters')
            .upsert(records, { onConflict: 'user_id,semester_id' })
            .select();

        if (upsertError) {
            console.error('Error bulk upserting semesters:', upsertError);
            if (upsertError.code === '42P01') {
                return NextResponse.json({ message: 'Semesters saved locally (migration needed)' });
            }
            return NextResponse.json({ error: 'Failed to upsert semesters' }, { status: 500 });
        }

        return NextResponse.json({ semesters: upserted, count: upserted?.length || 0 });
    } catch (error) {
        console.error('POST /api/semesters/bulk error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
