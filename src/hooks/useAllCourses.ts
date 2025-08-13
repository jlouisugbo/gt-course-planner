import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Course } from '@/types/courses';

interface CourseFilters {
    search?: string;
    subject?: string;
}

interface UseAllCoursesResult {
    courses: Course[];
    filteredCourses: Course[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refetch: () => void;
    totalCount: number;
}

// Global cache to prevent unnecessary API calls
const coursesCache = new Map<string, {
    data: Course[];
    timestamp: number;
    count: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 500;

export const useAllCourses = (filters: CourseFilters = {}): UseAllCoursesResult => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingRef = useRef(false);

    // Memoized cache key
    const cacheKey = useMemo(() => {
        return `all-courses-${JSON.stringify(filters)}`;
    }, [filters]);

    // Check if we have valid cached data
    const getCachedData = useCallback(() => {
        const cached = coursesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached;
        }
        return null;
    }, [cacheKey]);

    // Fetch courses function with batching
    const fetchCourses = useCallback(async (offset = 0, append = false) => {
        if (loadingRef.current) return;
        
        // Check cache first for initial load
        if (offset === 0 && !append) {
            const cached = getCachedData();
            if (cached) {
                setAllCourses(cached.data);
                setTotalCount(cached.count);
                setIsLoading(false);
                setHasMore(cached.data.length < cached.count);
                return;
            }
        }

        loadingRef.current = true;
        if (!append) setIsLoading(true);
        setError(null);

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const params = new URLSearchParams({
                limit: BATCH_SIZE.toString(),
                offset: offset.toString(),
            });

            if (filters.search) params.set('search', filters.search);
            if (filters.subject) params.set('subject', filters.subject);

            const response = await fetch(`/api/courses/all?${params}`, {
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (append) {
                setAllCourses(prev => {
                    const newCourses = [...prev, ...result.data];
                    // Cache the full dataset
                    coursesCache.set(cacheKey, {
                        data: newCourses,
                        timestamp: Date.now(),
                        count: result.count || newCourses.length
                    });
                    return newCourses;
                });
            } else {
                setAllCourses(result.data);
                setTotalCount(result.count || result.data.length);
                // Cache initial data
                coursesCache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now(),
                    count: result.count || result.data.length
                });
            }
            
            setHasMore(result.hasMore || false);

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching courses:', err);
                setError('Failed to load courses. Please try again.');
            }
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [getCachedData, cacheKey, filters.search, filters.subject]);

    // Load more courses
    const loadMore = useCallback(() => {
        if (!hasMore || loadingRef.current) return;
        fetchCourses(allCourses.length, true);
    }, [hasMore, allCourses.length, fetchCourses]);

    // Refetch all courses (bypass cache)
    const refetch = useCallback(() => {
        coursesCache.delete(cacheKey);
        setAllCourses([]);
        setHasMore(true);
        fetchCourses(0, false);
    }, [cacheKey, fetchCourses]);

    // Memoized filtered courses for performance
    const filteredCourses = useMemo(() => {
        if (!filters.search && !filters.subject) {
            return allCourses;
        }

        return allCourses.filter(course => {
            let matches = true;

            if (filters.search) {
                const searchUpper = filters.search.toUpperCase();
                // Only match course codes, not titles or descriptions
                matches = matches && course.code.toUpperCase().includes(searchUpper);
            }

            if (filters.subject) {
                matches = matches && course.code.startsWith(filters.subject.toUpperCase());
            }

            return matches;
        });
    }, [allCourses, filters.search, filters.subject]);

    // Initial fetch
    useEffect(() => {
        fetchCourses(0, false);
        
        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchCourses, filters.search, filters.subject]); // Only refetch when filters actually change

    return {
        courses: allCourses,
        filteredCourses,
        isLoading,
        error,
        hasMore,
        loadMore,
        refetch,
        totalCount,
    };
};