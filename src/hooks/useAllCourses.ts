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

// Global request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export const useAllCourses = (filters: CourseFilters = {}): UseAllCoursesResult => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadingRef = useRef(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

            const requestUrl = `/api/courses/all?${params}`;
            const requestKey = `${requestUrl}-${append ? 'append' : 'initial'}`;
            
            console.log(`🌐 Fetching courses: ${requestUrl} (${append ? 'append' : 'initial'})`);

            // Check for duplicate requests
            if (pendingRequests.has(requestKey)) {
                console.log(`⚠️ Duplicate request detected, using existing promise: ${requestKey}`);
                const result = await pendingRequests.get(requestKey);
                return result;
            }

            // Make the request and store the promise
            const requestPromise = fetch(requestUrl, {
                signal: abortControllerRef.current.signal,
            });
            
            pendingRequests.set(requestKey, requestPromise);
            
            const response = await requestPromise;
            
            // Clean up the pending request
            pendingRequests.delete(requestKey);

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
            // Clean up pending request on error
            const params = new URLSearchParams({
                limit: BATCH_SIZE.toString(),
                offset: offset.toString(),
            });
            if (filters.search) params.set('search', filters.search);
            if (filters.subject) params.set('subject', filters.subject);
            const requestKey = `/api/courses/all?${params}-${append ? 'append' : 'initial'}`;
            pendingRequests.delete(requestKey);
            
            if (err.name !== 'AbortError') {
                console.error('Error fetching courses:', err);
                setError('Failed to load courses. Please try again.');
            }
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [getCachedData, cacheKey]);

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

    // Initial fetch with debouncing for search
    useEffect(() => {
        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        
        // Cancel current request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Debounce search requests (300ms delay)
        const delay = filters.search ? 300 : 0;
        
        debounceTimeoutRef.current = setTimeout(() => {
            console.log(`🔍 useAllCourses effect triggered with filters:`, filters);
            
            // Reset state when filters change
            setAllCourses([]);
            setHasMore(true);
            setTotalCount(0);
            
            fetchCourses(0, false);
        }, delay);
        
        // Cleanup on unmount
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [filters.search, filters.subject]); // Only refetch when filters actually change

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