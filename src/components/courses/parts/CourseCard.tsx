import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, BookOpen, ArrowRight
} from 'lucide-react';
import { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  index?: number;
  isSelected?: boolean;
  showLoadingState?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  isSelected = false,
  showLoadingState = false
}) => {

  const handleClick = () => {
    onClick();
  };
  const getOfferedSemesters = () => {
    const semesters = [];
    if (course.offerings?.fall) semesters.push('Fall');
    if (course.offerings?.spring) semesters.push('Spring');
    if (course.offerings?.summer) semesters.push('Summer');
    return semesters;
  };

  // Format course type for display
  const formatCourseType = (type: string) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Course';
  };


  if (showLoadingState) {
    return (
      <Card className="h-full animate-pulse">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full transition-all duration-300 cursor-pointer group border-l-4 
      ${isSelected 
        ? 'border-l-gt-gold shadow-lg ring-2 ring-gt-gold/20' 
        : 'border-l-gt-gold/20 hover:border-l-gt-gold hover:shadow-lg'
      } 
      hover:shadow-xl hover:-translate-y-1 focus-within:ring-2 focus-within:ring-gt-navy focus-within:ring-offset-2
      transform-gpu will-change-transform`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-gt-navy group-hover:text-gt-gold transition-colors duration-300">
                {course.code}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {course.credits || 3} cr
              </Badge>
            </div>
            <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
              {course.title}
            </h4>
          </div>
          <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-gt-gold transition-colors duration-300" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {course.description || 'No description available'}
        </p>

        {/* Course Details */}
        <div className="space-y-2">
          {/* Semesters Offered */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {getOfferedSemesters().length > 0 ? (
                getOfferedSemesters().map((semester) => (
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
          </div>
        </div>

        {/* Prerequisites */}
        {course.prerequisites && Array.isArray(course.prerequisites) && course.prerequisites.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Prerequisites:</p>
            <div className="flex flex-wrap gap-1">
              {course.prerequisites.slice(0, 3).map((prereq, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {typeof prereq === 'string' ? prereq : prereq.courses?.[0] || 'N/A'}
                </Badge>
              ))}
              {course.prerequisites.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.prerequisites.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Course Type and Action */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={course.course_type === 'core' ? 'default' : 'secondary'}
            className="text-xs capitalize"
          >
            {formatCourseType(course.course_type || 'elective')}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="text-gt-gold hover:text-gt-gold hover:bg-gt-gold/10 group-hover:translate-x-1 transition-all duration-300 focus:ring-2 focus:ring-gt-navy focus:ring-offset-1"
            aria-label={`View details for ${course.code}`}
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};