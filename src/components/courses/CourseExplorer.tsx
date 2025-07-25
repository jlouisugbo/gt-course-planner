"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Download, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Course } from '@/types/courses';
import { CourseExplorerHeader } from './parts/CourseExplorerHeader';
import { CourseSearchFilters } from './parts/CourseSearchFilters';
import { CourseGrid } from './parts/CourseGrid';
import { CourseList } from './parts/CourseList';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { useCoursesPaginated } from '@/data/courses';
import { useAllCourses } from '@/hooks/useAllCourses';
import { useCompletionTracking } from '@/hooks/useCompletionTracking';

const CourseExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'code' | 'difficulty' | 'credits' | 'popularity'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());
  const [seeBookmarks, setSeeBookmarks] = useState<boolean>(false);
  const [addToPlan, setAddToPlan] = useState<boolean>(false);
  const [animate, setAnimate] = useState<boolean>(true);
  const [plannedSemester, setPlannedSemester] = useState<any>(null);
  
  const { semesters, addCourseToSemester } = usePlannerStore();
  const { completedCourses, toggleCourseCompletion } = useCompletionTracking();
  const semesterArray = Object.values(semesters || {});

  // Use optimized all courses hook
  const { 
    courses: allCoursesData,
    filteredCourses,
    isLoading,
    error,
    hasMore,
    loadMore,
    totalCount
  } = useAllCourses({
    search: searchQuery || undefined
  });

  // Use courses directly from the optimized hook
  const baseCourses = searchQuery ? filteredCourses : allCoursesData;

  // Use the courses directly from the API hook
  let courses = baseCourses;

  // Apply filters
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
            return course.threads.includes('Intelligence');
          case 'Systems Thread':
            return course.threads.includes('Systems & Architecture');
          case 'Fall Offerings':
            return course.offerings.fall;
          case 'Spring Offerings':
            return course.offerings.spring;
          case 'Summer Offerings':
            return course.offerings.summer;
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

  // Apply sorting
  courses = [...courses].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'code':
        comparison = a.code.localeCompare(b.code);
        break;
      case 'difficulty':
        comparison = a.difficulty - b.difficulty;
        break;
      case 'credits':
        comparison = a.credits - b.credits;
        break;
      case 'popularity':
        // Mock popularity based on course level and threads
        const aPopularity = a.threads.length + (5 - a.difficulty);
        const bPopularity = b.threads.length + (5 - b.difficulty);
        comparison = bPopularity - aPopularity;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Apply bookmark filtering
  let displayCourses = courses;
  if (seeBookmarks) {
    displayCourses = courses.filter(course => 
      bookmarkedCourses.has(String(course.id))
    );
  }

  //UseEffect to only animate course cards on first render or on viewMode change
  useEffect(() => {
    setTimeout(() => setAnimate(false), 1250)
    setAnimate(true)
  }, [viewMode])

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
    setSeeBookmarks(false);
  };

  const handleAddToPlan = (course: Course) => {
    setSelectedCourse(course);
    setAddToPlan(true);
  };

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course);
    setAddToPlan(false);
  };

  const confirmAddToPlan = (course: Course) => {
    if (plannedSemester != null && addCourseToSemester) {
      const plannedCourse = {
        ...course,
        semesterId: plannedSemester.id,
        status: 'planned' as const,
        year: plannedSemester.year,
        season: plannedSemester.season,
        grade: null,
      };
      addCourseToSemester(plannedCourse);
    }
    setAddToPlan(false);
    setSelectedCourse(null);
  };

  // Enhanced course card modal component (from old version)
  const CourseModal = ({ course }: { course: Course }) => (
    <div 
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50' 
      onClick={() => {
        setSelectedCourse(null); 
        setAddToPlan(false);
        setPlannedSemester(null);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Course header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-[#003057]">{course.code}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 cursor-pointer`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(String(course.id));
                  }}
                >
                  <Bookmark 
                    className={`h-5 w-5 ${
                      bookmarkedCourses.has(String(course.id)) 
                        ? "fill-[#B3A369] text-[#B3A369]" 
                        : "text-slate-400"
                    }`} 
                  />
                </Button>
              </div>
              <h2 className="text-xl font-medium text-slate-700 mb-4">{course.title}</h2>
            </div>
          </div>

          {/* Course details */}
          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed">{course.description}</p>
            
            {/* Course info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="text-sm text-slate-500">Credits</div>
                <div className="text-xl font-semibold text-[#003057]">{course.credits}</div>
              </Card>
              <Card className="text-center p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="text-sm text-slate-500">Difficulty</div>
                <div className="text-xl font-semibold text-[#003057]">{course.difficulty}/5</div>
              </Card>
              <Card className="text-center p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="text-sm text-slate-500">College</div>
                <div className="text-lg font-semibold text-[#003057]">{course.college}</div>
              </Card>
              <Card className="text-center p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                <div className="text-sm text-slate-500">Semesters</div>
                <div className="text-xl font-semibold text-[#003057]">
                  {[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length}
                </div>
              </Card>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => setAddToPlan(!addToPlan)} 
                className="bg-[#003057] hover:bg-[#002041] text-white flex-1 cursor-pointer"
              >
                Add to Plan
              </Button>
            </div>

            {/* Semester selection (enhanced from old version) */}
            {addToPlan && (
              <Card className="p-4 bg-slate-50">
                <h3 className="font-medium mb-3">Select Semester:</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {semesterArray.map(semester => (
                    <Button
                      key={semester.id}
                      variant={semester === plannedSemester ? "default" : "outline"}
                      onClick={() => setPlannedSemester(semester)}
                      className={`cursor-pointer hover:bg-[#B3A369]/85 ${semester === plannedSemester ? "bg-[#B3A369] border-2 border-[#003057]" : ""}`}
                    >
                      {semester.season} {semester.year}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => confirmAddToPlan(course)} 
                  className="bg-[#003057] hover:bg-[#002041] text-white w-full cursor-pointer"
                  disabled={!plannedSemester}
                >
                  Confirm Add to Plan
                </Button>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header with bookmarks button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <CourseExplorerHeader bookmarkedCount={bookmarkedCourses.size} />
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300 cursor-pointer hover:bg-gray-200/75">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-slate-300 cursor-pointer hover:bg-gray-200/75">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button 
            onClick={() => setSeeBookmarks(!seeBookmarks)} 
            className="bg-[#003057] hover:bg-[#002041] cursor-pointer text-white"
          >
            <Bookmark className={`h-4 w-4 mr-2 ${seeBookmarks && "fill-white"}`} />
            Bookmarks ({bookmarkedCourses.size})
          </Button>
        </div>
      </div>

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
        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-medium">{displayCourses.length}</span>
              {totalCount > displayCourses.length && (
                <span> of <span className="font-medium">{totalCount}</span></span>
              )} course{displayCourses.length !== 1 ? 's' : ''}
              {searchQuery && <span> matching "{searchQuery}"</span>}
              {selectedFilters.length > 0 && (
                <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
              )}
            </p>
            
            {hasMore && (
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <TrendingUp className="h-3 w-3" />
                <span>{totalCount - displayCourses.length} more available</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-red-600"
            >
              <h3 className="text-lg font-medium mb-2">Error loading courses</h3>
              <p className="text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </motion.div>
          )}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003057] mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Loading all courses...</h3>
              {totalCount > 0 && (
                <p className="text-sm text-slate-500">
                  {allCoursesData.length} of {totalCount} courses loaded
                </p>
              )}
              <p className="text-sm text-slate-500">
                {searchQuery ? 'Filtering results...' : 'Fetching course catalog...'}
              </p>
              <p className="text-slate-600">Fetching the latest course information</p>
            </motion.div>
          ) : displayCourses.length === 0 ? (
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
                className="border-slate-300 cursor-pointer hover:bg-gray-200/75"
              >
                Clear search and filters
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {viewMode === 'grid' ? (
                <CourseGrid
                  courses={displayCourses}
                  bookmarkedCourses={bookmarkedCourses}
                  toggleBookmark={toggleBookmark}
                  onViewDetails={handleViewDetails}
                  onAddToPlan={handleAddToPlan}
                  animate={animate}
                  completedCourses={completedCourses}
                  onToggleComplete={toggleCourseCompletion}
                />
              ) : (
                <CourseList
                  courses={displayCourses}
                  bookmarkedCourses={bookmarkedCourses}
                  toggleBookmark={toggleBookmark}
                  onViewDetails={handleViewDetails}
                  onAddToPlan={handleAddToPlan}
                  animate={animate}
                  completedCourses={completedCourses}
                  onToggleComplete={toggleCourseCompletion}
                />
              )}
              
              {/* Load More Button */}
              {hasMore && displayCourses.length > 0 && (
                <div className="text-center pt-6">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    className="bg-slate-50 hover:bg-slate-100 border-slate-200 px-8 py-3"
                  >
                    Load More Courses ({totalCount - allCoursesData.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Course Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <CourseModal course={selectedCourse} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseExplorer;