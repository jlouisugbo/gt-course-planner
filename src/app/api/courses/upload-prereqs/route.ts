import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface PrereqData {
    [courseCode: string]: any[]; // JSON structure as provided
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prerequisites, postrequisites }: { 
            prerequisites?: PrereqData, 
            postrequisites?: PrereqData 
        } = body;

        if (!prerequisites && !postrequisites) {
            return NextResponse.json({ 
                error: 'Either prerequisites or postrequisites data is required' 
            }, { status: 400 });
        }

        let updatedCount = 0;
        let errors: string[] = [];

        // Update prerequisites
        if (prerequisites) {
            console.log(`Processing ${Object.keys(prerequisites).length} prerequisite entries...`);
            
            for (const [courseCode, prereqData] of Object.entries(prerequisites)) {
                try {
                    const { error } = await supabaseAdmin
                        .from('courses')
                        .update({ 
                            prerequisites: JSON.stringify(prereqData) 
                        })
                        .eq('code', courseCode);

                    if (error) {
                        errors.push(`Failed to update prerequisites for ${courseCode}: ${error.message}`);
                    } else {
                        updatedCount++;
                    }
                } catch (err) {
                    errors.push(`Error processing ${courseCode}: ${err}`);
                }
            }
        }

        // Update postrequisites
        if (postrequisites) {
            console.log(`Processing ${Object.keys(postrequisites).length} postrequisite entries...`);
            
            for (const [courseCode, postreqData] of Object.entries(postrequisites)) {
                try {
                    const { error } = await supabaseAdmin
                        .from('courses')
                        .update({ 
                            postrequisites: JSON.stringify(postreqData) 
                        })
                        .eq('code', courseCode);

                    if (error) {
                        errors.push(`Failed to update postrequisites for ${courseCode}: ${error.message}`);
                    } else {
                        updatedCount++;
                    }
                } catch (err) {
                    errors.push(`Error processing ${courseCode}: ${err}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${updatedCount} course entries`,
            updatedCount,
            errors: errors.length > 0 ? errors : undefined
        });

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