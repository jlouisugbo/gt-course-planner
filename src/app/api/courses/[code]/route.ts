/**
 * API Route: GET /api/courses/[code]
 * Fetches a single course by code with college information
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { handleApiError } from '@/lib/errorHandlingUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query the course details with college join
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        code,
        title,
        credits,
        description,
        prerequisites,
        course_type,
        college_id,
        is_active,
        colleges!college_id(name)
      `)
      .eq('code', code)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!courseData) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(courseData);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch course details');
  }
}
