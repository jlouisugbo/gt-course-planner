import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Eye, BookOpen
} from 'lucide-react';
import { Course } from '@/types';

interface CourseListProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  onCourseClick,
  isLoading = false,
  emptyMessage = "No courses found."
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">{emptyMessage}</div>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search criteria or filters.
        </p>
      </div>
    );
  }

  const getOfferedSemesters = (course: Course) => {
    const semesters = [];
    if (course.offerings?.fall) semesters.push('Fall');
    if (course.offerings?.spring) semesters.push('Spring');
    if (course.offerings?.summer) semesters.push('Summer');
    return semesters;
  };

  const formatCourseType = (type: string) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Course';
  };

  return (
    <div className="space-y-4">
      {courses.map((course, index) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border-l-4 border-l-[#B3A369]/20 hover:border-l-[#B3A369]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-[#B3A369] transition-colors" />
                    <h3 className="font-bold text-xl text-[#003057] group-hover:text-[#B3A369] transition-colors">
                      {course.code}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {course.credits || 3} cr
                    </Badge>
                  </div>
                  
                  <h4 className="font-semibold text-lg text-foreground mb-3">
                    {course.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge 
                      variant={course.course_type === 'core' ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {formatCourseType(course.course_type || 'elective')}
                    </Badge>
                    
                    {course.college && (
                      <Badge variant="outline" className="text-xs">
                        {course.college}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {getOfferedSemesters(course).length > 0 ? (
                        getOfferedSemesters(course).map((semester) => (
                          <Badge key={semester} variant="outline" className="text-xs">
                            {semester}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Varies
                        </Badge>
                      )}
                    </div>
                    
                    {course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {course.prerequisites.length} prereq{course.prerequisites.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCourseClick(course)}
                  className="text-[#B3A369] hover:text-[#B3A369] hover:bg-[#B3A369]/10 ml-4"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};