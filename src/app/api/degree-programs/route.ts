import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // SECURITY FIX: Authenticate user before accessing GT degree program data
    const { user, error: authError } = await authenticateRequest(request);
    
    if (!user || authError) {
        console.error('Unauthorized access attempt to /api/degree-programs:', authError);
        return NextResponse.json(
            { error: 'Authentication required to access GT degree program data' }, 
            { status: 401 }
        );
    }
    try {
        const { searchParams } = new URL(request.url);
        const majorName = searchParams.get('major');
        const degreeType = searchParams.get('degree_type') || 'BS'; // Default to BS if not specified

        if (!majorName) {
            return NextResponse.json({ error: 'Major name is required' }, { status: 400 });
        }
        console.log(`Fetching degree program for major:`, majorName, `degree_type:`, degreeType);
        console.log(`Major name type:`, typeof majorName);
        console.log(`Major name length:`, majorName.length);
        console.log(`Major name trimmed:`, majorName.trim());

        const { data: program, error: programError } = await supabaseAdmin
            .from('degree_programs')
            .select('id, name, degree_type, total_credits, requirements, footnotes')
            .eq('name', majorName.trim())
            .eq('degree_type', degreeType)
            .eq('is_active', true)
            .single();

        if (programError) {
            console.error('Error fetching degree program:', programError);
            console.log(`Looking for major:`, majorName);
            
            // Debug: Check what degree programs actually exist
            const { data: allPrograms } = await supabaseAdmin
                .from('degree_programs')
                .select('id, name, degree_type, is_active');
            console.log('Available degree programs:', allPrograms);
            
            // Debug: Check specifically for Aerospace Engineering in both fields
            const { data: nameSearch } = await supabaseAdmin
                .from('degree_programs')
                .select('id, name, degree_type, is_active')
                .eq('name', 'Aerospace Engineering');
            console.log('Programs with name = "Aerospace Engineering":', nameSearch);
            
            const { data: typeSearch } = await supabaseAdmin
                .from('degree_programs')
                .select('id, name, degree_type, is_active')
                .eq('degree_type', 'BS');
            console.log('Programs with degree_type = "BS":', typeSearch);
            
            // Try case-insensitive fallback on name field with degree_type
            const { data: fallbackProgram, error: fallbackError } = await supabaseAdmin
                .from('degree_programs')
                .select('id, name, degree_type, total_credits, requirements, footnotes')
                .ilike('name', majorName)
                .eq('degree_type', degreeType)
                .eq('is_active', true)
                .single();

            if (fallbackError) {
                console.error('Case-insensitive fallback also failed:', fallbackError);
                
                // Final attempt: try without is_active filter in case it's null
                const { data: finalProgram, error: finalError } = await supabaseAdmin
                    .from('degree_programs')
                    .select('id, name, degree_type, total_credits, requirements, footnotes, is_active')
                    .ilike('name', majorName)
                    .eq('degree_type', degreeType)
                    .single();
                
                if (finalError) {
                    console.error('Final attempt also failed:', finalError);
                    return NextResponse.json({ error: `No degree program found for major: ${majorName}` }, { status: 404 });
                }
                
                console.log('Found program without is_active filter:', finalProgram);
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