// API Routes for deadline management

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY FIX: Authenticate user before accessing GT academic deadlines
  const { user, error: authError } = await authenticateRequest(request);
  
  if (!user || authError) {
    console.error('Unauthorized access attempt to /api/deadlines:', authError);
    return NextResponse.json(
      { error: 'Authentication required to access GT academic deadlines' }, 
      { status: 401 }
    );
  }
  try {
    const { data: deadlines, error } = await supabaseAdmin
      .from('deadlines')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
    }

    return NextResponse.json(deadlines || []);
  } catch (err) {
    console.error('Error fetching deadlines:', err);
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY FIX: Authenticate user before creating deadlines
  const { user, error: authError } = await authenticateRequest(request);
  
  if (!user || authError) {
    console.error('Unauthorized access attempt to POST /api/deadlines:', authError);
    return NextResponse.json(
      { error: 'Authentication required to create GT deadlines' }, 
      { status: 401 }
    );
  }
  try {
    const deadline = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('deadlines')
      .insert([{
        title: deadline.title,
        description: deadline.description,
        date: deadline.date,
        type: deadline.type,
        category: deadline.category,
        is_active: deadline.is_active ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error creating deadline:', err);
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 });
  }
}