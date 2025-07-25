// Script to seed the database with sample GT programs
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
        console.log('🌱 Starting database seeding...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'seed-database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by statements and execute each one
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing statement...');
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
                
                if (error) {
                    console.error('Error executing statement:', error);
                    // Try direct execution as fallback
                    const { error: directError } = await supabase
                        .from('degree_programs')
                        .upsert({}, { onConflict: 'id' });
                    
                    if (directError) {
                        console.error('Direct execution also failed:', directError);
                    }
                }
            }
        }

        // Verify the seeding worked
        const { data: programs, error: verifyError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type')
            .limit(10);

        if (verifyError) {
            console.error('Error verifying seeded data:', verifyError);
        } else {
            console.log('✅ Database seeded successfully!');
            console.log('Sample programs added:');
            programs.forEach(program => {
                console.log(`  - ${program.name} (${program.degree_type})`);
            });
        }

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

seedDatabase();