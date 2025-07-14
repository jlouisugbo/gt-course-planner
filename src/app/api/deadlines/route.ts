// API Routes for deadline management

// /api/deadlines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Adjust the import based on your setup

export async function GET() {
  try {
    // Option 1: From your database
    const deadlines = await db.query(`
      SELECT * FROM deadlines 
      WHERE is_active = true 
      ORDER BY due_date ASC
    `);

    // Option 2: From external JSON file
    // const response = await fetch('https://your-external-source.com/deadlines.json');
    // const deadlines = await response.json();

    // Option 3: From local JSON file
    // const fs = require('fs');
    // const deadlines = JSON.parse(fs.readFileSync('./data/deadlines.json', 'utf8'));

    return NextResponse.json(deadlines);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deadline = await request.json();
    
    // Insert into database
    const result = await db.query(`
      INSERT INTO deadlines (title, description, due_date, type, category, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      deadline.title,
      deadline.description,
      deadline.due_date,
      deadline.type,
      deadline.category,
      deadline.is_active
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 });
  }
}