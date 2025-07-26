"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Course } from '@/types/courses';

interface CoursesContextType {
  allCourses: Course[];
  isLoading: boolean;
  error: string | null;
  loadCourses: () => Promise<void>;
  filterCourses: (filters: CourseFilters) => Course[];
  searchCourses: (query: string, courses?: Course[]) => Course[];
  isLoaded: boolean;
}

interface CourseFilters {
  search?: string;
  difficulty?: string[];
  subjects?: string[];
  credits?: number[];
  offerings?: string[];
  types?: string[];
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

// In-memory cache with 10-minute expiry
let coursesCache: { data: Course[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useGlobalCourses = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useGlobalCourses must be used within CoursesProvider');
  }
  return context;
};

export const CoursesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load courses only when requested
  const loadCourses = useCallback(async () => {
    // Check cache first
    if (coursesCache && Date.now() - coursesCache.timestamp < CACHE_DURATION) {
      setAllCourses(coursesCache.data);
      setIsLoaded(true);
      return;
    }

    if (isLoading) return; // Prevent duplicate requests

    try {
      setIsLoading(true);
      setError(null);
      
      // Load smaller batches to prevent API overload
      const courses: Course[] = [];
      let offset = 0;
      const batchSize = 500; // Smaller batch size
      let hasMore = true;

      while (hasMore && offset < 2000) { // Limit to first 2000 courses to prevent overload
        const response = await fetch(`/api/courses/all?limit=${batchSize}&offset=${offset}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        courses.push(...result.data);
        
        hasMore = result.hasMore && result.data.length === batchSize;
        offset += batchSize;

        // Add small delay between requests to prevent overload
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Cache the results
      coursesCache = {
        data: courses,
        timestamp: Date.now()
      };

      console.log(`✅ Loaded ${courses.length} courses for filtering`);
      setAllCourses(courses);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Optimized search function
  const searchCourses = useCallback((query: string, courses: Course[] = allCourses): Course[] => {
    if (!query.trim()) return courses;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    return courses.filter(course => {
      const searchableText = [
        course.code,
        course.title,
        course.description || '',
        course.department || ''
      ].join(' ').toLowerCase();
      
      // All search terms must match
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [allCourses]);

  // Optimized filtering function
  const filterCourses = useCallback((filters: CourseFilters): Course[] => {
    let filtered = allCourses;

    // Apply search first (most selective)
    if (filters.search) {
      filtered = searchCourses(filters.search, filtered);
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      filtered = filtered.filter(course => {
        return filters.difficulty!.some(difficultyRange => {
          switch (difficultyRange) {
            case 'Easy (1-2)':
              return (course.difficulty || 3) <= 2;
            case 'Medium (3)':
              return (course.difficulty || 3) === 3;
            case 'Hard (4-5)':
              return (course.difficulty || 3) >= 4;
            default:
              return false;
          }
        });
      });
    }

    // Subject filter
    if (filters.subjects && filters.subjects.length > 0) {
      filtered = filtered.filter(course => {
        return filters.subjects!.some(subject => {
          switch (subject) {
            case 'CS Core':
              return ['CS 1301', 'CS 1331', 'CS 1332', 'CS 2110', 'CS 2340', 'CS 3510'].includes(course.code);
            case 'Math':
              return course.code.startsWith('MATH');
            case 'Science':
              return ['PHYS', 'CHEM', 'BIOL'].some(prefix => course.code.startsWith(prefix));
            default:
              return course.code.startsWith(subject.toUpperCase());
          }
        });
      });
    }

    // Credits filter
    if (filters.credits && filters.credits.length > 0) {
      filtered = filtered.filter(course => 
        filters.credits!.includes(course.credits)
      );
    }

    // Offerings filter
    if (filters.offerings && filters.offerings.length > 0) {
      filtered = filtered.filter(course => {
        return filters.offerings!.some(offering => {
          switch (offering) {
            case 'Fall Offerings':
              return course.offerings?.fall;
            case 'Spring Offerings':
              return course.offerings?.spring;
            case 'Summer Offerings':
              return course.offerings?.summer;
            default:
              return false;
          }
        });
      });
    }

    // Course type filter
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(course => 
        filters.types!.includes(course.type)
      );
    }

    return filtered;
  }, [allCourses, searchCourses]);

  const value: CoursesContextType = {
    allCourses,
    isLoading,
    error,
    loadCourses,
    filterCourses,
    searchCourses,
    isLoaded,
  };

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
};