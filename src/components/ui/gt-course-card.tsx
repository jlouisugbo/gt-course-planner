/**
 * GT Design System - Unified Course Card Component
 * Consolidates all course card variants with GT branding and accessibility compliance
 */

"use client";

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PrerequisiteDisplay, PrerequisiteBadges } from '@/components/ui/PrerequisiteDisplay';
import {
  BookOpen,
  Calendar,
  // Clock,
  Building,
  Users,
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Info,
  // AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  // Loader2
} from 'lucide-react';

// GT Brand Colors
const _GT_NAVY = '#003057';
const _GT_GOLD = '#B3A369';

// Unified Course Interface
interface UnifiedCourse {
  id?: number;
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisites?: any[];
  offerings?: {
    fall?: boolean;
    spring?: boolean;
    summer?: boolean;
  };
  course_type?: string;
  college?: string;
  department?: string;
  status?: 'planned' | 'in-progress' | 'completed';
  grade?: string;
  semesterId?: number;
  footnoteRefs?: number[];
  type?: 'regular' | 'or_group' | 'and_group' | 'flexible' | 'selection';
  courses?: UnifiedCourse[];
  selectionCount?: number;
  isOption?: boolean;
}

// Card Variants
type CourseCardVariant = 'default' | 'planner' | 'requirements' | 'compact' | 'selectable';

// Theme configurations for different contexts
interface ThemeConfig {
  borderColor: string;
  bgColor: string;
  accentColor: string;
  hoverBorderColor: string;
  hoverShadow: string;
}

const themes: Record<string, ThemeConfig> = {
  default: {
    borderColor: 'border-gt-gold/20',
    bgColor: 'bg-white',
    accentColor: 'text-gt-navy',
    hoverBorderColor: 'hover:border-gt-gold',
    hoverShadow: 'hover:shadow-xl hover:shadow-gt-gold/10'
  },
  completed: {
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50/50',
    accentColor: 'text-green-700',
    hoverBorderColor: 'hover:border-green-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-green-100'
  },
  'in-progress': {
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/50',
    accentColor: 'text-blue-700',
    hoverBorderColor: 'hover:border-blue-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-blue-100'
  },
  degree: {
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    hoverBorderColor: 'hover:border-blue-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-blue-100'
  },
  minor: {
    borderColor: 'border-yellow-200',
    bgColor: 'bg-yellow-50',
    accentColor: 'text-yellow-700',
    hoverBorderColor: 'hover:border-yellow-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-yellow-100'
  },
  option: {
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    accentColor: 'text-orange-700',
    hoverBorderColor: 'hover:border-orange-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-orange-100'
  },
  flexible: {
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    accentColor: 'text-purple-700',
    hoverBorderColor: 'hover:border-purple-300',
    hoverShadow: 'hover:shadow-lg hover:shadow-purple-100'
  }
};

interface GTCourseCardProps {
  course: UnifiedCourse;
  variant?: CourseCardVariant;
  context?: 'explorer' | 'planner' | 'requirements' | 'dashboard';
  programType?: 'degree' | 'minor';
  
  // State props
  isSelected?: boolean;
  isCompleted?: boolean;
  isPlanned?: boolean;
  isLoading?: boolean;
  isDragging?: boolean;
  
  // Interaction props
  onClick?: () => void;
  onToggleComplete?: (courseCode: string) => void;
  onRemove?: () => void;
  onAddToPlan?: () => void;
  onViewDetails?: () => void;
  onUpdateStatus?: (courseId: number, semesterId: number, status: string, grade?: string) => void;
  
  // Layout props
  compact?: boolean;
  showDragHandle?: boolean;
  showActions?: boolean;
  showStatus?: boolean;
  showPrerequisites?: boolean;
  
  // Accessibility
  ariaLabel?: string;
  footnotes?: { id: number; text: string }[];
  
  // Animation
  animationDelay?: number;
}

