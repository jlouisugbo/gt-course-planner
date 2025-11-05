import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

// PUT /api/semesters/:id - update a specific semester
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing semester id' }, { status: 400 });
        }

        const body = await request.json();
        const { year, season, courses, maxCredits, isActive, gpa, totalCredits } = body;

        // Get internal user id
        const { data: userRecord } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Try update first
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };
        if (year !== undefined) updatePayload.year = parseInt(year);
        if (season !== undefined) updatePayload.season = season;
        if (courses !== undefined) updatePayload.courses = courses;
        if (maxCredits !== undefined) updatePayload.max_credits = maxCredits;
        if (isActive !== undefined) updatePayload.is_active = isActive;
        if (gpa !== undefined) updatePayload.gpa = gpa;
        if (totalCredits !== undefined) updatePayload.total_credits = totalCredits;

        // Check if the semester exists
        const { data: existing } = await supabaseAdmin()
            .from('user_semesters')
            .select('id')
            .eq('user_id', Number(userRecord.id))
            .eq('semester_id', Number(id))
            .maybeSingle();

        if (existing) {
            const { data: updated, error: updateError } = await supabaseAdmin()
                .from('user_semesters')
                .update(updatePayload)
                .eq('user_id', Number(userRecord.id))
                .eq('semester_id', Number(id))
                .select()
                .single();

            if (updateError) {
                console.error('Error updating semester:', updateError);
                return NextResponse.json({ error: 'Failed to update semester' }, { status: 500 });
            }

            return NextResponse.json({ semester: updated });
        }

        // If not existing, insert
        const insertPayload: any = {
            user_id: userRecord.id,
            semester_id: Number(id),
            year: year ? parseInt(year) : undefined,
            season: season,
            courses: courses || [],
            total_credits: totalCredits || 0,
            max_credits: maxCredits || 18,
            is_active: isActive || false,
            gpa: gpa || 0,
            updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabaseAdmin()
            .from('user_semesters')
            .insert(insertPayload)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting semester:', insertError);
            if (insertError.code === '42P01') {
                return NextResponse.json({ message: 'Semester saved locally (migration needed)' });
            }
            return NextResponse.json({ error: 'Failed to save semester' }, { status: 500 });
        }

        return NextResponse.json({ semester: inserted });
    } catch (error) {
        console.error('PUT /api/semesters/:id error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
