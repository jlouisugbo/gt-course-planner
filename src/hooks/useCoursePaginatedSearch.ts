import { useState, useCallback } from 'react';
import { Course } from '@/types/courses';
import { authService } from '@/lib/auth';

interface SearchResult {
  data: Course[];
  total: number;
  query: string;
  searchType: string;
}

interface UseCoursePaginatedSearchReturn {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  searchInfo: {
    query: string;
    total: number;
    searchType: string;
  };
  searchCourses: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useCoursePaginatedSearch = (): UseCoursePaginatedSearchReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchInfo, setSearchInfo] = useState({
    query: '',
    total: 0,
    searchType: ''
  });

  const clearSearch = useCallback(() => {
    setCourses([]);
    setError(null);
    setHasSearched(false);
    setSearchInfo({ query: '', total: 0, searchType: '' });
  }, []);

  const searchCourses = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Get session token for authentication
      const { data: sessionData } = await authService.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SearchResult = await response.json();
      
      setCourses(result.data);
      setSearchInfo({
        query: result.query,
        total: result.total,
        searchType: result.searchType
      });

      console.log(`✅ Search completed: ${result.total} results for "${result.query}" (${result.searchType})`);
      
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to search courses');
      setCourses([]);
      setSearchInfo({ query: '', total: 0, searchType: '' });
    } finally {
      setIsLoading(false);
    }
  }, [clearSearch]);

  return {
    courses,
    isLoading,
    error,
    hasSearched,
    searchInfo,
    searchCourses,
    clearSearch
  };
};