export const GTCourseCard = memo<GTCourseCardProps>(({
  course,
  variant = 'default',
  context: _context = 'explorer',
  programType,
  
  isSelected = false,
  isCompleted = false,
  isPlanned = false,
  isLoading = false,
  isDragging = false,
  
  onClick,
  onToggleComplete,
  onRemove,
  onAddToPlan,
  onViewDetails,
  onUpdateStatus,
  
  compact = false,
  showDragHandle = false,
  showActions = true,
  showStatus = true,
  showPrerequisites = true,
  
  ariaLabel,
  footnotes = [],
  animationDelay = 0
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Determine theme based on course status and context
  const getTheme = useCallback((): ThemeConfig => {
    if (isCompleted) return themes.completed;
    if (course.status === 'in-progress') return themes['in-progress'];
    if (course.type === 'or_group' || course.isOption) return themes.option;
    if (course.type === 'flexible' || course.type === 'selection') return themes.flexible;
    if (programType === 'degree') return themes.degree;
    if (programType === 'minor') return themes.minor;
    return themes.default;
  }, [isCompleted, course.status, course.type, course.isOption, programType]);
  
  const theme = getTheme();
  
  // Get offered semesters
  const getOfferedSemesters = useCallback(() => {
    if (!course.offerings) return [];
    const semesters = [];
    if (course.offerings.fall) semesters.push('Fall');
    if (course.offerings.spring) semesters.push('Spring');
    if (course.offerings.summer) semesters.push('Summer');
    return semesters;
  }, [course.offerings]);
  
  // Format course type
  const formatCourseType = useCallback((type: string) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Course';
  }, []);
  
  // Handle interactions
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  }, [onClick]);
  
  const handleToggleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete?.(course.code);
  }, [onToggleComplete, course.code]);
  
  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.();
  }, [onViewDetails]);
  
  const handleAddToPlan = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToPlan?.();
  }, [onAddToPlan]);
  
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("h-full animate-pulse", theme.borderColor, theme.bgColor)}>
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
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Group course rendering (OR/AND groups)
  const renderGroupContent = () => {
    if (course.type === 'or_group') {
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-orange-600" />
                <h4 className="font-semibold text-sm">{course.title}</h4>
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                  Choose One
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Select one of the following courses:
              </p>
            </div>
            {onToggleComplete && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleComplete(course.code)}
                aria-label={`Mark ${course.title} as complete`}
              />
            )}
          </div>
          
          <div className="space-y-2 pl-6 border-l-2 border-orange-200">
            {course.courses?.map((groupCourse, idx) => (
              <div key={`${groupCourse.code}-${idx}`} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-xs">{groupCourse.code}</p>
                  <p className="text-xs text-muted-foreground">{groupCourse.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {groupCourse.credits} cr
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (course.type === 'flexible' || course.type === 'selection') {
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold text-sm">{course.title}</h4>
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                  {course.type === 'flexible' ? 'Flexible' : 'Selection'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {course.description || 'Flexible requirement - consult with advisor'}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {course.credits} credits
                </Badge>
                {course.selectionCount && (
                  <Badge variant="outline" className="text-xs">
                    Choose {course.selectionCount}
                  </Badge>
                )}
              </div>
            </div>
            {onToggleComplete && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleComplete(course.code)}
                aria-label={`Mark ${course.title} as complete`}
              />
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Special rendering for group courses
  if (course.type === 'or_group' || course.type === 'flexible' || course.type === 'selection') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: animationDelay }}
      >
        <Card className={cn(
          "transition-all duration-200 hover:shadow-md cursor-pointer group border-2",
          theme.borderColor,
          theme.bgColor,
          theme.hoverBorderColor,
          theme.hoverShadow,
          isCompleted && "ring-2 ring-green-500/20",
          isSelected && "ring-2 ring-gt-gold/30",
          compact ? "p-2" : "p-1"
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel || `${course.type} requirement: ${course.title}`}
        >
          <CardContent className={compact ? "p-3" : "p-4"}>
            {renderGroupContent()}
            
            {/* Completion Status */}
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center mt-3 py-2 px-3 bg-green-100 dark:bg-green-900/20 rounded border border-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-green-700 text-sm font-medium">
                    Completed
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Planned Status */}
            <AnimatePresence>
              {isPlanned && !isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-center mt-3 py-2 px-3 bg-blue-100 dark:bg-blue-900/20 rounded border border-blue-200"
                >
                  <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-blue-700 text-sm font-medium">
                    Planned
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Regular course rendering
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <Card className={cn(
        "h-full transition-all duration-300 cursor-pointer group",
        "border-l-4 focus-within:ring-2 focus-within:ring-gt-navy focus-within:ring-offset-2",
        "transform-gpu will-change-transform",
        theme.borderColor,
        theme.bgColor,
        theme.hoverBorderColor,
        theme.hoverShadow,
        isSelected && "border-l-gt-gold shadow-lg ring-2 ring-gt-gold/20",
        isDragging && "cursor-grabbing opacity-50",
        compact && "min-h-0",
        "hover:-translate-y-0.5"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || `Course: ${course.code} - ${course.title}`}
      >
        <CardHeader className={compact ? "pb-2 px-3 pt-3" : "pb-3"}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {showDragHandle && (
                  <GripVertical className={cn(
                    "h-3 w-3 text-slate-400 transition-opacity",
                    isCompleted ? "opacity-30" : "opacity-50 group-hover:opacity-100"
                  )} />
                )}
                
                <h3 className={cn(
                  "font-bold text-gt-navy group-hover:text-gt-gold transition-colors duration-300",
                  compact ? "text-sm" : "text-lg",
                  isCompleted && "line-through opacity-60"
                )}>
                  {course.code}
                </h3>
                
                <Badge variant="secondary" className="text-xs">
                  {course.credits || 3} cr
                </Badge>
                
                {course.isOption && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    Option
                  </Badge>
                )}
              </div>
              
              <h4 className={cn(
                "font-medium text-foreground line-clamp-2",
                compact ? "text-xs mb-1" : "text-sm mb-2",
                isCompleted && "opacity-60"
              )}>
                {course.title}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              {onToggleComplete && variant === 'requirements' && (
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={handleToggleComplete}
                  aria-label={`Mark ${course.code} as complete`}
                />
              )}
              
              <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-gt-gold transition-colors duration-300" />
              
              {showActions && (
                <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-3 w-3" />
                      <span className="sr-only">Open course actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={handleViewDetails}>
                        <Info className="h-3 w-3 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onAddToPlan && (
                      <DropdownMenuItem onClick={handleAddToPlan}>
                        <Plus className="h-3 w-3 mr-2" />
                        Add to Plan
                      </DropdownMenuItem>
                    )}
                    {onUpdateStatus && (
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-3 w-3 mr-2" />
                        Update Status
                      </DropdownMenuItem>
                    )}
                    {onRemove && (
                      <DropdownMenuItem onClick={handleRemove} className="text-red-600">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={cn("pt-0 space-y-3", compact ? "px-3 pb-3" : "space-y-4")}>
          {/* Description */}
          {!compact && course.description && (
            <p className={cn(
              "text-sm text-muted-foreground line-clamp-2",
              isCompleted && "opacity-60"
            )}>
              {course.description}
            </p>
          )}
          
          {/* Course Details */}
          <div className="space-y-2">
            {/* Semesters Offered */}
            {!compact && getOfferedSemesters().length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {getOfferedSemesters().map((semester) => (
                    <Badge key={semester} variant="outline" className="text-xs">
                      {semester}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Department and College */}
            {!compact && (course.department || course.college) && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {course.department && (
                    <Badge variant="outline" className="text-xs">
                      {course.department}
                    </Badge>
                  )}
                  {course.college && (
                    <Badge variant="outline" className="text-xs">
                      {course.college}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Prerequisites */}
          {showPrerequisites && course.prerequisites && (
            compact ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Prereq:</span>
                <PrerequisiteBadges prerequisites={course.prerequisites} maxShow={2} />
              </div>
            ) : (
              <PrerequisiteDisplay 
                prerequisites={course.prerequisites} 
                compact={false}
                onCourseClick={(code) => console.log('Navigate to course:', code)}
              />
            )
          )}
          
          {/* Footnotes */}
          {course.footnoteRefs && course.footnoteRefs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {course.footnoteRefs.map(ref => {
                const footnote = footnotes.find(f => f.id === ref);
                return (
                  <Badge key={ref} variant="outline" className="text-xs" title={footnote?.text}>
                    Note {ref}
                  </Badge>
                );
              })}
            </div>
          )}
          
          {/* Grade Display */}
          <AnimatePresence>
            {course.grade && showStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                  Grade: {course.grade}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Course Type and Primary Action */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={course.course_type === 'core' ? 'default' : 'secondary'}
              className="text-xs capitalize"
            >
              {formatCourseType(course.course_type || 'elective')}
            </Badge>
            
            {!showActions && (onViewDetails || onAddToPlan) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewDetails ? handleViewDetails : handleAddToPlan}
                className="text-gt-gold hover:text-gt-gold hover:bg-gt-gold/10 group-hover:translate-x-1 transition-all duration-300 focus:ring-2 focus:ring-gt-navy focus:ring-offset-1"
                aria-label={onViewDetails ? `View details for ${course.code}` : `Add ${course.code} to plan`}
              >
                {onViewDetails ? 'View Details' : 'Add to Plan'}
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

GTCourseCard.displayName = 'GTCourseCard';

export default GTCourseCard;