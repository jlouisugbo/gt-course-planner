// Simple database seeding script using direct Supabase operations
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function seedPrograms() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    );

    try {
        console.log('🌱 Starting program seeding...');

        // First, ensure colleges exist
        const colleges = [
            { id: 1, name: 'College of Engineering', abbreviation: 'COE', is_active: true },
            { id: 2, name: 'College of Computing', abbreviation: 'COC', is_active: true },
            { id: 3, name: 'College of Sciences', abbreviation: 'COS', is_active: true },
            { id: 4, name: 'College of Liberal Arts', abbreviation: 'COLA', is_active: true },
            { id: 5, name: 'Scheller College of Business', abbreviation: 'SCB', is_active: true }
        ];

        for (const college of colleges) {
            const { error } = await supabase
                .from('colleges')
                .upsert(college, { onConflict: 'id' });
            
            if (error) {
                console.log('College insert error (may already exist):', error.message);
            }
        }

        // Now add degree programs
        const programs = [
            {
                id: 1,
                name: 'Aerospace Engineering',
                degree_type: 'Bachelor of Science',
                college_id: 1,
                total_credits: 128,
                is_active: true,
                requirements: [
                    {
                        id: "core",
                        title: "Core Curriculum",
                        type: "core",
                        minCredits: 42,
                        courses: ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "MATH 2552", "PHYS 2211", "PHYS 2212", "CHEM 1310"]
                    },
                    {
                        id: "foundation",
                        title: "Foundation Courses", 
                        type: "required",
                        minCredits: 30,
                        courses: ["AE 1601", "AE 2220", "AE 2610", "AE 3030", "AE 3140", "AE 3515", "AE 3530", "ME 3322", "ECE 3710", "COE 2001"]
                    },
                    {
                        id: "advanced",
                        title: "Advanced AE Courses",
                        type: "required", 
                        minCredits: 21,
                        courses: ["AE 4350", "AE 4451", "AE 4452", "AE 4531", "AE 4532", "AE 4698", "AE 4699"]
                    },
                    {
                        id: "electives",
                        title: "Technical Electives",
                        type: "elective",
                        minCredits: 15,
                        selectionCount: 5,
                        courses: ["AE 4355", "AE 4356", "AE 4363", "AE 4445", "AE 4446", "AE 4447", "AE 4453", "AE 4454", "AE 4460", "AE 4470"]
                    }
                ]
            },
            {
                id: 2,
                name: 'Computer Science',
                degree_type: 'Bachelor of Science',
                college_id: 2,
                total_credits: 120,
                is_active: true,
                requirements: [
                    {
                        id: "core",
                        title: "Core Curriculum", 
                        type: "core",
                        minCredits: 36,
                        courses: ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "PHYS 2211", "PHYS 2212"]
                    },
                    {
                        id: "foundation",
                        title: "CS Foundation",
                        type: "required",
                        minCredits: 30,
                        courses: ["CS 1301", "CS 1331", "CS 1332", "CS 2050", "CS 2110", "CS 2340", "CS 3510", "CS 3511", "CS 4400", "MATH 3012"]
                    },
                    {
                        id: "threads",
                        title: "Thread Requirements",
                        type: "thread_selection",
                        minCredits: 24,
                        selectionCount: 2,
                        options: [
                            {
                                id: "theory",
                                name: "Theory",
                                courses: ["CS 4510", "CS 4520", "CS 4540"]
                            },
                            {
                                id: "systems",
                                name: "Systems & Architecture", 
                                courses: ["CS 3220", "CS 4210", "CS 4290"]
                            },
                            {
                                id: "intelligence",
                                name: "Intelligence",
                                courses: ["CS 3600", "CS 4641", "CS 4650"]
                            }
                        ]
                    }
                ]
            },
            {
                id: 3,
                name: 'Mechanical Engineering',
                degree_type: 'Bachelor of Science', 
                college_id: 1,
                total_credits: 128,
                is_active: true,
                requirements: [
                    {
                        id: "core",
                        title: "Core Curriculum",
                        type: "core", 
                        minCredits: 42,
                        courses: ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "MATH 2552", "PHYS 2211", "PHYS 2212", "CHEM 1310"]
                    },
                    {
                        id: "foundation",
                        title: "ME Foundation",
                        type: "required",
                        minCredits: 45,
                        courses: ["ME 1770", "ME 2110", "ME 3017", "ME 3180", "ME 3210", "ME 3322", "ME 3345", "ME 3670", "ME 4056", "ME 4698", "ME 4699"]
                    }
                ]
            },
            // Add some minors
            {
                id: 10,
                name: 'Computer Science',
                degree_type: 'Minor',
                college_id: 2,
                total_credits: 15,
                is_active: true,
                requirements: [
                    {
                        id: "required",
                        title: "Required Courses",
                        type: "required",
                        minCredits: 9,
                        courses: ["CS 1301", "CS 1331", "CS 1332"]
                    },
                    {
                        id: "electives",
                        title: "CS Electives", 
                        type: "elective",
                        minCredits: 6,
                        selectionCount: 2,
                        courses: ["CS 2050", "CS 2110", "CS 2340", "CS 3510", "CS 3600", "CS 4400"]
                    }
                ]
            }
        ];

        for (const program of programs) {
            console.log(`Adding program: ${program.name}`);
            const { error } = await supabase
                .from('degree_programs')
                .upsert(program, { onConflict: 'id' });
            
            if (error) {
                console.error(`Error adding ${program.name}:`, error);
            } else {
                console.log(`✅ Added ${program.name}`);
            }
        }

        // Verify the seeding worked
        const { data: allPrograms, error: verifyError } = await supabase
            .from('degree_programs')
            .select('id, name, degree_type, is_active')
            .eq('is_active', true)
            .order('id');

        if (verifyError) {
            console.error('Error verifying seeded data:', verifyError);
        } else {
            console.log('\n✅ Database seeding completed!');
            console.log(`Total programs in database: ${allPrograms.length}`);
            console.log('\nPrograms added:');
            allPrograms.forEach(program => {
                console.log(`  - ${program.name} (${program.degree_type})`);
            });
        }

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

seedPrograms();