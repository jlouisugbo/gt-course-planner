import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
    try {
        // Get user ID from auth header or cookies
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
        }

        // Extract token from Bearer token
        const token = authHeader.replace('Bearer ', '');
        
        // Verify the token and get user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (error || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get user profile data
        const { data: userRecord, error: userError } = await supabaseAdmin
            .from('users')
            .select('major, minors, completed_courses')
            .eq('auth_id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user profile:', userError);
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            major: userRecord.major,
            minors: userRecord.minors || [],
            completedCourses: userRecord.completed_courses || []
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}