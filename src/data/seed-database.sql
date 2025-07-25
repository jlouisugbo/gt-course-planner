-- Database seeding script for GT Course Planner
-- This script populates the degree_programs table with sample Georgia Tech programs

-- First, let's make sure we have the colleges table populated
INSERT INTO colleges (id, name, abbreviation, is_active) VALUES
(1, 'College of Engineering', 'COE', true),
(2, 'College of Computing', 'COC', true),
(3, 'College of Sciences', 'COS', true),
(4, 'College of Liberal Arts', 'COLA', true),
(5, 'Scheller College of Business', 'SCB', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    abbreviation = EXCLUDED.abbreviation,
    is_active = EXCLUDED.is_active;

-- Now populate degree_programs with major Georgia Tech programs
INSERT INTO degree_programs (id, name, degree_type, college_id, total_credits, is_active, requirements) VALUES
-- Engineering Programs
(1, 'Aerospace Engineering', 'Bachelor of Science', 1, 128, true, '[
    {
        "id": "core",
        "title": "Core Curriculum",
        "type": "core",
        "minCredits": 42,
        "courses": ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "MATH 2552", "PHYS 2211", "PHYS 2212", "CHEM 1310"]
    },
    {
        "id": "foundation",
        "title": "Foundation Courses", 
        "type": "required",
        "minCredits": 30,
        "courses": ["AE 1601", "AE 2220", "AE 2610", "AE 3030", "AE 3140", "AE 3515", "AE 3530", "ME 3322", "ECE 3710", "COE 2001"]
    },
    {
        "id": "advanced",
        "title": "Advanced AE Courses",
        "type": "required", 
        "minCredits": 21,
        "courses": ["AE 4350", "AE 4451", "AE 4452", "AE 4531", "AE 4532", "AE 4698", "AE 4699"]
    },
    {
        "id": "electives",
        "title": "Technical Electives",
        "type": "elective",
        "minCredits": 15,
        "selectionCount": 5,
        "courses": ["AE 4355", "AE 4356", "AE 4363", "AE 4445", "AE 4446", "AE 4447", "AE 4453", "AE 4454", "AE 4460", "AE 4470"]
    }
]'),

-- Computer Science
(2, 'Computer Science', 'Bachelor of Science', 2, 120, true, '[
    {
        "id": "core",
        "title": "Core Curriculum", 
        "type": "core",
        "minCredits": 36,
        "courses": ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "PHYS 2211", "PHYS 2212"]
    },
    {
        "id": "foundation",
        "title": "CS Foundation",
        "type": "required",
        "minCredits": 30,
        "courses": ["CS 1301", "CS 1331", "CS 1332", "CS 2050", "CS 2110", "CS 2340", "CS 3510", "CS 3511", "CS 4400", "MATH 3012"]
    },
    {
        "id": "threads",
        "title": "Thread Requirements",
        "type": "thread_selection",
        "minCredits": 24,
        "selectionCount": 2,
        "options": [
            {
                "id": "theory",
                "name": "Theory",
                "courses": ["CS 4510", "CS 4520", "CS 4540"]
            },
            {
                "id": "systems",
                "name": "Systems & Architecture", 
                "courses": ["CS 3220", "CS 4210", "CS 4290"]
            },
            {
                "id": "intelligence",
                "name": "Intelligence",
                "courses": ["CS 3600", "CS 4641", "CS 4650"]
            }
        ]
    },
    {
        "id": "free_electives",
        "title": "Free Electives",
        "type": "elective",
        "minCredits": 30,
        "selectionCount": 10
    }
]'),

-- Mechanical Engineering  
(3, 'Mechanical Engineering', 'Bachelor of Science', 1, 128, true, '[
    {
        "id": "core",
        "title": "Core Curriculum",
        "type": "core", 
        "minCredits": 42,
        "courses": ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "MATH 2552", "PHYS 2211", "PHYS 2212", "CHEM 1310"]
    },
    {
        "id": "foundation",
        "title": "ME Foundation",
        "type": "required",
        "minCredits": 45,
        "courses": ["ME 1770", "ME 2110", "ME 3017", "ME 3180", "ME 3210", "ME 3322", "ME 3345", "ME 3670", "ME 4056", "ME 4698", "ME 4699"]
    },
    {
        "id": "technical_electives", 
        "title": "Technical Electives",
        "type": "elective",
        "minCredits": 18,
        "selectionCount": 6,
        "courses": ["ME 4315", "ME 4320", "ME 4342", "ME 4405", "ME 4451", "ME 4452", "ME 4455", "ME 4460", "ME 4480", "ME 4490"]
    }
]'),

