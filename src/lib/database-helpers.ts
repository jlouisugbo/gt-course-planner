import { supabase } from './supabaseClient';
import { Course, College, DegreeProgram } from '@/types/types';

export async function getColleges(): Promise<College[]> {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching colleges:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getColleges:', error);
    return [];
  }
}

export async function getDegreePrograms(): Promise<DegreeProgram[]> {
  try {
    const { data, error } = await supabase
      .from('degree_programs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching degree_programs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDegreePrograms:', error);
    return [];
  }
}

export async function getCoursesByCollegeIds(
  collegeIds: number[], 
): Promise<Course[]> {
  try {
    const query = supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .in('college_id', collegeIds)
      .limit(50);

    const { data, error } = await query.order('code');

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return (data || []).map(course => ({
      ...course,
      prerequisite_courses: Array.isArray(course.prerequisite_courses)
        ? course.prerequisite_courses
        : [],
    }));
  } catch (error) {
    console.error('Error in getCoursesByCollegeIds:', error);
    return [];
  }
}

export async function findCollegeIdsByProgram(programName: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('degree_programs')
      .select('college_id')
      .ilike('name', `%${programName.replace('-', ' ')}%`)
      .eq('is_active', true);

    if (error) {
      console.error('Error finding college IDs:', error);
      return [];
    }

    return data?.map(program => program.college_id) || [];
  } catch (error) {
    console.error('Error in findCollegeIdsByProgram:', error);
    return [];
  }
}

export async function validateDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('colleges')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Database connection validation failed:', error);
    return false;
  }
}