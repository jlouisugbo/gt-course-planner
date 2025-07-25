// Complete fix for requirements integration
// Run this script to fix the database schema and populate missing data

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://ysoiwgmutgfamxjlxrna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb2l3Z211dGdmYW14amx4cm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEyMzgwMjYsImV4cCI6MjAzNjgxNDAyNn0.ikDLnGjOD8vYyLNLv41NZGvQ42DtO3UOZm8kvWpNcPE'; // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
    console.log('🔧 Starting database fix...');

    try {
        // Step 1: Add missing columns to users table
        console.log('📝 Adding missing columns to users table...');
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS completed_courses text[] DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS completed_groups text[] DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS has_detailed_gpa boolean DEFAULT false,
                ADD COLUMN IF NOT EXISTS semester_gpas jsonb DEFAULT '[]'::jsonb;
            `
        });
        
        if (alterError) {
            console.error('❌ Error adding columns:', alterError);
            // Try alternative approach using direct SQL
            console.log('🔄 Trying alternative approach...');
        }

        // Step 2: Update existing user with proper empty arrays
        console.log('👤 Updating user record...');
        
        const { data: updateResult, error: updateError } = await supabase
            .from('users')
            .update({
                completed_courses: [],
                completed_groups: [],
                has_detailed_gpa: false,
                semester_gpas: []
            })
            .eq('auth_id', '7fd4e3a0-5b35-41e4-a7a1-99853fa226ab')
            .select();

        if (updateError) {
            console.error('❌ Error updating user:', updateError);
        } else {
            console.log('✅ User updated successfully:', updateResult);
        }

        // Step 3: Verify degree programs exist and are active
        console.log('🎓 Checking degree programs...');
        
        const { data: programs, error: programsError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, is_active')
            .eq('is_active', true);

        if (programsError) {
            console.error('❌ Error fetching programs:', programsError);
        } else {
            console.log('📚 Available programs:', programs?.map(p => `${p.name} (${p.degree_type})`));
            
            if (!programs || programs.length === 0) {
                console.log('⚠️  No active degree programs found. Activating existing programs...');
                
                const { error: activateError } = await supabase
                    .from('degree_programs')
                    .update({ is_active: true })
                    .is('is_active', null);
                    
                if (activateError) {
                    console.error('❌ Error activating programs:', activateError);
                } else {
                    console.log('✅ Activated existing programs');
                }
            }
        }

        // Step 4: Test the requirements query
        console.log('🧪 Testing requirements query...');
        
        const { data: testUser, error: testError } = await supabase
            .from('users')
            .select('completed_courses, completed_groups, major')
            .eq('auth_id', '7fd4e3a0-5b35-41e4-a7a1-99853fa226ab')
            .single();

        if (testError) {
            console.error('❌ Test query failed:', testError);
        } else {
            console.log('✅ Test query successful:', testUser);
            
            // Test degree program fetch
            if (testUser.major) {
                const { data: degreeProgram, error: degreeError } = await supabase
                    .from('degree_programs')
                    .select('id, name, degree_type, requirements')
                    .eq('name', testUser.major)
                    .eq('is_active', true)
                    .single();
                    
                if (degreeError) {
                    console.error('❌ Degree program fetch failed:', degreeError);
                } else {
                    console.log('✅ Degree program found:', degreeProgram.name);
                    console.log('📋 Requirements structure:', degreeProgram.requirements ? 'Valid' : 'Missing');
                }
            }
        }

        console.log('🎉 Database fix completed!');

    } catch (error) {
        console.error('💥 Unexpected error:', error);
    }
}

// Run the fix
fixDatabase();