import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const majorName = searchParams.get('major') || 'Aerospace Engineering';

        console.log(`🔍 Debug: Searching for major: "${majorName}"`);

        // Use admin client for server-side access
        const supabase = supabaseAdmin();

        // First, let's see what degree programs exist - try different approaches
        console.log('🔧 Testing different query approaches with admin client...');
        
        // Test 1: Simple query without limit
        const { data: allPrograms, error: allError } = await supabase
            .from('degree_programs')
            .select('*');

        console.log('📋 All degree programs (no limit):', { 
            count: allPrograms?.length || 0, 
            data: allPrograms, 
            error: allError 
        });

        // Test 2: Count total records
        const { count, error: countError } = await supabase
            .from('degree_programs')
            .select('*', { count: 'exact', head: true });
            
        console.log('🔢 Total degree programs count:', { count, countError });

        // Test 3: Check if RLS is blocking us
        const { data: publicPrograms, error: publicError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, is_active')
            .limit(5);
            
        console.log('🔓 Public access test:', { publicPrograms, publicError });

        // Also check if colleges table has data
        const { data: colleges, error: collegesError } = await supabase
            .from('colleges')
            .select('id, name, abbreviation')
            .limit(10);
        
        console.log('🏫 Colleges:', { colleges, collegesError });

        if (allError) {
            console.error('❌ Error fetching all programs:', allError);
            return NextResponse.json({ error: 'Database error', details: allError }, { status: 500 });
        }

        // Now try the exact query that's failing
        const { data: program, error: programError } = await supabase
            .from('degree_programs')
            .select(`
                id, 
                name, 
                total_credits, 
                degree_type,
                requirements,
                college_id,
                colleges!degree_programs_college_id_fkey(name)
            `)
            .ilike('name', majorName.trim())
            .eq('degree_type', 'BS')
            .eq('is_active', true)
            .single();

        console.log('🎯 Specific query result:', { program, programError });

        if (programError) {
            // Try without single() to see if we get multiple results
            const { data: multiplePrograms, error: multiError } = await supabase
                .from('degree_programs')
                .select(`
                    id, 
                    name, 
                    total_credits, 
                    degree_type,
                    requirements,
                    college_id,
                    colleges!degree_programs_college_id_fkey(name)
                `)
                .ilike('name', majorName.trim())
                .eq('degree_type', 'BS')
                .eq('is_active', true);

            console.log('📊 Multiple results check:', { multiplePrograms, multiError });

            return NextResponse.json({
                error: 'Program not found',
                searchedMajor: majorName,
                allPrograms: allPrograms?.slice(0, 10),
                colleges: colleges?.slice(0, 5),
                programError,
                multiplePrograms,
                multiError,
                tableStatus: {
                    degreePrograms: allPrograms?.length || 0,
                    colleges: colleges?.length || 0
                }
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            searchedMajor: majorName,
            program,
            allProgramsCount: allPrograms?.length || 0,
            samplePrograms: allPrograms?.slice(0, 5)
        });

    } catch (error) {
        console.error('💥 Debug endpoint error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}