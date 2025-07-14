"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  BookOpen,
  Clock,
  Users,
  Star,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Download,
  Share2,
  Bookmark,
  Eye,
} from 'lucide-react';
import { sampleCourses, searchCourses } from '@/data/courses';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { se } from 'date-fns/locale';

const CourseExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'code' | 'difficulty' | 'credits' | 'popularity'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());
  
  let courses = searchQuery ? searchCourses(searchQuery) : sampleCourses;

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

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (difficulty <= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

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

  const filterOptions = [
    'CS Core', 'Math', 'Science', 'Intelligence Thread', 'Systems Thread',
    'Fall Offerings', 'Spring Offerings', 'Summer Offerings',
    'Easy (1-2)', 'Medium (3)', 'Hard (4-5)'
  ];

  // Course display card for grid layout
  const EnhancedCourseCard = ({ course, index }: { course: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={'group'}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 group border-slate-300 hover:border-[#B3A369]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg group-hover:text-[#003057] transition-colors">
                  {course.code}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(course.id);
                  }}
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      bookmarkedCourses.has(course.id) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                    )} 
                  />
                </Button>
              </div>
              <CardDescription className="font-medium text-slate-700 line-clamp-2">
                {course.title}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">{course.credits}cr</Badge>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={cn("border", getDifficultyColor(course.difficulty))}>
              Difficulty {course.difficulty}/5
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-300">
              {course.college}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-slate-600 line-clamp-3">
            {course.description}
          </p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-slate-500">
                <Clock className="h-4 w-4 mr-2" />
                {course.workload}h/week
              </div>
              <div className="flex items-center text-slate-500">
                <Star className="h-4 w-4 mr-2" />
                {course.difficulty}/5 difficulty
              </div>
              <div className="flex items-center text-slate-500">
                <Users className="h-4 w-4 mr-2" />
                {course.instructors.length} instructor{course.instructors.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-slate-500">
                <Calendar className="h-4 w-4 mr-2" />
                {[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length} semester{[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {course.offerings.fall && <Badge variant="outline" className="text-xs border-slate-300">Fall</Badge>}
                {course.offerings.spring && <Badge variant="outline" className="text-xs border-slate-300">Spring</Badge>}
                {course.offerings.summer && <Badge variant="outline" className="text-xs border-slate-300">Summer</Badge>}
              </div>
            </div>
          </div>
          
          {course.threads.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {course.threads.map((thread: string) => (
                <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                  <Target className="h-3 w-3 mr-1" />
                  {thread}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1 cursor-pointer bg-[#003057] hover:bg-[#002041]">
              <Plus className="h-3 w-3 mr-1" />
              Add to Plan
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedCourse(course)}
              className='cursor-pointer hover:bg-gray-200/75'
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Course display card for list layout
  const EnhancedCourseListItem = ({ course, index }: { course: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-all duration-200 border-slate-300 hover:border-[#B3A369]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-[#003057] transition-colors">
                  {course.code}
                </h3>
                <h4 className="font-medium text-slate-700 flex-1">{course.title}</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{course.credits}cr</Badge>
                  <Badge className={cn("border", getDifficultyColor(course.difficulty))}>
                    Difficulty {course.difficulty}/5
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => toggleBookmark(course.id)}
                  >
                    <Bookmark 
                      className={cn(
                        "h-4 w-4",
                        bookmarkedCourses.has(course.id) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                      )} 
                    />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {course.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {course.workload}h/week
                  </span>
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {course.instructors[0]}
                    {course.instructors.length > 1 && ` +${course.instructors.length - 1}`}
                  </span>
                  <div className="flex space-x-1">
                    {course.offerings.fall && <Badge variant="outline" className="text-xs border-slate-300">Fall</Badge>}
                    {course.offerings.spring && <Badge variant="outline" className="text-xs border-slate-300">Spring</Badge>}
                    {course.offerings.summer && <Badge variant="outline" className="text-xs border-slate-300">Summer</Badge>}
                  </div>
                </div>

                {course.threads.length > 0 && (
                  <div className="flex space-x-1">
                    {course.threads.slice(0, 2).map((thread: string) => (
                      <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                        {thread}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCourse(course)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Details
              </Button>
              <Button className="bg-[#003057] hover:bg-[#002041]">
                <Plus className="h-4 w-4 mr-2" />
                Add to Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Enlarged course card modal after clicking details button
  const CourseCardModal = ({ course, index, className, onClick }: { course: any; index: number; className?: string; onClick?: any}) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group ${className}`}
      onClick={onClick}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 group border-slate-300 hover:border-[#B3A369]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg group-hover:text-[#003057] transition-colors">
                  {course.code}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(course.id);
                  }}
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      bookmarkedCourses.has(course.id) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                    )} 
                  />
                </Button>
              </div>
              <CardDescription className="font-medium text-slate-700 line-clamp-2">
                {course.title}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">{course.credits}cr</Badge>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={cn("border", getDifficultyColor(course.difficulty))}>
              Difficulty {course.difficulty}/5
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-300">
              {course.college}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-slate-600 line-clamp-3">
            {course.description}
          </p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-slate-500">
                <Clock className="h-4 w-4 mr-2" />
                {course.workload}h/week
              </div>
              <div className="flex items-center text-slate-500">
                <Star className="h-4 w-4 mr-2" />
                {course.difficulty}/5 difficulty
              </div>
              <div className="flex items-center text-slate-500">
                <Users className="h-4 w-4 mr-2" />
                {course.instructors.length} instructor{course.instructors.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-slate-500">
                <Calendar className="h-4 w-4 mr-2" />
                {[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length} semester{[course.offerings.fall && 'Fall', course.offerings.spring && 'Spring', course.offerings.summer && 'Summer'].filter(Boolean).length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {course.offerings.fall && <Badge variant="outline" className="text-xs border-slate-300">Fall</Badge>}
                {course.offerings.spring && <Badge variant="outline" className="text-xs border-slate-300">Spring</Badge>}
                {course.offerings.summer && <Badge variant="outline" className="text-xs border-slate-300">Summer</Badge>}
              </div>
            </div>
          </div>
          
          {course.threads.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {course.threads.map((thread: string) => (
                <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                  <Target className="h-3 w-3 mr-1" />
                  {thread}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1 cursor-pointer bg-[#003057] hover:bg-[#002041]">
              <Plus className="h-3 w-3 mr-1" />
              Add to Plan
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedCourse(course)}
              className='cursor-pointer hover:bg-gray-200/75'
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    selectedCourse? 
      // Selected course popup
      <div className='fixed gt-gradient w-screen h-screen flex items-center justify-center' onClick={() => setSelectedCourse(null)}>
        <CourseCardModal onClick={(e) => e.stopPropagation()} className="bg-white opacity-100 rounded-2xl w-8/12 h-8/12" course={selectedCourse} index={1} />
      </div> 
      :
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Course Explorer</h1>
          <p className="text-lg text-slate-600 mt-2">
            Discover and explore courses for your academic plan
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" className="border-slate-300">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-slate-300">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="bg-[#003057] hover:bg-[#002041]">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarks ({bookmarkedCourses.size})
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-slate-300">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search courses by code, title, description, or instructor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Course Code</SelectItem>
                    <SelectItem value="difficulty">Difficulty</SelectItem>
                    <SelectItem value="credits">Credits</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border-slate-300"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
                
                <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Filter Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700">Filters</h4>
                {selectedFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilters([])}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <Button
                    key={filter}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-sm border-slate-300",
                      selectedFilters.includes(filter) && "bg-[#003057] text-white border-[#003057] hover:bg-[#002041]"
                    )}
                    onClick={() => {
                      setSelectedFilters(prev =>
                        prev.includes(filter)
                          ? prev.filter(f => f !== filter)
                          : [...prev, filter]
                      );
                    }}
                  >
                    {filter}
                    {selectedFilters.includes(filter) && (
                      <CheckCircle className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-slate-600">
              Showing <span className="font-medium">{courses.length}</span> courses
              {selectedFilters.length > 0 && (
                <span> with <span className="font-medium">{selectedFilters.length}</span> filter{selectedFilters.length !== 1 ? 's' : ''}</span>
              )}
            </p>
            
            {courses.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <TrendingUp className="h-3 w-3" />
                <span>Avg difficulty: {(courses.reduce((sum, c) => sum + c.difficulty, 0) / courses.length).toFixed(1)}/5</span>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {courses.length === 0 ? (
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
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilters([]);
                }}
                className="border-slate-300"
              >
                Clear search and filters
              </Button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {courses.map((course, index) => (
                <EnhancedCourseCard key={course.id} course={course} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {courses.map((course, index) => (
                <EnhancedCourseListItem key={course.id} course={course} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseExplorer;