// Minimal error handler stub for compatibility
import { NextResponse } from 'next/server';

export function createSecureErrorHandler(route: string, method: string, userId?: string) {
  return {
    handleError: (error: any, message?: string) => {
      console.error(`[${route}] ${method} error:`, error);
      return NextResponse.json(
        { error: message || 'An error occurred' },
        { status: 500 }
      );
    },
    logAcademicAccess: (action: string, resource: string) => {
      // Stub for FERPA compliance logging
      console.log(`[FERPA] ${action} on ${resource} by user ${userId}`);
    },
  };
}

export function handleApiError(error: any, message: string) {
  console.error('API error:', error);
  return NextResponse.json(
    { error: message || 'An error occurred' },
    { status: 500 }
  );
}
