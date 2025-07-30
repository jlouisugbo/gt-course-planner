"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Download, Share2, Bookmark, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Course } from '@/types/courses';
import { CourseExplorerHeader } from './parts/CourseExplorerHeader';
import { CourseSearchFilters } from './parts/CourseSearchFilters';
import { CourseGrid } from './parts/CourseGrid';
import { CourseList } from './parts/CourseList';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { useCompletionTracking } from '@/hooks/useCompletionTracking';
import { useCoursePaginatedSearch } from '@/hooks/useCoursePaginatedSearch';
import { useRequirementCourses } from '@/hooks/useRequirementCourses';

const CourseExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Memoize the search query setter to prevent unnecessary re-renders
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
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
  const { courses, isLoading, error, hasSearched, searchInfo, searchCourses, clearSearch } = useCoursePaginatedSearch();
  const { 
    courses: requirementCourses, 
    isLoading: isLoadingRequirement,
    error: requirementError,
    requirementInfo,
    fetchRequirementCourses,
    clearRequirementCourses
  } = useRequirementCourses();
  const semesterArray = Object.values(semesters || {});

  // Handle search on Enter key
  const handleSearchSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim();
      if (query) {
        searchCourses(query);
        clearRequirementCourses(); // Clear requirement courses when searching
      } else {
        clearSearch();
      }
    }
  }, [searchQuery, searchCourses, clearSearch, clearRequirementCourses]);

  // Handle requirement filter clicks
  const handleRequirementFilter = useCallback(async (requirementName: string) => {
    clearSearch(); // Clear search results
    setSearchQuery(''); // Clear search query
    await fetchRequirementCourses(requirementName);
  }, [clearSearch, fetchRequirementCourses]);

  // Apply client-side filtering and sorting to search results
  const processedCourses = useMemo(() => {
    // Use requirement courses if they exist, otherwise use search courses
    const sourceCourses = requirementCourses.length > 0 ? requirementCourses : courses;
    let filtered = [...sourceCourses];

    // Apply filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(course => {
        // Difficulty filter
        const difficultyFilters = selectedFilters.filter(f => ['Easy (1-2)', 'Medium (3)', 'Hard (4-5)'].includes(f));
        if (difficultyFilters.length > 0) {
          const matchesDifficulty = difficultyFilters.some(filter => {
            switch (filter) {
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
          if (!matchesDifficulty) return false;
        }

        // Credits filter
        const creditsFilters = selectedFilters.filter(f => /^\d+ Credit/.test(f));
        if (creditsFilters.length > 0) {
          const matchesCredits = creditsFilters.some(filter => {
            const credits = course.credits;
            switch (filter) {
              case '1 Credit':
                return credits === 1;
              case '2 Credits':
                return credits === 2;
              case '3 Credits':
                return credits === 3;
              case '4 Credits':
                return credits === 4;
              case '5+ Credits':
                return credits >= 5;
              default:
                return false;
            }
          });
          if (!matchesCredits) return false;
        }

        // Offerings filter
        const offeringsFilters = selectedFilters.filter(f => f.includes('Offerings') || f === 'All Semesters');
        if (offeringsFilters.length > 0) {
          const matchesOfferings = offeringsFilters.some(filter => {
            switch (filter) {
              case 'Fall Offerings':
                return course.offerings?.fall;
              case 'Spring Offerings':
                return course.offerings?.spring;
              case 'Summer Offerings':
                return course.offerings?.summer;
              case 'All Semesters':
                return course.offerings?.fall && course.offerings?.spring && course.offerings?.summer;
              default:
                return false;
            }
          });
          if (!matchesOfferings) return false;
        }

        // Subject filter
        const subjectFilters = selectedFilters.filter(f => 
          ['CS', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'ECE', 'ME', 'AE', 'CEE', 'MSE', 'ISYE'].includes(f)
        );
        if (subjectFilters.length > 0) {
          const matchesSubject = subjectFilters.some(subject => 
            course.code.startsWith(subject)
          );
          if (!matchesSubject) return false;
        }

        // Level filter
        const levelFilters = selectedFilters.filter(f => f.includes('-Level'));
        if (levelFilters.length > 0) {
          const courseNumber = parseInt(course.code.split(' ')[1] || '0');
          const matchesLevel = levelFilters.some(filter => {
            switch (filter) {
              case '1000-Level':
                return courseNumber >= 1000 && courseNumber < 2000;
              case '2000-Level':
                return courseNumber >= 2000 && courseNumber < 3000;
              case '3000-Level':
                return courseNumber >= 3000 && courseNumber < 4000;
              case '4000-Level':
                return courseNumber >= 4000 && courseNumber < 6000;
              case '6000+ Level':
                return courseNumber >= 6000;
              default:
                return false;
            }
          });
          if (!matchesLevel) return false;
        }

        // Requirements filter
        const reqFilters = selectedFilters.filter(f => 
          ['Has Prerequisites', 'No Prerequisites', 'Lab Component', 'Core Course'].includes(f)
        );
        if (reqFilters.length > 0) {
          const matchesReq = reqFilters.some(filter => {
            switch (filter) {
              case 'Has Prerequisites':
                return course.prerequisites && course.prerequisites.length > 0;
              case 'No Prerequisites':
                return !course.prerequisites || course.prerequisites.length === 0;
              case 'Lab Component':
                return course.type === 'lab' || course.title.toLowerCase().includes('lab');
              case 'Core Course':
                return ['CS 1301', 'CS 1331', 'CS 1332', 'CS 2110', 'CS 2340', 'CS 3510'].includes(course.code);
              default:
                return false;
            }
          });
          if (!matchesReq) return false;
        }

        return true;
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
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
          // Mock popularity calculation
          const aPopularity = (a.prerequisites?.length || 0) + (5 - (a.difficulty || 3));
          const bPopularity = (b.prerequisites?.length || 0) + (5 - (b.difficulty || 3));
          comparison = bPopularity - aPopularity;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [courses, requirementCourses, selectedFilters, sortBy, sortOrder]);

  // Apply bookmark filtering
  let displayCourses = processedCourses;
  if (seeBookmarks) {
    displayCourses = processedCourses.filter(course => 
      bookmarkedCourses.has(String(course.id))
    );
  }

  //UseEffect to only animate course cards on first render or on viewMode change
  useEffect(() => {
    setTimeout(() => setAnimate(false), 1250)
    setAnimate(true)
  }, [viewMode])

  const toggleBookmark = useCallback((courseId: string) => {
    setBookmarkedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFilters([]);
    setSeeBookmarks(false);
    clearSearch();
    clearRequirementCourses();
  }, [clearSearch, clearRequirementCourses]);

  const handleAddToPlan = useCallback((course: Course) => {
    setSelectedCourse(course);
    setAddToPlan(true);
  }, []);

  const handleViewDetails = useCallback((course: Course) => {
    setSelectedCourse(course);
    setAddToPlan(false);
  }, []);

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
        setSearchQuery={handleSearchQueryChange}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isLoading || isLoadingRequirement}
        onRequirementFilter={handleRequirementFilter}
      />

      {/* Results Section */}
      <div>
        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {!hasSearched && !requirementInfo ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span>Enter a search term and press Enter to find courses</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>✨ Smart search with fallback logic</span>
                </div>
              </div>
            ) : requirementInfo ? (
              <div className="flex items-center space-x-4">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-medium">{displayCourses.length}</span> course{displayCourses.length !== 1 ? 's' : ''} for 
                  <span className="font-medium text-[#B3A369] ml-1">{requirementInfo.name}</span>
                  {selectedFilters.length > 0 && (
                    <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
                  )}
                </p>
                
                <div className="flex items-center space-x-2 text-xs text-[#B3A369]">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    📋 {requirementInfo.type}
                    {requirementInfo.isFlexible && requirementInfo.selectionCount > 0 
                      ? ` • Choose ${requirementInfo.selectionCount} courses`
                      : ''
                    }
                    {` • ${requirementInfo.minCredits} credits required`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-medium">{displayCourses.length}</span>
                  {searchInfo.total > displayCourses.length && (
                    <span> of <span className="font-medium">{searchInfo.total}</span></span>
                  )} course{displayCourses.length !== 1 ? 's' : ''}
                  {searchInfo.query && <span> matching &quot;{searchInfo.query}&quot;</span>}
                  {selectedFilters.length > 0 && (
                    <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
                  )}
                </p>
                
                {searchInfo.searchType && (
                  <div className="flex items-center space-x-2 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>📚 Searched: {searchInfo.searchType.replace(/\+/g, ' + ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {(error || requirementError) && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-red-600"
            >
              <h3 className="text-lg font-medium mb-2">Error loading courses</h3>
              <p className="text-sm mb-4">{error || requirementError}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </motion.div>
          )}
          {(isLoading || isLoadingRequirement) ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003057] mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Loading courses...</h3>
              <p className="text-sm text-slate-500">
                Preparing instant filtering experience
              </p>
              <p className="text-slate-600">This will only take a moment</p>
            </motion.div>
          ) : !hasSearched && !requirementInfo ? (
            <motion.div
              key="initial-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Search className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ready to search courses</h3>
              <p className="text-slate-600 mb-4">
                Type a course code (like &quot;MATH 15&quot; or &quot;CS&quot;), title, or topic and press Enter to search
              </p>
              <div className="text-sm text-slate-500 space-y-1">
                <p>💡 <strong>Smart search:</strong> Searches course codes first, then titles, then descriptions</p>
                <p>📚 <strong>Limited results:</strong> Shows up to 50 courses for better performance</p>
              </div>
            </motion.div>
          ) : displayCourses.length === 0 ? (
            <motion.div
              key="no-results-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-600 mb-4">
                {requirementInfo && requirementInfo.message ? requirementInfo.message :
                 requirementInfo ? `No courses found for requirement "${requirementInfo.name}"` : 
                 searchInfo.query ? `No courses match "${searchInfo.query}"` : 'No courses match your current filters'}
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
            <motion.div
              key="results-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
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
            </motion.div>
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