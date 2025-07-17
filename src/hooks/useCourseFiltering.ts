import { useMemo } from 'react';
import { useCoursesPaginated } from '@/data/courses';

interface UseCourseFilteringProps {
  searchQuery: string;
  selectedFilters: string[];
  sortBy: 'code' | 'difficulty' | 'credits' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

export const useCourseFiltering = ({
  searchQuery,
  selectedFilters,
  sortBy,
  sortOrder,
}: UseCourseFilteringProps) => {
  const { 
    data: coursesResponse, 
    isLoading, 
    error 
  } = useCoursesPaginated(
    { 
      search: searchQuery || undefined,
    },
    { 
      page: 1, 
      limit: 50 
    }
  );

  const filteredCourses = useMemo(() => {
    if (!coursesResponse?.data) return [];
    
    let courses = coursesResponse.data;

    if (selectedFilters.length > 0) {
      courses = courses.filter(course => {
        return selectedFilters.some(filter => {
          switch (filter) {
            case 'CS Core':
              return ['CS 1301', 'CS 1331', 'CS 1332', 'CS 2110', 'CS 2340', 'CS 3510'].includes(course.code);
            case 'Math':
              return course.code.startsWith('MATH');
            case 'Science':
              return course.code.startsWith('PHYS') || course.code.startsWith('CHEM') || course.code.startsWith('BIOL');
            case 'Intelligence Thread':
              return course.threads?.includes('Intelligence');
            case 'Systems Thread':
              return course.threads?.includes('Systems & Architecture');
            case 'Fall Offerings':
              return course.offerings?.fall;
            case 'Spring Offerings':
              return course.offerings?.spring;
            case 'Summer Offerings':
              return course.offerings?.summer;
            case 'Easy (1-2)':
              return course.difficulty <= 2;
            case 'Medium (3)':
              return course.difficulty === 3;
            case 'Hard (4-5)':
              return course.difficulty >= 4;
            default:
              return false;
          }
        });
      });
    }

    // Apply client-side sorting (for sorts not supported by backend)
    courses = [...courses].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'difficulty':
          comparison = (a.difficulty || 3) - (b.difficulty || 3);
          break;
        case 'credits':
          comparison = a.credits - b.credits;
          break;
        case 'popularity':
          // Mock popularity calculation since we don't have this data
          const aPopularity = (a.threads?.length || 0) + (5 - (a.difficulty || 3));
          const bPopularity = (b.threads?.length || 0) + (5 - (b.difficulty || 3));
          comparison = bPopularity - aPopularity;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return courses;
  }, [coursesResponse?.data, selectedFilters, sortBy, sortOrder]);

  return {
    courses: filteredCourses,
    isLoading,
    error,
    total: coursesResponse?.total || 0,
  };
};