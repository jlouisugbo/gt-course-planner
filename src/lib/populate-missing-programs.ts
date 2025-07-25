/**
 * Utility script to populate missing degree programs in the database
 * Run this to add common degree programs that users might select
 */

import { supabase } from './supabaseClient';

// Common degree programs that should be in the database
const missingPrograms = [
    {
        name: 'Aerospace Engineering',
        degree_type: 'BS',
        total_credits: 120,
        college_id: 1, // Assuming College of Engineering has ID 1
        is_active: true,
        requirements: [],
        gen_ed_requirements: {}
    },
    {
        name: 'Computer Science',
        degree_type: 'BS', 
        total_credits: 120,
        college_id: 6, // Assuming College of Computing has ID 6
        is_active: true,
        requirements: [],
        gen_ed_requirements: {}
    },
    {
        name: 'Mechanical Engineering',
        degree_type: 'BS',
        total_credits: 120,
        college_id: 1, // College of Engineering
        is_active: true,
        requirements: [],
        gen_ed_requirements: {}
    },
    {
        name: 'Electrical Engineering',
        degree_type: 'BS',
        total_credits: 120,
        college_id: 1, // College of Engineering
        is_active: true,
        requirements: [],
        gen_ed_requirements: {}
    }
];

export async function populateMissingPrograms() {
    console.log('Starting to populate missing degree programs...');
    
    try {
        // First, check what colleges exist
        const { data: colleges, error: collegeError } = await supabase
            .from('colleges')
            .select('id, name, abbreviation');
            
        if (collegeError) {
            console.error('Error fetching colleges:', collegeError);
            return;
        }
        
        console.log('Available colleges:', colleges);
        
        // Check what programs already exist
        const { data: existingPrograms, error: existingError } = await supabase
            .from('degree_programs')
            .select('name, degree_type');
            
        if (existingError) {
            console.error('Error fetching existing programs:', existingError);
            return;
        }
        
        console.log('Existing degree programs:', existingPrograms);
        
        // Filter out programs that already exist
        const existingNames = new Set(existingPrograms?.map(p => p.name) || []);
        const programsToAdd = missingPrograms.filter(p => !existingNames.has(p.name));
        
        if (programsToAdd.length === 0) {
            console.log('All programs already exist in database');
            return;
        }
        
        console.log(`Adding ${programsToAdd.length} missing programs:`, programsToAdd.map(p => p.name));
        
        // Insert the missing programs
        const { data: insertedPrograms, error: insertError } = await supabase
            .from('degree_programs')
            .insert(programsToAdd)
            .select();
            
        if (insertError) {
            console.error('Error inserting programs:', insertError);
            return;
        }
        
        console.log('Successfully added programs:', insertedPrograms);
        
    } catch (error) {
        console.error('Exception in populateMissingPrograms:', error);
    }
}

// Export for manual execution if needed
export { missingPrograms };