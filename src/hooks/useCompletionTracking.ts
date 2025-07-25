import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';


export const useCompletionTracking = () => {
  const { user } = useAuth();
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load completion data from database
  const loadCompletionData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('completed_courses, completed_groups')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('Error loading completion data:', userError);
        if (userError.message?.includes('column') || userError.message?.includes('does not exist')) {
          console.warn('Database schema missing columns. Using empty completion data.');
          setCompletedCourses(new Set());
          setCompletedGroups(new Set());
        } else {
          setError('Failed to load completion data');
        }
      } else if (userData) {
        const courses = userData.completed_courses || [];
        const groups = userData.completed_groups || [];
        
        setCompletedCourses(new Set(Array.isArray(courses) ? courses : []));
        setCompletedGroups(new Set(Array.isArray(groups) ? groups : []));
        
        console.log('✅ Loaded completion data:', {
          courses: courses.length,
          groups: groups.length
        });
      }
    } catch (dbError) {
      console.error('Database error loading completion data:', dbError);
      setError('Database connection failed');
      setCompletedCourses(new Set());
      setCompletedGroups(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle course completion
  const toggleCourseCompletion = useCallback(async (courseCode: string) => {
    if (!user) return;

    const newCompletedCourses = new Set(completedCourses);
    const wasCompleted = newCompletedCourses.has(courseCode);
    
    if (wasCompleted) {
      newCompletedCourses.delete(courseCode);
      console.log(`❌ Removed course: ${courseCode}`);
    } else {
      newCompletedCourses.add(courseCode);
      console.log(`✅ Added course: ${courseCode}`);
    }
    
    setCompletedCourses(newCompletedCourses);

    // Save to database
    try {
      const { error } = await supabase
        .from('users')
        .update({ completed_courses: Array.from(newCompletedCourses) })
        .eq('auth_id', user.id);
        
      if (error) {
        console.error('Error saving completed courses:', error);
        // Revert on error
        setCompletedCourses(completedCourses);
      } else {
        console.log('💾 Saved completed courses to database');
      }
    } catch (error) {
      console.error('Error saving completed courses:', error);
      // Revert on error
      setCompletedCourses(completedCourses);
    }
  }, [user, completedCourses]);

  // Set group completion (for automatic group satisfaction)
  const setGroupCompletion = useCallback(async (groupId: string, isSatisfied: boolean) => {
    if (!user) return;

    const newCompletedGroups = new Set(completedGroups);
    const wasCompleted = newCompletedGroups.has(groupId);
    
    if (isSatisfied && !wasCompleted) {
      newCompletedGroups.add(groupId);
      console.log(`✅ Group satisfied: ${groupId}`);
    } else if (!isSatisfied && wasCompleted) {
      newCompletedGroups.delete(groupId);
      console.log(`❌ Group unsatisfied: ${groupId}`);
    } else {
      return; // No change needed
    }
    
    setCompletedGroups(newCompletedGroups);

    // Save to database
    try {
      const { error } = await supabase
        .from('users')
        .update({ completed_groups: Array.from(newCompletedGroups) })
        .eq('auth_id', user.id);
        
      if (error) {
        console.error('Error saving completed groups:', error);
        // Revert on error
        setCompletedGroups(completedGroups);
      } else {
        console.log('💾 Saved completed groups to database');
      }
    } catch (error) {
      console.error('Error saving completed groups:', error);
      // Revert on error
      setCompletedGroups(completedGroups);
    }
  }, [user, completedGroups]);

  // Auto-fill completed courses when major changes (preserve cross-major completions)
  const preserveCompletionsOnMajorChange = useCallback(async (newMajor: string, oldMajor?: string) => {
    if (!user) return;
    
    try {
      // Load existing completion data to ensure we preserve it
      await loadCompletionData();
      
      console.log(`🔄 Major changed from "${oldMajor}" to "${newMajor}". Completed courses preserved.`);
      console.log(`✅ Preserved ${completedCourses.size} completed courses and ${completedGroups.size} completed groups`);
      
      // The completed courses and groups remain in the database
      // They will automatically apply to requirements in the new major if applicable
      // This ensures persistence across major changes as requested
      
      return {
        preservedCourses: Array.from(completedCourses),
        preservedGroups: Array.from(completedGroups)
      };
    } catch (error) {
      console.error('Error preserving completions on major change:', error);
      return {
        preservedCourses: [],
        preservedGroups: []
      };
    }
  }, [user, completedCourses, completedGroups, loadCompletionData]);

  // Load data on mount and user change
  useEffect(() => {
    loadCompletionData();
  }, [loadCompletionData]);

  return {
    completedCourses,
    completedGroups,
    isLoading,
    error,
    toggleCourseCompletion,
    setGroupCompletion,
    preserveCompletionsOnMajorChange,
    reloadCompletionData: loadCompletionData,
  };
};