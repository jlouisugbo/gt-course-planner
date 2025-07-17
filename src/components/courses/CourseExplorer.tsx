"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CourseExplorerHeader } from './parts/CourseExplorerHeader';
import { CourseSearchFilters } from './parts/CourseSearchFilters';
import { CourseGrid } from './parts/CourseGrid';
import { CourseList } from './parts/CourseList';
import { useCourseFiltering } from '@/hooks/useCourseFiltering';

const CourseExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'code' | 'difficulty' | 'credits' | 'popularity'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());

  // Custom hook for filtering logic
  const { courses: filteredCourses, isLoading, error, total } = useCourseFiltering({
    searchQuery,
    selectedFilters,
    sortBy,
    sortOrder,
  });

  const toggleBookmark = (courseId: string) => {
    setBookmarkedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedFilters([]);
  };

  return (
    <div className="space-y-6">
      <CourseExplorerHeader bookmarkedCount={bookmarkedCourses.size} />

      <CourseSearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Results Section */}
      <div>
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
            Loading courses...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-500 py-8">
            <div className="mb-2">Error loading courses</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Results header - only show when not loading */}
        {!isLoading && !error && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium">{filteredCourses.length}</span> courses
                {total > 0 && <span> of {total} total</span>}
                {selectedFilters.length > 0 && (
                  <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
                )}
              </p>
              
              {filteredCourses.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>Avg difficulty: {(filteredCourses.reduce((sum, c) => sum + (c.difficulty || 3), 0) / filteredCourses.length).toFixed(1)}/5</span>
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoading && !error && filteredCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-600 mb-4">
                {searchQuery ? `No courses match "${searchQuery}"` : 'No courses match your current filters'}
              </p>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="border-slate-300"
              >
                Clear search and filters
              </Button>
            </motion.div>
          ) : !isLoading && !error && viewMode === 'grid' ? (
            <CourseGrid
              courses={filteredCourses}
              bookmarkedCourses={bookmarkedCourses}
              toggleBookmark={toggleBookmark}
            />
          ) : !isLoading && !error && (
            <CourseList
              courses={filteredCourses}
              bookmarkedCourses={bookmarkedCourses}
              toggleBookmark={toggleBookmark}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseExplorer;