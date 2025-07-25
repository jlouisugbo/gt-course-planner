/**
 * New degree program methods using major text column instead of degree_program_id
 */

import { supabase } from './supabaseClient';
import { VisualDegreeProgram, VisualMinorProgram } from '@/types/requirements';

export async function fetchDegreeProgramRequirementsByMajor(): Promise<VisualDegreeProgram | null> {
    try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            return null;
        }

        // Get user's major from users table (new approach using major text column)
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('major')
            .eq('auth_id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user record:', userError);
            return null;
        }

        if (!userRecord?.major) {
            console.error('User has no major assigned. User needs to complete profile setup.');
            return null;
        }

        const majorName = userRecord.major;
        console.log('Fetching degree program requirements for major:', majorName);

        // First, check what degree programs exist in the database (more robust check)
        const { data: allPrograms, error: listError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, is_active')
            .limit(50);

        if (listError) {
            console.error('Error checking available programs:', listError);
            return null;
        }

        console.log('All degree programs in database:');
        allPrograms?.forEach(p => {
            console.log(`- ${p.name} (${p.degree_type}) - Active: ${p.is_active}`);
        });

        // Filter active programs
        const activePrograms = allPrograms?.filter(p => p.is_active === true) || [];
        
        if (activePrograms.length === 0) {
            console.warn('No active degree programs found. Attempting to activate existing programs...');
            
            // Try to activate programs that might have null is_active
            const { error: activateError } = await supabase
                .from('degree_programs')
                .update({ is_active: true })
                .is('is_active', null);
                
            if (activateError) {
                console.error('Failed to activate programs:', activateError);
            } else {
                console.log('Activated programs with null is_active status');
            }
            
            return null;
        }

        console.log('Available active degree programs:', activePrograms.map(p => `${p.name} (${p.degree_type})`));

        // Query degree program by major name via API route to avoid RLS issues
        try {
            const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(majorName)}`);
            
            if (!response.ok) {
                console.error('API request failed for major:', majorName);
                return null;
            }
            
            const program = await response.json();
            
            console.log('Found program via API:', program?.name);
            
            // Convert API response to visual format
            const visualProgram: VisualDegreeProgram = {
                id: program.id,
                name: program.name,
                degreeType: program.degree_type,
                college: undefined, // Skip college name for now
                totalCredits: program.total_credits || undefined,
                requirements: Array.isArray(program.requirements) ? program.requirements : [],
                footnotes: Array.isArray(program.footnotes) ? program.footnotes : []
            };
            
            return visualProgram;
        } catch (fetchError) {
            console.error('Error fetching degree program via API:', fetchError);
            return null;
        }

    } catch (error) {
        console.error('Error in fetchDegreeProgramRequirementsByMajor:', error);
        return null;
    }
}

export async function fetchMinorRequirementsByMinorsColumn(): Promise<VisualMinorProgram[]> {
    try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            return [];
        }

        // Get user's minors from users table (new approach using minors JSON column)
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('minors')
            .eq('auth_id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user record:', userError);
            return [];
        }

        if (!userRecord?.minors || !Array.isArray(userRecord.minors) || userRecord.minors.length === 0) {
            console.log('User has no minors selected');
            return [];
        }

        const minorNames = userRecord.minors;
        console.log('Fetching minor program requirements for minors:', minorNames);

        // Query minor programs by names
        const { data: programs, error: programError } = await supabase
            .from('degree_programs')
            .select('id, name, requirements')
            .eq('degree_type', 'Minor')
            .in('name', minorNames)
            .eq('is_active', true);

        if (programError) {
            console.error('Error fetching minor programs:', programError);
            return [];
        }

        // Convert to visual minor format
        const visualMinors: VisualMinorProgram[] = (programs || []).map(program => ({
            id: program.id,
            name: program.name,
            requirements: Array.isArray(program.requirements) ? program.requirements : [],
            footnotes: []
        }));

        return visualMinors;

    } catch (error) {
        console.error('Error in fetchMinorRequirementsByMinorsColumn:', error);
        return [];
    }
}