"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course, CourseSearchFilters, CourseViewMode } from '@/types';
import { CourseSearchBar } from './parts/CourseSearchBar';
import { CourseFilters } from './parts/CourseFilters';
import { CourseGrid } from './parts/CourseGrid';
import { CourseList } from './parts/CourseList';
import { CourseModal } from './parts/CourseModal';
import { authService } from '@/lib/auth';
import { useEffect } from 'react';
import { fetchAllCourses } from '@/data/courses';

function CourseExplorer() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Store all courses
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CourseSearchFilters>({
    query: '',
    colleges: [],
    creditHours: [],
    courseTypes: [],
    semesters: [],
    hasPrerequisites: null
  });

  // View mode state
  const [viewMode, setViewMode] = useState<CourseViewMode>({
    type: 'grid',
    sortBy: 'code',
    sortOrder: 'asc'
  });

  // Load all courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First try to load from database
        const coursesData = await fetchAllCourses();
        setAllCourses(coursesData);
        setCourses(coursesData);
        
        // Extract unique colleges for filters
        const colleges = [...new Set(coursesData?.map((c: Course) => c.college).filter(Boolean))];
        setAvailableColleges(colleges.filter((college): college is string => typeof college === 'string'));
      } catch (err) {
        console.error('Error loading courses:', err);
        
        // Fallback to API if database fails
        try {
          const response = await fetch('/api/courses/all?limit=2000');
          if (!response.ok) {
            throw new Error('Failed to load courses from API');
          }
          
          const data = await response.json();
          const coursesData = data.data || [];
          setAllCourses(coursesData);
          setCourses(coursesData);
          
          // Extract unique colleges for filters
          const colleges = [...new Set(coursesData?.map((c: Course) => c.college).filter(Boolean))];
          setAvailableColleges(colleges.filter((college): college is string => typeof college === 'string'));
        } catch (apiErr) {
          setError(apiErr instanceof Error ? apiErr.message : 'Failed to load courses');
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, []);

  // Search courses from pre-loaded data
  const searchCourses = useCallback((query: string) => {
    if (!query.trim()) {
      // Show all courses when search is empty
      setCourses(allCourses);
      return;
    }

    // Filter courses locally from pre-loaded data
    const searchLower = query.toLowerCase();
    const filtered = allCourses.filter(course => 
      course.code?.toLowerCase().includes(searchLower) ||
      course.title?.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower)
    );
    
    setCourses(filtered);
  }, [allCourses]);

  // Handle search bar events
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
    searchCourses(query);
  }, [searchCourses]);

  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Filter courses based on current filters
  const filteredCourses = useMemo(() => {
    if (courses.length === 0) return [];
    
    let filtered = courses;

    // Apply college filter
    if (filters.colleges.length > 0) {
      filtered = filtered.filter(course => 
        filters.colleges.includes(course.college || '')
      );
    }

    // Apply credit hours filter
    if (filters.creditHours.length > 0) {
      filtered = filtered.filter(course => 
        filters.creditHours.includes(course.credits || 3)
      );
    }

    // Apply course type filter
    if (filters.courseTypes.length > 0) {
      filtered = filtered.filter(course => 
        filters.courseTypes.includes(course.course_type || 'elective')
      );
    }

    // Apply semester filter
    if (filters.semesters.length > 0) {
      filtered = filtered.filter(course => {
        const offerings = course.offerings;
        return filters.semesters.some(semester => {
          switch (semester) {
            case 'Fall': return offerings?.fall;
            case 'Spring': return offerings?.spring;
            case 'Summer': return offerings?.summer;
            default: return false;
          }
        });
      });
    }

    // Apply prerequisites filter
    if (filters.hasPrerequisites !== null) {
      filtered = filtered.filter(course => {
        const hasPrereqs = course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0;
        return filters.hasPrerequisites ? hasPrereqs : !hasPrereqs;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (viewMode.sortBy) {
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'credits':
          comparison = (a.credits || 3) - (b.credits || 3);
          break;
        default:
          comparison = a.code.localeCompare(b.code);
      }
      return viewMode.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [courses, filters.colleges, filters.creditHours, filters.courseTypes, filters.semesters, filters.hasPrerequisites, viewMode.sortBy, viewMode.sortOrder]);

  const handleCourseClick = useCallback((course: Course) => {
    setSelectedCourse(course);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003057] mb-2">Course Explorer</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search and explore Georgia Tech courses across all colleges.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div role="group" aria-label="View mode selection" className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode.type === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(prev => ({ ...prev, type: 'grid' }))}
              className="px-3 py-2"
              aria-pressed={viewMode.type === 'grid'}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode.type === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode(prev => ({ ...prev, type: 'list' }))}
              className="px-3 py-2"
              aria-pressed={viewMode.type === 'list'}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="min-h-[44px]"
            aria-expanded={showFilters}
            aria-controls="course-filters"
            aria-label={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <CourseSearchBar
        value={searchQuery}
        onChange={handleQueryChange}
        onSearch={handleSearch}
        placeholder="Search courses by code, title, or keywords..."
        loading={loading}
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            id="course-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CourseFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableColleges={availableColleges}
              isLoading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <main>
        {error && (
          <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Error loading courses</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for courses</h3>
            <p className="text-gray-500">Enter a course code, title, or keyword to get started.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {filteredCourses.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div role="status" aria-live="polite" className="sr-only">
                {`Found ${filteredCourses.length} course${filteredCourses.length === 1 ? '' : 's'}`}
              </div>
              
              {viewMode.type === 'grid' ? (
                <CourseGrid
                  courses={filteredCourses}
                  onCourseClick={handleCourseClick}
                  loading={loading}
                />
              ) : (
                <CourseList
                  courses={filteredCourses}
                  onCourseClick={handleCourseClick}
                  loading={loading}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Course Modal */}
      <CourseModal
        course={selectedCourse}
        isOpen={!!selectedCourse}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default CourseExplorer;