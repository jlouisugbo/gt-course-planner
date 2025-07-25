// API Routes for deadline management

// /api/deadlines/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is a placeholder API route
    // In a real implementation, you would fetch from your database
    const deadlines = [
      {
        id: 1,
        title: "Registration Deadline",
        description: "Fall semester registration closes",
        due_date: "2024-08-15",
        type: "registration",
        category: "academic",
        is_active: true
      }
    ];

    return NextResponse.json(deadlines);
  } catch (err) {
    console.error('Error fetching deadlines:', err);
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deadline = await request.json();
    
    // This is a placeholder - in real implementation, save to database
    const result = {
      id: Date.now(),
      ...deadline,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('Error creating deadline:', err);
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 });
  }
}