-- Electrical Engineering
(4, 'Electrical Engineering', 'Bachelor of Science', 1, 128, true, '[
    {
        "id": "core",
        "title": "Core Curriculum",
        "type": "core",
        "minCredits": 42, 
        "courses": ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "MATH 2552", "PHYS 2211", "PHYS 2212", "CHEM 1310"]
    },
    {
        "id": "foundation",
        "title": "EE Foundation", 
        "type": "required",
        "minCredits": 36,
        "courses": ["ECE 2020", "ECE 2025", "ECE 2026", "ECE 2040", "ECE 3025", "ECE 3040", "ECE 3077", "ECE 3710", "ECE 4000", "ECE 4180", "ECE 4695", "ECE 4698"]
    },
    {
        "id": "concentration",
        "title": "Concentration Electives",
        "type": "elective", 
        "minCredits": 21,
        "selectionCount": 7,
        "courses": ["ECE 4270", "ECE 4320", "ECE 4370", "ECE 4380", "ECE 4400", "ECE 4430", "ECE 4435", "ECE 4440", "ECE 4450", "ECE 4460"]
    }
]'),

-- Business Administration
(5, 'Business Administration', 'Bachelor of Science', 5, 120, true, '[
    {
        "id": "core",
        "title": "Core Curriculum",
        "type": "core",
        "minCredits": 36,
        "courses": ["ENGL 1101", "ENGL 1102", "MATH 1551", "MATH 1552", "MATH 2551", "HIST 2111", "HIST 2112", "POL 1101"]
    },
    {
        "id": "business_core",
        "title": "Business Core",
        "type": "required", 
        "minCredits": 42,
        "courses": ["ACCT 2101", "ACCT 2102", "ECON 2105", "ECON 2106", "MGT 2210", "MGT 3000", "MGT 3062", "MGT 3076", "MGT 3200", "MGT 4000", "MGT 4803", "MKTG 3000", "INTA 2050", "BCOM 3950"]
    },
    {
        "id": "concentration",
        "title": "Concentration",
        "type": "elective",
        "minCredits": 18,
        "selectionCount": 6,
        "courses": ["FIN 3000", "FIN 3120", "MKTG 3120", "MKTG 3180", "MGT 3300", "MGT 3400", "MGT 3501", "MGT 3600", "MGT 3700", "MGT 3800"]
    }
]')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    degree_type = EXCLUDED.degree_type,
    college_id = EXCLUDED.college_id,
    total_credits = EXCLUDED.total_credits,
    is_active = EXCLUDED.is_active,
    requirements = EXCLUDED.requirements;

-- Add some minor programs
INSERT INTO degree_programs (id, name, degree_type, college_id, total_credits, is_active, requirements) VALUES
-- Minors
(10, 'Computer Science', 'Minor', 2, 15, true, '[
    {
        "id": "required",
        "title": "Required Courses",
        "type": "required",
        "minCredits": 9,
        "courses": ["CS 1301", "CS 1331", "CS 1332"]
    },
    {
        "id": "electives",
        "title": "CS Electives", 
        "type": "elective",
        "minCredits": 6,
        "selectionCount": 2,
        "courses": ["CS 2050", "CS 2110", "CS 2340", "CS 3510", "CS 3600", "CS 4400"]
    }
]'),

(11, 'Mathematics', 'Minor', 3, 15, true, '[
    {
        "id": "required",
        "title": "Required Courses",
        "type": "required", 
        "minCredits": 9,
        "courses": ["MATH 1551", "MATH 1552", "MATH 2551"]
    },
    {
        "id": "electives",
        "title": "Math Electives",
        "type": "elective",
        "minCredits": 6,
        "selectionCount": 2,
        "courses": ["MATH 2552", "MATH 3012", "MATH 3215", "MATH 3670", "MATH 4080", "MATH 4150"]
    }
]'),

(12, 'Business', 'Minor', 5, 15, true, '[
    {
        "id": "required",
        "title": "Required Courses",
        "type": "required",
        "minCredits": 12,
        "courses": ["ACCT 2101", "ECON 2105", "MGT 3000", "MKTG 3000"]
    },
    {
        "id": "electives",
        "title": "Business Electives",
        "type": "elective", 
        "minCredits": 3,
        "selectionCount": 1,
        "courses": ["FIN 3000", "MGT 3062", "MKTG 3120", "MGT 3200"]
    }
]')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    degree_type = EXCLUDED.degree_type,
    college_id = EXCLUDED.college_id,
    total_credits = EXCLUDED.total_credits,
    is_active = EXCLUDED.is_active,
    requirements = EXCLUDED.requirements;

-- Reset sequence to prevent ID conflicts
SELECT setval('degree_programs_id_seq', (SELECT MAX(id) FROM degree_programs));
SELECT setval('colleges_id_seq', (SELECT MAX(id) FROM colleges));