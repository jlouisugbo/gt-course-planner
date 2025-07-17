"use client";

import React, { useState } from 'react';
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
  const [plannedSemester, setPlannedSemester] = useState<any>(null);
  
  const { semesters, addCourseToSemester } = usePlannerStore();
  const semesterArray = Object.values(semesters || {});

  // Fetch courses using the proper data service
  const { 
    data: coursesResponse, 
    isLoading, 
  } = useCoursesPaginated(
    { 
      search: searchQuery || undefined,
    },
    { 
      page: 1, 
      limit: 100 // Get more courses for client-side filtering
    }
  );

  // Transform database courses to match expected format
  const transformCourse = (dbCourse: any) => ({
    id: dbCourse.id || Math.random(),
    code: dbCourse.code || 'Unknown',
    title: dbCourse.title || 'No title available',
    credits: typeof dbCourse.credits === 'number' ? dbCourse.credits : 3,
    description: dbCourse.description || 'No description available',
    difficulty: Math.floor(Math.random() * 5) + 1, // Since difficulty isn't in DB, use random for demo
    college: 'College of Computing', // Default since not in current DB structure
    prerequisites: Array.isArray(dbCourse.prerequisite_courses) 
      ? dbCourse.prerequisite_courses.map((p: string) => ({ type: 'course', courses: [p], logic: 'AND' }))
      : [],
    corequisites: [],
    threads: [], // Would need to be determined based on course code/attributes
    attributes: Array.isArray(dbCourse.attributes) ? dbCourse.attributes : [],
    offerings: dbCourse.offerings || { fall: true, spring: true, summer: false },
  });

  // Get base courses from API
  const baseCourses = coursesResponse?.data?.map(transformCourse) || [];

  const fallbackCourses = [
    {
      id: 1,
      code: "CS 1301",
      title: "Intro to Computing",
      credits: 3,
      description: "Introduction to computing principles and programming practices with an emphasis on the design, construction and implementation of problem solutions use of software tools.",
      difficulty: 2,
      college: "College of Computing",
      prerequisites: [],
      corequisites: [],
      threads: [],
      attributes: ["CORE"],
      offerings: { fall: true, spring: true, summer: true },
    },
    {
      id: 2,
      code: "CS 1331",
      title: "Intro-Object Orient Prog",
      credits: 3,
      description: "Introduction to techniques and methods of object-oriented programming such an encapsulation, inheritance, and polymorphism. Emphasis on software development and individual programming skills.",
      difficulty: 3,
      college: "College of Computing",
      prerequisites: [{ type: 'course', courses: ['CS 1301'], logic: 'AND' }],
      corequisites: [],
      threads: [],
      attributes: ["CORE"],
      offerings: { fall: true, spring: true, summer: false },
    },
    {
      id: 3,
      code: "CS 1332",
      title: "Data Struct & Algorithms",
      credits: 3,
      description: "Computer data structures and algorithms in the context of object-oriented programming. Focus on software development towards applications.",
      difficulty: 4,
      college: "College of Computing",
      prerequisites: [{ type: 'course', courses: ['CS 1331'], logic: 'AND' }],
      corequisites: [],
      threads: ["Systems & Architecture"],
      attributes: ["CORE"],
      offerings: { fall: true, spring: true, summer: false },
    },
  ];

  // Use fetched courses or fallback
  let courses = baseCourses.length > 0 ? baseCourses : fallbackCourses;

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
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' 
      onClick={() => {
        setSelectedCourse(null); 
        setAddToPlan(false);
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
                  className={`h-8 w-8 p-0`}
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
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">Credits</div>
                <div className="text-lg font-semibold text-[#003057]">{course.credits}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">Difficulty</div>
                <div className="text-lg font-semibold text-[#003057]">{course.difficulty}/5</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">College</div>
                <div className="text-lg font-semibold text-[#003057]">{course.college}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-500">Semesters</div>
                <div className="text-lg font-semibold text-[#003057]">
                  {[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => setAddToPlan(!addToPlan)} 
                className="bg-[#003057] hover:bg-[#002041] text-white flex-1"
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
                      className={semester === plannedSemester ? "bg-[#B3A369] border-2 border-[#003057]" : ""}
                    >
                      {semester.season} {semester.year}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => confirmAddToPlan(course)} 
                  className="bg-[#003057] hover:bg-[#002041] text-white w-full"
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
    <div className="space-y-6">
      {/* Header with bookmarks button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <CourseExplorerHeader bookmarkedCount={bookmarkedCourses.size} />
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-slate-300">
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
              Showing <span className="font-medium">{displayCourses.length}</span> courses
              {selectedFilters.length > 0 && (
                <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
              )}
            </p>
            
            {displayCourses.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <TrendingUp className="h-3 w-3" />
                <span>Avg difficulty: {(displayCourses.reduce((sum, c) => sum + c.difficulty, 0) / displayCourses.length).toFixed(1)}/5</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003057] mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Loading courses...</h3>
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
                className="border-slate-300"
              >
                Clear search and filters
              </Button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <CourseGrid
              courses={displayCourses}
              bookmarkedCourses={bookmarkedCourses}
              toggleBookmark={toggleBookmark}
              onViewDetails={handleViewDetails}
              onAddToPlan={handleAddToPlan}
            />
          ) : (
            <CourseList
              courses={displayCourses}
              bookmarkedCourses={bookmarkedCourses}
              toggleBookmark={toggleBookmark}
              onViewDetails={handleViewDetails}
              onAddToPlan={handleAddToPlan}
            />
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