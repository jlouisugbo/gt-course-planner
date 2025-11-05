import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabaseServer';

/**
 * DEBUG ENDPOINT - DEVELOPMENT ONLY
 * This endpoint populates the database with sample degree programs.
 * It should NOT be accessible in production.
 */
export async function POST(request: NextRequest) {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            error: 'Debug endpoints are disabled in production'
        }, { status: 403 });
    }

    // SECURITY: Require authentication and admin role
    try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                error: 'Authentication required for debug endpoints'
            }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('admin')
            .eq('auth_id', user.id)
            .single();

        if (!userData?.admin) {
            return NextResponse.json({
                error: 'Admin access required for database population'
            }, { status: 403 });
        }
    } catch (authError) {
        return NextResponse.json({
            error: 'Authentication failed'
        }, { status: 401 });
    }

    try {
        console.log('🚀 Starting database population...');

        const supabase = supabaseAdmin();

        // First, let's add some colleges if they don't exist
        const colleges = [
            { name: 'College of Computing', abbreviation: 'COC' },
            { name: 'College of Engineering', abbreviation: 'COE' },
            { name: 'College of Sciences', abbreviation: 'COS' },
            { name: 'College of Liberal Arts', abbreviation: 'COLA' },
            { name: 'Scheller College of Business', abbreviation: 'SCB' }
        ];

        console.log('📚 Inserting colleges...');
        const { data: insertedColleges, error: collegesError } = await supabase
            .from('colleges')
            .upsert(colleges, { onConflict: 'name', ignoreDuplicates: true })
            .select();

        if (collegesError) {
            console.error('❌ Error inserting colleges:', collegesError);
            return NextResponse.json({ error: 'Failed to insert colleges', details: collegesError }, { status: 500 });
        }

        console.log('✅ Colleges inserted:', insertedColleges);

        // Get college IDs for degree programs
        const { data: allColleges } = await supabase
            .from('colleges')
            .select('id, name, abbreviation');

        const collegeMap = Object.fromEntries(allColleges?.map(c => [c.abbreviation, c.id]) || []);
        console.log('🗺️ College map:', collegeMap);

        // Now add some basic degree programs
        const degreePrograms = [
            {
                name: 'Computer Science',
                degree_type: 'BS',
                total_credits: 120,
                college_id: collegeMap['COC'],
                is_active: true,
                requirements: {
                    foundation: ['MATH 1551', 'MATH 1552', 'CS 1301', 'CS 1331', 'CS 1332'],
                    core: ['CS 2110', 'CS 2340', 'CS 3510', 'CS 4400'],
                    threads: ['Systems & Architecture', 'Intelligence', 'Theory', 'People', 'Media', 'Devices']
                }
            },
            {
                name: 'Aerospace Engineering',
                degree_type: 'BS',
                total_credits: 128,
                college_id: collegeMap['COE'],
                is_active: true,
                requirements: {
                    foundation: ['MATH 1551', 'MATH 1552', 'PHYS 2211', 'PHYS 2212', 'CHEM 1310'],
                    core: ['AE 2010', 'AE 2011', 'AE 3140', 'AE 3530'],
                    design: ['AE 4451', 'AE 4452', 'AE 4453']
                }
            },
            {
                name: 'Mechanical Engineering',
                degree_type: 'BS',
                total_credits: 128,
                college_id: collegeMap['COE'],
                is_active: true,
                requirements: {
                    foundation: ['MATH 1551', 'MATH 1552', 'PHYS 2211', 'PHYS 2212'],
                    core: ['ME 2016', 'ME 3017', 'ME 3180', 'ME 3340'],
                    design: ['ME 4182', 'ME 4183']
                }
            },
            {
                name: 'Electrical Engineering',
                degree_type: 'BS',
                total_credits: 128,
                college_id: collegeMap['COE'],
                is_active: true,
                requirements: {
                    foundation: ['MATH 1551', 'MATH 1552', 'PHYS 2211', 'PHYS 2212'],
                    core: ['ECE 2020', 'ECE 2025', 'ECE 2040', 'ECE 3025'],
                    design: ['ECE 4100', 'ECE 4180']
                }
            },
            {
                name: 'Industrial Engineering',
                degree_type: 'BS',
                total_credits: 126,
                college_id: collegeMap['COE'],
                is_active: true,
                requirements: {
                    foundation: ['MATH 1551', 'MATH 1552', 'ISYE 2027', 'ISYE 3025'],
                    core: ['ISYE 3103', 'ISYE 3232', 'ISYE 4803'],
                    design: ['ISYE 4400']
                }
            }
        ];

        console.log('🎓 Inserting degree programs...');
        const { data: insertedPrograms, error: programsError } = await supabase
            .from('degree_programs')
            .upsert(degreePrograms, { onConflict: 'name,degree_type', ignoreDuplicates: true })
            .select();

        if (programsError) {
            console.error('❌ Error inserting degree programs:', programsError);
            return NextResponse.json({ error: 'Failed to insert degree programs', details: programsError }, { status: 500 });
        }

        console.log('✅ Degree programs inserted:', insertedPrograms);

        return NextResponse.json({
            success: true,
            message: 'Database populated successfully',
            inserted: {
                colleges: insertedColleges?.length || 0,
                degreePrograms: insertedPrograms?.length || 0
            },
            data: {
                colleges: insertedColleges,
                degreePrograms: insertedPrograms
            }
        });

    } catch (error) {
        console.error('💥 Population error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}