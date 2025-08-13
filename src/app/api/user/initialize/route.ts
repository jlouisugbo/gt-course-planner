import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { initializeUserInAllTables, checkUserInitialization } from '@/lib/user-initialization';

export async function POST(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get the user's internal ID
        const { data: userRecord, error: userError } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userRecord) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // Check current initialization status
        const check = await checkUserInitialization(Number(userRecord.id));

        // Initialize user in all required tables
        const result = await initializeUserInAllTables(Number(userRecord.id));

        return NextResponse.json({
            success: result.success,
            wasInitialized: check.needsInitialization,
            missingTables: check.missingTables,
            tablesInitialized: result.tablesInitialized,
            errors: result.errors,
            message: result.success 
                ? 'User successfully initialized in all required tables'
                : 'User initialization completed with some errors'
        });

    } catch (error) {
        console.error('User initialization API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } = await authenticateRequest(request);
        
        if (!user || authError) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Get the user's internal ID
        const { data: userRecord, error: userError } = await supabaseAdmin()
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (userError || !userRecord) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // Check initialization status
        const check = await checkUserInitialization(Number(userRecord.id));

        return NextResponse.json({
            userId: userRecord.id,
            needsInitialization: check.needsInitialization,
            missingTables: check.missingTables,
            message: check.needsInitialization 
                ? 'User requires initialization'
                : 'User is properly initialized'
        });

    } catch (error) {
        console.error('User initialization check API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}