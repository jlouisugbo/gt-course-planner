import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Plus, Eye, Bookmark, Target, CheckCircle2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseGridProps {
  courses?: any[];
  bookmarkedCourses?: Set<string>;
  animate?: boolean;
  toggleBookmark?: (courseId: string) => void;
  onViewDetails?: (course: any) => void;
  onAddToPlan?: (course: any) => void;
  completedCourses?: Set<string>;
  onToggleComplete?: (courseCode: string) => void;
}

export const CourseGrid: React.FC<CourseGridProps> = ({
  courses = [],
  bookmarkedCourses = new Set(),
  animate = false,
  toggleBookmark,
  onViewDetails,
  onAddToPlan,
  completedCourses = new Set(),
  onToggleComplete,
}) => {
  // Safe array filtering
  const safeCourses = Array.isArray(courses) 
    ? courses.filter(course => course && typeof course === 'object')
    : [];

  if (safeCourses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-lg font-medium">No courses found</div>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (difficulty <= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // Enhanced course card for grid layout (from old version)
  const EnhancedCourseCard = ({ course, index }: { course: any; index: number; }) => {
    if (!course || typeof course !== 'object') {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-red-600 text-sm">Invalid course data</div>
          </CardContent>
        </Card>
      );
    }

    const courseId = course.id || `course-${index}`;
    const courseCode = course.code || 'Unknown';
    const courseTitle = course.title || 'No title available';
    const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
    const courseDifficulty = typeof course.difficulty === 'number' ? course.difficulty : 3;
    const courseCollege = course.college || 'Unknown';
    const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };
    const coursePrerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
    const courseCorequisites = Array.isArray(course.corequisites) ? course.corequisites : [];
    const courseThreads = Array.isArray(course.threads) ? course.threads : [];

    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={'group'}
      >
        <Card className="h-auto hover:shadow-lg transition-all duration-300 group border-slate-300 hover:border-[#B3A369]">
          <CardHeader className="pb-3 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-lg group-hover:text-[#003057] transition-colors">
                    {courseCode}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${bookmarkedCourses.has(String(courseId)) ? "" : "opacity-0"} group-hover:opacity-100 cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleBookmark) toggleBookmark(String(courseId));
                    }}
                  >
                    <Bookmark 
                      className={cn(
                        "h-4 w-4",
                        bookmarkedCourses.has(String(courseId)) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                      )} 
                    />
                  </Button>
                </div>
                <CardDescription className="font-medium text-slate-700 line-clamp-2">
                  {courseTitle}
                </CardDescription>
              </div>

              <div className='flex flex-col space-y-2 items-end'>
                <Badge variant="secondary" className="border-slate-300">{courseCredits} Credits</Badge>

                {/* Threads display (from old version) */}
                {courseThreads.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {courseThreads.slice(0, 2).map((thread: string) => (
                      <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                        <Target className="h-3 w-3 mr-1" />
                        {thread}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("border text-xs", getDifficultyColor(courseDifficulty))}>
                  Difficulty {courseDifficulty}/5
                </Badge>
                <Badge variant="outline" className="text-xs border-slate-300">
                  {courseCollege}
                </Badge>
                {(coursePrerequisites.length > 0 || courseCorequisites.length > 0) && (
                  <Badge variant="outline" className="text-xs border-slate-300">
                    Prerequisites
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="flex items-center text-xs border-slate-300">
                  <Calendar className="h-3 w-3 mr-1" />
                  {[courseOfferings.fall && 'F', courseOfferings.spring && 'S', courseOfferings.summer && 'Su'].filter(Boolean).join(', ')}
                </Badge>
                {courseThreads.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                    <Target className="h-3 w-3 mr-1" />
                    {courseThreads[0]}
                  </Badge>
                )}
              </div>
              
              {/* Interactive buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => onAddToPlan && onAddToPlan(course)} 
                  className="flex-1 cursor-pointer text-white bg-[#003057] hover:bg-[#002041]"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to Plan
                </Button>
                
                {onToggleComplete && (
                  <Button
                    variant={completedCourses.has(courseCode) ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(courseCode);
                    }}
                    className={cn(
                      "transition-all duration-200",
                      completedCourses.has(courseCode) 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                        : "hover:bg-green-50 hover:border-green-300"
                    )}
                  >
                    {completedCourses.has(courseCode) ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails && onViewDetails(course)}
                  className="cursor-pointer hover:bg-gray-200/75"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
    >
      {safeCourses.map((course, index) => (
        <EnhancedCourseCard 
          key={course?.id || `${course?.code || 'unknown'}-${course?.title?.substring(0, 10) || 'notitle'}-${index}`} 
          course={course} 
          index={index}
        />
      ))}
    </motion.div>
  );
};