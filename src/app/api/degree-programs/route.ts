import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        // Optional authentication - allow access for demo purposes
        const { user: _user } = await authenticateRequest(request);

        const { searchParams } = new URL(request.url);
        const majorName = searchParams.get('major');
        const degreeType = searchParams.get('degree_type') || 'BS'; // Default to BS if not specified

        if (!majorName) {
            return NextResponse.json({ error: 'Major name is required' }, { status: 400 });
        }

        const { data: program, error: programError } = await supabaseAdmin()
            .from('degree_programs')
            .select('id, name, degree_type, total_credits, requirements, footnotes')
            .eq('name', majorName.trim())
            .eq('degree_type', degreeType)
            .eq('is_active', true)
            .single();

        if (programError) {
            console.error('Error fetching degree program:', programError);

            // Try case-insensitive fallback on name field with degree_type
            const { data: fallbackProgram, error: fallbackError } = await supabaseAdmin()
                .from('degree_programs')
                .select('id, name, degree_type, total_credits, requirements, footnotes')
                .ilike('name', majorName)
                .eq('degree_type', degreeType)
                .eq('is_active', true)
                .single();

            if (fallbackError) {
                console.error('Case-insensitive fallback also failed:', fallbackError);
                
                // Final attempt: try without is_active filter in case it's null
                const { data: finalProgram, error: finalError } = await supabaseAdmin()
                    .from('degree_programs')
                    .select('id, name, degree_type, total_credits, requirements, footnotes, is_active')
                    .ilike('name', majorName)
                    .eq('degree_type', degreeType)
                    .single();
                
                if (finalError) {
                    console.error('Final attempt also failed:', finalError);
                    return NextResponse.json({ error: `No degree program found for major: ${majorName}` }, { status: 404 });
                }

                return NextResponse.json(finalProgram);
            }

            return NextResponse.json(fallbackProgram);
        }

        return NextResponse.json(program);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}