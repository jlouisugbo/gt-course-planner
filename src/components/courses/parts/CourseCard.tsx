// CourseCard.tsx - With comprehensive safety checks
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Clock, Star, Users, Calendar, Target, Plus, Eye, Bookmark, CheckCircle2, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course?: any;
  index?: number;
  bookmarkedCourses?: Set<string>;
  toggleBookmark?: (courseId: string) => void;
  onViewDetails?: (course: any) => void;
  completedCourses?: Set<string>;
  onToggleComplete?: (courseCode: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  index = 0,
  bookmarkedCourses = new Set(),
  toggleBookmark,
  onViewDetails,
  completedCourses = new Set(),
  onToggleComplete,
}) => {
  // Early return if no course provided
  if (!course || typeof course !== 'object') {
    return (
      <Card className="h-full border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="text-red-600 text-sm">Invalid course data</div>
        </CardContent>
      </Card>
    );
  }

  // Safe property access with fallbacks
  const courseId = course.id || `course-${index}`;
  const courseCode = course.code || 'Unknown';
  const courseTitle = course.title || 'No title available';
  const courseCredits = typeof course.credits === 'number' ? course.credits : 0;
  const courseDifficulty = typeof course.difficulty === 'number' ? course.difficulty : 3;
  const courseDescription = course.description || 'No description available';
  const courseWorkload = typeof course.workload === 'number' ? course.workload : 0;
  const courseInstructors = Array.isArray(course.instructors) ? course.instructors : [];
  const courseThreads = Array.isArray(course.threads) ? course.threads : [];
  const courseCollege = course.college || 'Unknown College';
  const courseOfferings = course.offerings || { fall: false, spring: false, summer: false };

  const isCompleted = completedCourses.has(courseCode);
  const isBookmarked = bookmarkedCourses.has(courseId);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(courseCode);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (difficulty <= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleBookmark && courseId) {
      toggleBookmark(courseId);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(course);
    }
  };

  // Safe offerings count
  const offeringsCount = Object.values(courseOfferings).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-slate-300 hover:border-[#B3A369]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg group-hover:text-[#003057] transition-colors">
                  {courseCode}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={handleBookmarkToggle}
                >
                  <Bookmark 
                    className={cn(
                      "h-4 w-4",
                      bookmarkedCourses.has(courseId) ? "fill-[#B3A369] text-[#B3A369]" : "text-slate-400"
                    )} 
                  />
                </Button>
              </div>
              <CardDescription className="font-medium text-slate-700 line-clamp-2">
                {courseTitle}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">{courseCredits}cr</Badge>
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={cn("border", getDifficultyColor(courseDifficulty))}>
              Difficulty {courseDifficulty}/5
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-300">
              {courseCollege}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-slate-600 line-clamp-3">
            {courseDescription}
          </p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center text-slate-500">
                <Clock className="h-4 w-4 mr-2" />
                {courseWorkload}h/week
              </div>
              <div className="flex items-center text-slate-500">
                <Star className="h-4 w-4 mr-2" />
                {courseDifficulty}/5 difficulty
              </div>
              <div className="flex items-center text-slate-500">
                <Users className="h-4 w-4 mr-2" />
                {courseInstructors.length} instructor{courseInstructors.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-slate-500">
                <Calendar className="h-4 w-4 mr-2" />
                {offeringsCount} semester{offeringsCount !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {courseOfferings.fall && <Badge variant="outline" className="text-xs border-slate-300">Fall</Badge>}
                {courseOfferings.spring && <Badge variant="outline" className="text-xs border-slate-300">Spring</Badge>}
                {courseOfferings.summer && <Badge variant="outline" className="text-xs border-slate-300">Summer</Badge>}
                {offeringsCount === 0 && <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">TBD</Badge>}
              </div>
            </div>
          </div>
          
          {courseThreads.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {courseThreads.map((thread: string, threadIndex: number) => (
                <Badge 
                  key={`${thread}-${threadIndex}`} 
                  variant="outline" 
                  className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]"
                >
                  <Target className="h-3 w-3 mr-1" />
                  {thread}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1 bg-[#003057] hover:bg-[#002041]">
              <Plus className="h-3 w-3 mr-1" />
              Add to Plan
            </Button>
            
            {onToggleComplete && (
              <Button
                variant={isCompleted ? "default" : "outline"}
                size="sm"
                onClick={handleToggleComplete}
                className={cn(
                  "transition-all duration-200",
                  isCompleted 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                    : "hover:bg-green-50 hover:border-green-300"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewDetails}
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            {toggleBookmark && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBookmarkToggle}
                className={cn(
                  "transition-all",
                  isBookmarked && "bg-yellow-50 border-yellow-300 text-yellow-700"
                )}
              >
                <Bookmark className={cn("h-3 w-3", isBookmarked && "fill-current")} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};