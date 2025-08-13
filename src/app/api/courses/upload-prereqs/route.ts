import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface PrereqData {
    [courseCode: string]: any[]; // JSON structure as provided
}

interface ValidationStats {
    processed: number;
    updated: number;
    courseNotFound: number;
    validationErrors: number;
    errors: string[];
}

// Validate prerequisite data structure
const validatePrereqStructure = (courseCode: string, prereqData: any): { isValid: boolean; error?: string } => {
    if (!Array.isArray(prereqData)) {
        return { isValid: false, error: `Prerequisites for ${courseCode} must be an array` };
    }
    
    if (prereqData.length === 0) {
        return { isValid: true }; // Empty array is valid (no prerequisites)
    }
    
    // Check for valid operators
    if (prereqData.length > 0 && typeof prereqData[0] === 'string') {
        if (!['and', 'or'].includes(prereqData[0])) {
            return { isValid: false, error: `Invalid operator "${prereqData[0]}" for ${courseCode}` };
        }
    }
    
    // Validate individual prerequisite objects
    for (let i = 1; i < prereqData.length; i++) {
        const req = prereqData[i];
        if (typeof req === 'object' && req !== null) {
            if (!req.id || typeof req.id !== 'string') {
                return { isValid: false, error: `Invalid prerequisite object for ${courseCode}: missing or invalid 'id'` };
            }
            if (req.grade && typeof req.grade !== 'string') {
                return { isValid: false, error: `Invalid grade requirement for ${courseCode}: grade must be a string` };
            }
        }
    }
    
    return { isValid: true };
};

// Validate postrequisite data structure
const validatePostreqStructure = (courseCode: string, postreqData: any): { isValid: boolean; error?: string } => {
    if (!Array.isArray(postreqData)) {
        return { isValid: false, error: `Postrequisites for ${courseCode} must be an array` };
    }
    
    // All items should be strings (course codes)
    for (const item of postreqData) {
        if (typeof item !== 'string') {
            return { isValid: false, error: `Invalid postrequisite for ${courseCode}: all items must be course codes (strings)` };
        }
    }
    
    return { isValid: true };
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            prerequisites, 
            postrequisites,
            validateOnly = false
        }: { 
            prerequisites?: PrereqData;
            postrequisites?: PrereqData;
            validateOnly?: boolean;
        } = body;

        if (!prerequisites && !postrequisites) {
            return NextResponse.json({ 
                error: 'Either prerequisites or postrequisites data is required' 
            }, { status: 400 });
        }

        const stats: ValidationStats = {
            processed: 0,
            updated: 0,
            courseNotFound: 0,
            validationErrors: 0,
            errors: []
        };

        // Get all existing course codes for validation
        const { data: existingCourses } = await supabaseAdmin()
            .from('courses')
            .select('code')
            .order('code');
        
        const existingCodesSet = new Set(existingCourses?.map(c => c.code) || []);
        console.log(`📋 Found ${existingCodesSet.size} courses in database for validation`);

        // Process prerequisites
        if (prerequisites) {
            console.log(`Processing ${Object.keys(prerequisites).length} prerequisite entries...`);
            
            for (const [courseCode, prereqData] of Object.entries(prerequisites)) {
                stats.processed++;
                
                // Validate structure
                const validation = validatePrereqStructure(courseCode, prereqData);
                if (!validation.isValid) {
                    stats.validationErrors++;
                    stats.errors.push(validation.error!);
                    continue;
                }
                
                // Check if course exists
                if (!existingCodesSet.has(courseCode)) {
                    stats.courseNotFound++;
                    stats.errors.push(`Course ${courseCode} not found in database`);
                    continue;
                }
                
                // Skip update if validation only
                if (validateOnly) {
                    stats.updated++;
                    continue;
                }
                
                try {
                    const { error } = await supabaseAdmin()
                        .from('courses')
                        .update({ 
                            prerequisites: JSON.stringify(prereqData) 
                        })
                        .eq('code', courseCode);

                    if (error) {
                        stats.errors.push(`Failed to update prerequisites for ${courseCode}: ${error.message}`);
                    } else {
                        stats.updated++;
                    }
                } catch (err) {
                    stats.errors.push(`Error processing ${courseCode}: ${err}`);
                }
            }
        }

        // Process postrequisites
        if (postrequisites) {
            console.log(`Processing ${Object.keys(postrequisites).length} postrequisite entries...`);
            
            for (const [courseCode, postreqData] of Object.entries(postrequisites)) {
                stats.processed++;
                
                // Validate structure
                const validation = validatePostreqStructure(courseCode, postreqData);
                if (!validation.isValid) {
                    stats.validationErrors++;
                    stats.errors.push(validation.error!);
                    continue;
                }
                
                // Check if course exists
                if (!existingCodesSet.has(courseCode)) {
                    stats.courseNotFound++;
                    stats.errors.push(`Course ${courseCode} not found in database`);
                    continue;
                }
                
                // Skip update if validation only
                if (validateOnly) {
                    stats.updated++;
                    continue;
                }
                
                try {
                    const { error } = await supabaseAdmin()
                        .from('courses')
                        .update({ 
                            postrequisites: JSON.stringify(postreqData) 
                        })
                        .eq('code', courseCode);

                    if (error) {
                        stats.errors.push(`Failed to update postrequisites for ${courseCode}: ${error.message}`);
                    } else {
                        stats.updated++;
                    }
                } catch (err) {
                    stats.errors.push(`Error processing ${courseCode}: ${err}`);
                }
            }
        }

        const response = {
            success: stats.errors.length < stats.processed * 0.5, // Success if less than 50% errors
            message: validateOnly 
                ? `Validation complete: ${stats.processed} entries processed`
                : `Upload complete: ${stats.updated} course entries updated`,
            stats: {
                processed: stats.processed,
                updated: stats.updated,
                courseNotFound: stats.courseNotFound,
                validationErrors: stats.validationErrors,
                totalErrors: stats.errors.length
            },
            errors: stats.errors.length > 0 ? stats.errors.slice(0, 50) : undefined, // Limit errors in response
            validateOnly
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper endpoint to test the structure
export async function GET() {
    return NextResponse.json({
        message: 'POST to this endpoint with JSON body containing prerequisites and/or postrequisites',
        expectedFormat: {
            prerequisites: {
                "ACCT 2101": [],
                "ACCT 2102": ["and", {"id": "ACCT 2101", "grade": "D"}],
                "AE 1601": ["or", {"id": "MATH 1501", "grade": "C"}, {"id": "MATH 1511", "grade": "C"}]
            },
            postrequisites: {
                "MATH 1501": ["AE 1601", "CS 1371"],
                "ACCT 2101": ["ACCT 2102"]
            }
        }
    });
}