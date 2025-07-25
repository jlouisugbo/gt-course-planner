import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Calendar, Plus, Eye, Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseListItemProps {
  course?: any;
  index?: number;
  bookmarkedCourses?: Set<string>;
  toggleBookmark?: (courseId: string) => void;
  onViewDetails?: (course: any) => void;
  onAddToPlan?: (course: any) => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  index = 0,
  bookmarkedCourses = new Set(),
  toggleBookmark,
  onViewDetails,
  onAddToPlan,
}) => {
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

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (difficulty <= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleBookmarkToggle = () => {
    if (toggleBookmark && courseId) {
      toggleBookmark(courseId);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(course);
    }
  };

  const handleAddToPlan = () => {
    if (onAddToPlan) {
      onAddToPlan(course);
    }
  };

  // Calculate offerings count
  const offeringsCount = [courseOfferings.fall, courseOfferings.spring, courseOfferings.summer]
    .filter(Boolean).length;

  return (
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
                  {courseCode}
                </h3>
                <h4 className="font-medium text-slate-700 flex-1">{courseTitle}</h4>
              </div>
              
              <p className="text-sm text-slate-600 mb-3 line-clamp-2 max-w-1/4">
                {courseDescription}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className='border-slate-300'>{courseCredits} Credits</Badge>
                  <Badge className={cn("border", getDifficultyColor(courseDifficulty))}>
                    Difficulty {courseDifficulty}/5
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Badge className="flex items-center border-slate-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      {offeringsCount} semester{offeringsCount !== 1 ? 's' : ''}
                    </Badge>
                    {(coursePrerequisites.length > 0 || courseCorequisites.length > 0) && 
                      <Badge variant="outline" className="text-xs border-slate-300">
                        <span>R</span>
                      </Badge>
                    }
                  </div>
                  {courseThreads.length > 0 && (
                    <div className="flex space-x-1">
                      {courseThreads.slice(0, 2).map((thread: string) => (
                        <Badge key={thread} variant="outline" className="text-xs bg-[#B3A369]/10 border-[#B3A369] text-[#B3A369]">
                          {thread}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${bookmarkedCourses.has(courseId) ? "" : "opacity-0"} group-hover:opacity-100`}
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
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                Details
              </Button>
              <Button 
                onClick={handleAddToPlan} 
                className="bg-[#003057] hover:bg-[#002041] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};