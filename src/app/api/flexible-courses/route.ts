import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requirementType = searchParams.get('type'); // e.g., "Economics Requirement"
        const searchTerm = searchParams.get('search');

        if (!requirementType) {
            return NextResponse.json({ error: 'Requirement type is required' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('courses')
            .select('*')
            .order('code');

        // Apply search filters based on requirement type
        if (requirementType.toLowerCase().includes('economics')) {
            // Search for economics courses
            query = query.or('code.ilike.%ECON%,title.ilike.%Economics%,title.ilike.%Economic%');
        } else if (requirementType.toLowerCase().includes('social science')) {
            // Search for social science courses
            query = query.or('college.ilike.%Liberal Arts%,department.ilike.%PUBP%,department.ilike.%INTA%,department.ilike.%SOC%');
        } else if (requirementType.toLowerCase().includes('humanities')) {
            // Search for humanities courses
            query = query.or('college.ilike.%Liberal Arts%,department.ilike.%ENGL%,department.ilike.%PHIL%,department.ilike.%HIST%');
        } else if (searchTerm) {
            // Generic search if specific type not recognized
            query = query.or(`code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data: courses, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching flexible courses:', error);
            return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
        }

        return NextResponse.json({
            requirementType,
            courses: courses || [],
            count: courses?.length || 0
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}