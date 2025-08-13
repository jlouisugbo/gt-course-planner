import { NextResponse } from 'next/server';

/**
 * Health check endpoint for network error detection
 * Used by client-side error handling to determine if network issues exist
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'gt-course-planner'
  });
}

export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
}