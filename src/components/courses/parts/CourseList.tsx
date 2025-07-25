import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Plus, Eye, Bookmark, CheckCircle2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseListProps {
  courses?: any[];
  bookmarkedCourses?: Set<string>;
  animate?: boolean;
  toggleBookmark?: (courseId: string) => void;
  onViewDetails?: (course: any) => void; 
  onAddToPlan?: (course: any) => void;
  completedCourses?: Set<string>;
  onToggleComplete?: (courseCode: string) => void;
}

export const CourseList: React.FC<CourseListProps> = ({
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

  // Enhanced course list item (from old version)
  const EnhancedCourseListItem = ({ course, index }: { course: any; index: number }) => {
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
    const courseDescription = course.description || 'No description available';
    const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };
    const coursePrerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
    const courseCorequisites = Array.isArray(course.corequisites) ? course.corequisites : [];
    const courseThreads = Array.isArray(course.threads) ? course.threads : [];

    return (
      <motion.div
        initial={animate ? { opacity: 0, x: -20 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="group"
      >
        <Card className="hover:shadow-md transition-all duration-200 border-slate-300 hover:border-[#B3A369] py-3">
          <CardContent className="px-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-row items-center justify-between">
                <div className="flex flex-col space-x-4">
                  <div className='flex flex-row items-center space-x-2'>
                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-[#003057] transition-colors">
                      {courseCode}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${bookmarkedCourses.has(String(courseId)) ? "" : "opacity-0"} group-hover:opacity-100 cursor-pointer`}
                      onClick={() => toggleBookmark && toggleBookmark(String(courseId))}
                    >
                      <Bookmark 
                        className={cn(
                          "h-4 w-4",
                          bookmarkedCourses.has(String(courseId)) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                        )} 
                      />
                    </Button>
                  </div>
                  <h4 className="font-medium text-slate-700 flex-1">{courseTitle}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center space-x-2 gap-y-2">
                      <Badge variant="secondary" className='border-slate-300'>{courseCredits} Credits</Badge>
                      <Badge className={cn("border", getDifficultyColor(courseDifficulty))}>
                        Difficulty {courseDifficulty}/5
                      </Badge>
                      <Badge className="flex items-center border-slate-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {[courseOfferings.fall && 'Fall', courseOfferings.spring && 'Spring', courseOfferings.summer && 'Summer'].filter(Boolean).length} semester{[courseOfferings.fall && 'Fall', courseOfferings.spring && 'Spring', courseOfferings.summer && 'Summer'].filter(Boolean).length !== 1 ? 's' : ''}
                      </Badge>
                      {(coursePrerequisites.length > 0 || courseCorequisites.length > 0) && <Badge variant="outline" className="text-xs border-slate-300"><span>R</span></Badge>}
                      {courseThreads.length > 0 && (
                        <div className="flex space-x-1">
                          {courseThreads.slice(0, 2).map((thread: string) => (
                            <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                              {thread}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3 line-clamp-2 max-w-1/4">
                  {courseDescription}
                </p>

                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails && onViewDetails(course)}
                    className='cursor-pointer hover:bg-gray-200/75'
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  
                  {onToggleComplete && (
                    <Button
                      variant={completedCourses?.has(courseCode) ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(courseCode);
                      }}
                      className={cn(
                        "transition-all duration-200",
                        completedCourses?.has(courseCode) 
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                          : "hover:bg-green-50 hover:border-green-300"
                      )}
                    >
                      {completedCourses?.has(courseCode) ? (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      {completedCourses?.has(courseCode) ? 'Done' : 'Mark'}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => onAddToPlan && onAddToPlan(course)} 
                    className="bg-[#003057] hover:bg-[#002041] text-white cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {safeCourses.map((course, index) => (
        <EnhancedCourseListItem
          key={course?.id || `course-${index}`}
          course={course}
          index={index}
        />
      ))}
    </motion.div>
  );
};