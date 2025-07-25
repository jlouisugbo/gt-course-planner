// Test script to verify requirements system is working
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function testRequirements() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    );

    try {
        console.log('🔬 Testing requirements system...\n');

        // Check available degree programs
        const { data: programs, error: programsError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, is_active')
            .eq('is_active', true)
            .order('id');

        if (programsError) {
            console.error('Error fetching programs:', programsError);
            return;
        }

        console.log(`✅ Found ${programs.length} active degree programs:`);
        programs.forEach(p => console.log(`  - ${p.name} (${p.degree_type})`));

        // Check users table structure and sample user
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('auth_id, full_name, major, minors, graduation_year')
            .limit(3);

        if (usersError) {
            console.error('Error fetching users:', usersError);
        } else {
            console.log(`\n📊 Sample users in database (${users.length}):`);
            users.forEach(user => {
                console.log(`  - ${user.full_name || 'No name'}: major="${user.major || 'None'}", minors=${JSON.stringify(user.minors || [])}, grad_year=${user.graduation_year || 'None'}`);
            });
        }

        // Test the specific methods we created
        console.log('\n🧪 Testing fetchDegreeProgramRequirementsByMajor method...');
        
        // Simulate the function (would need auth context in real app)
        const testMajor = 'Aerospace Engineering';
        const { data: testProgram, error: testError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, total_credits, requirements, college_id')
            .eq('name', testMajor)
            .eq('is_active', true)
            .single();

        if (testError) {
            console.error(`❌ Error fetching ${testMajor}:`, testError);
        } else {
            console.log(`✅ Successfully found ${testProgram.name}:`);
            console.log(`   - Degree Type: ${testProgram.degree_type}`);
            console.log(`   - Total Credits: ${testProgram.total_credits}`);
            console.log(`   - Requirements sections: ${testProgram.requirements?.length || 0}`);
            
            if (testProgram.requirements && testProgram.requirements.length > 0) {
                testProgram.requirements.forEach(req => {
                    console.log(`     • ${req.title}: ${req.courses?.length || 0} courses, ${req.minCredits} credits`);
                });
            }
        }

        console.log('\n✅ Requirements system test completed!');

    } catch (error) {
        console.error('❌ Error testing requirements:', error);
    }
}

testRequirements();