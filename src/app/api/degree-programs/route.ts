import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const majorName = searchParams.get('major');

        if (!majorName) {
            return NextResponse.json({ error: 'Major name is required' }, { status: 400 });
        }

        // Fetch degree program requirements using service key (bypasses RLS)
        const { data: program, error: programError } = await supabaseAdmin
            .from('degree_programs')
            .select('id, name, degree_type, total_credits, requirements, footnotes')
            .eq('name', majorName)
            .eq('is_active', true)
            .single();

        if (programError) {
            console.error('Error fetching degree program:', programError);
            
            // Try case-insensitive fallback
            const { data: fallbackProgram, error: fallbackError } = await supabaseAdmin
                .from('degree_programs')
                .select('id, name, degree_type, total_credits, requirements, footnotes')
                .ilike('name', majorName)
                .eq('is_active', true)
                .single();

            if (fallbackError) {
                console.error('Case-insensitive fallback also failed:', fallbackError);
                return NextResponse.json({ error: 'Degree program not found' }, { status: 404 });
            }

            return NextResponse.json(fallbackProgram);
        }

        return NextResponse.json(program);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}