// Minimal database security stub for compatibility
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export function validateQuery(query: any): boolean {
  // Basic validation - in production this would be more sophisticated
  return true;
}

export function sanitizeInput(input: string): string {
  // Basic sanitization
  return input.replace(/[<>'"&;]/g, '');
}

export function validateIdArray(ids: any[]): number[] {
  return ids.filter(id => typeof id === 'number' && !isNaN(id));
}

export async function safeSearchCourses(
  query: string,
  options: {
    limit?: number;
    searchType?: 'code' | 'title' | 'description';
    excludeIds?: number[];
  } = {}
): Promise<any[]> {
  const { limit = 50, searchType = 'code', excludeIds = [] } = options;
  const sanitized = sanitizeInput(query);

  let dbQuery = supabaseAdmin()
    .from('courses')
    .select('*')
    .limit(limit);

  if (excludeIds.length > 0) {
    dbQuery = dbQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  if (searchType === 'code') {
    dbQuery = dbQuery.ilike('code', `%${sanitized}%`);
  } else if (searchType === 'title') {
    dbQuery = dbQuery.ilike('title', `%${sanitized}%`);
  } else if (searchType === 'description') {
    dbQuery = dbQuery.ilike('description', `%${sanitized}%`);
  }

  const { data } = await dbQuery;
  return data || [];
}

export async function safeGetUserProfile(authId: string): Promise<any> {
  const { data } = await supabaseAdmin()
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();
  return data;
}

export async function safeUpdateUserProfile(authId: string, updates: any): Promise<any> {
  const { data } = await supabaseAdmin()
    .from('users')
    .update(updates)
    .eq('auth_id', authId)
    .select()
    .single();
  return data;
}
