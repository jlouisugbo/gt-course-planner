"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Search, 
  Target, 
  Plus, 
  Star,
  GripVertical,
  CheckCircle2,
  Lightbulb,
  Zap,
  MoreVertical,
  Lock,
  Unlock,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes, VisualMinorProgram } from '@/types';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';
import { attachConnectorRef } from '@/components/dnd/dnd-compat';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { CourseRecommendationEngine, AIRecommendationEnhancer, CourseRecommendation } from '@/lib/courseRecommendations';

interface CourseRecommendationsAIProps {
  showAllTabs?: boolean;
  userProfile?: any; // Accept profile as prop to avoid data inconsistency
}

const CourseRecommendationsAIComponent: React.FC<CourseRecommendationsAIProps> = ({
  showAllTabs = false,
  userProfile: propUserProfile
}) => {
  const { user } = useAuth();
  const plannerStore = useUserAwarePlannerStore();
  
  // Use prop profile if provided. Planner store no longer holds userProfile.
  const userProfile = propUserProfile;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [minorPrograms, setMinorPrograms] = useState<VisualMinorProgram[]>([]);

  // Pre-load and cache course recommendations to prevent re-renders
  const [allRecommendations, setAllRecommendations] = useState<CourseRecommendation[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  // Memoize threads to prevent infinite re-renders
  const threadsKey = userProfile?.threads?.join(',') || '';
  
  // Memoize categorized recommendations to prevent re-computation during drag
  const { readyToTake, foundationCourses, threadCourses, aiRecommendations } = useMemo(() => {
    if (!coursesLoaded || allRecommendations.length === 0) {
      return { readyToTake: [], foundationCourses: [], threadCourses: [], aiRecommendations: [] };
    }
    
    const ready = allRecommendations.filter(r => 
      r.category === 'prerequisite-ready' && r.priority === 'high'
    ).slice(0, 6);
    
    const foundation = allRecommendations.filter(r => 
      r.category === 'foundation' || r.category === 'major-requirement'
    ).slice(0, 8);
    
    const thread = allRecommendations.filter(r => 
      r.category === 'thread-related'
    ).slice(0, 6);
    
    const ai = allRecommendations
      .filter(r => r.priority === 'high')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
      
    return { readyToTake: ready, foundationCourses: foundation, threadCourses: thread, aiRecommendations: ai };
  }, [allRecommendations, coursesLoaded]);

  // Load course recommendations once and cache them
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user || !userProfile || coursesLoaded) {
        return;
      }

      // Check if user has a complete profile before loading recommendations
      if (!userProfile.major || !userProfile.full_name || !userProfile.graduation_year) {
        console.log('User profile incomplete - skipping course recommendations', {
          major: userProfile.major,
          full_name: userProfile.full_name,
          graduation_year: userProfile.graduation_year
        });
        setAllRecommendations([]);
        setCoursesLoaded(true);
        return;
      }
      
      setCoursesLoading(true);
      try {
        // Get completed and planned courses from planner store
        const completedCourses = plannerStore.getCoursesByStatus('completed');
        const plannedCourses = plannerStore.getCoursesByStatus('planned');
        const inProgressCourses = plannerStore.getCoursesByStatus('in-progress');
        
        // Create recommendation engine with user's actual profile
        const engine = new CourseRecommendationEngine(
          completedCourses,
          [...plannedCourses, ...inProgressCourses],
          userProfile.major || 'Computer Science',
          Array.isArray(userProfile.threads) ? userProfile.threads : []
        );

        // Generate ALL course recommendations (not filtered by major)
        const recommendations = await engine.generateRecommendations({ maxCourses: 200 });
        setAllRecommendations(recommendations);
        setCoursesLoaded(true);
        
        console.log('Loaded and cached course recommendations');
      } catch (error) {
        console.error('Error loading course recommendations:', error);
        setAllRecommendations([]);
        setCoursesLoaded(true);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadRecommendations();
  }, [user, userProfile?.major, coursesLoaded, plannerStore]); // Minimal dependencies to prevent re-runs


  // Load minor programs
  useEffect(() => {
    const loadMinorPrograms = async () => {
      if (!user || !userProfile?.minors) return;
      
      console.log('🔍 Debug CourseRecommendationsAI - userProfile.major:', userProfile.major);
      console.log('🔍 Debug CourseRecommendationsAI - userProfile.minors:', userProfile.minors);
      
      // Filter out the major from minors (common data issue)
      const actualMinors = userProfile.minors.filter(minor => 
        minor && 
        typeof minor === 'string' && 
        minor.trim().length > 0 &&
        minor !== userProfile.major // Don't treat major as a minor
      );
      
      console.log('🔍 Debug CourseRecommendationsAI - actualMinors after filtering:', actualMinors);
      
      if (actualMinors.length === 0) {
        console.log('No valid minors to load after filtering');
        return;
      }
      
      console.log('Loading minor programs (filtered):', actualMinors);
      
      try {
        const programs: VisualMinorProgram[] = [];
        for (const minorName of actualMinors) {
          try {
            console.log(`🔍 Attempting to fetch minor program: ${minorName}`);

            // API route handles authentication via cookies
            const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(minorName)}&degree_type=Minor`, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              programs.push({
                id: data.id,
                name: data.name,
                requirements: data.requirements || [],
                footnotes: data.footnotes || []
              });
              console.log(`✅ Successfully loaded minor program: ${minorName}`);
            } else {
              console.warn(`❌ Failed to load minor ${minorName}: ${response.status} ${response.statusText}`);
              if (response.status === 500) {
                console.warn(`Minor program "${minorName}" likely doesn't exist in database`);
              }
            }
          } catch (error) {
            console.warn(`Failed to load minor: ${minorName}`, error);
          }
        }
        setMinorPrograms(programs);
      } catch (error) {
        console.error('Error loading minor programs:', error);
      }
    };

    loadMinorPrograms();
  }, [user?.id, userProfile?.minors, user]);

  // Helper function to check prerequisites
  const checkPrerequisites = (course: any, completedCourses: any[]) => {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return { satisfied: true, missing: [] };
    }

    const completedCodes = new Set(completedCourses.map(c => c.code));
    const missingPrereqs: string[] = [];

    // Handle different prerequisite formats
    const prereqs = Array.isArray(course.prerequisites) ? course.prerequisites : [];
    
    for (const prereq of prereqs) {
      if (typeof prereq === 'string') {
        if (!completedCodes.has(prereq)) {
          missingPrereqs.push(prereq);
        }
      } else if (prereq && typeof prereq === 'object' && prereq.code) {
        if (!completedCodes.has(prereq.code)) {
          missingPrereqs.push(prereq.code);
        }
      }
    }

    return {
      satisfied: missingPrereqs.length === 0,
      missing: missingPrereqs
    };
  };

  const DraggableCourseCardComponent: React.FC<{ recommendation: CourseRecommendation; index: number }> = ({ recommendation, index }) => {
    const { course } = recommendation;
    const dragRef = useRef<HTMLDivElement>(null);
    const completedCourses = plannerStore.getCoursesByStatus('completed');
    const prerequisiteCheck = checkPrerequisites(course, completedCourses);
    
    const [{ isDragging }, drag] = useDrag({
      type: DragTypes.COURSE,
      item: { course, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    // Connect the drag source to the element
    useEffect(() => {
      if (dragRef.current) {
        drag(dragRef.current);
      }
    }, [drag]);

    const getCollegeColor = (college: string) => {
      const colors: Record<string, string> = {
        'College of Computing': 'bg-blue-100 text-blue-800',
        'College of Engineering': 'bg-green-100 text-green-800',
        'College of Sciences': 'bg-purple-100 text-purple-800',
        'College of Liberal Arts': 'bg-yellow-100 text-yellow-800',
      };
      return colors[college] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-green-100 text-green-800 border-green-300';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    };

    return (
      <motion.div
        ref={dragRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }} // Faster transitions
        className={cn(
          "group cursor-move transition-all duration-150", // Faster transitions
          isDragging && "opacity-50 scale-95"
        )}
      >
        <Card className={cn(
          "hover:shadow-sm transition-all duration-200 border-l-4",
          recommendation.priority === 'high' && "border-l-green-500",
          recommendation.priority === 'medium' && "border-l-yellow-500",
          recommendation.priority === 'low' && "border-l-gray-400",
          !prerequisiteCheck.satisfied && "border-l-red-500 bg-red-50/20"
        )}>
          <CardContent className="py-2 px-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1 flex-1 min-w-0">
                <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {prerequisiteCheck.satisfied ? (
                      <Unlock className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-red-600 flex-shrink-0" />
                    )}
                    <h4 className="font-bold text-xs text-[#003057] truncate">{course.code}</h4>
                    <Badge variant="secondary" className="text-xs h-4">
                      {course.credits}
                    </Badge>
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      recommendation.priority === 'high' && "bg-green-500",
                      recommendation.priority === 'medium' && "bg-yellow-500",
                      recommendation.priority === 'low' && "bg-gray-400"
                    )} title={`${recommendation.priority} priority`} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    {course.title || course.name}
                  </p>
                  {!prerequisiteCheck.satisfied && prerequisiteCheck.missing.length > 0 && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span className="text-xs text-amber-600 truncate">
                        Need: {prerequisiteCheck.missing.slice(0, 2).join(', ')}{prerequisiteCheck.missing.length > 2 ? '...' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem>
                      <Info className="mr-2 h-4 w-4" />
                      <span className="truncate">{course.title}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>{course.credits} Credits</span>
                    </DropdownMenuItem>
                    {course.college && (
                      <DropdownMenuItem>
                        <span className="mr-2">🏛️</span>
                        <span className="truncate">{course.college}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {prerequisiteCheck.satisfied ? (
                        <>
                          <Unlock className="mr-2 h-4 w-4 text-green-600" />
                          <span className="text-green-600">Ready to take</span>
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4 text-red-600" />
                          <span className="text-red-600">Prerequisites required</span>
                        </>
                      )}
                    </DropdownMenuItem>
                    {!prerequisiteCheck.satisfied && prerequisiteCheck.missing.length > 0 && (
                      <DropdownMenuItem>
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                        <div className="flex flex-col">
                          <span className="text-xs text-amber-600 font-medium">Missing Prerequisites:</span>
                          <span className="text-xs text-muted-foreground">{prerequisiteCheck.missing.join(', ')}</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                  title="Add to planner"
                  disabled={!prerequisiteCheck.satisfied}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Memoize the draggable course card to prevent re-renders during drag
  const DraggableCourseCard = React.memo(DraggableCourseCardComponent);
  DraggableCourseCard.displayName = 'DraggableCourseCard';

  const CourseSection: React.FC<{ 
    title: string; 
    recommendations: CourseRecommendation[]; 
    icon: React.ReactNode;
    description?: string;
  }> = ({ title, recommendations, icon, description }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-1 mb-2">
        <div className="scale-75">{icon}</div>
        <div>
          <h3 className="font-semibold text-xs text-[#003057]">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {recommendations.length > 0 ? (
        <div className="space-y-1">
          {recommendations.map((recommendation, index) => (
            <DraggableCourseCard key={recommendation.course.code} recommendation={recommendation} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <BookOpen className="h-6 w-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">No recommendations available</p>
        </div>
      )}
    </div>
  );

  const filteredRecommendations = (recommendations: CourseRecommendation[]) => {
    if (!searchQuery) return recommendations;
    return recommendations.filter(rec => 
      rec.course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Show profile setup prompt if user profile is incomplete
  const isProfileIncomplete = !userProfile?.major || 
                              (!userProfile?.full_name && !userProfile?.name) || 
                              (!userProfile?.graduation_year && !userProfile?.expectedGraduation);

  // Add drop zone for courses dragged back from semesters
  const [{ isOver: isDropZoneOver }, dropRef] = useDrop(() => ({
    accept: DragTypes.PLANNED_COURSE,
    drop: (item: any) => {
      // Remove course from semester when dropped back to recommendations
      if (item.semesterId && plannerStore.removeCourseFromSemester) {
        plannerStore.removeCourseFromSemester(item.semesterId, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [plannerStore]);

  return (
    <Card ref={attachConnectorRef<HTMLDivElement>(dropRef as any)} className={cn("h-full transition-all", isDropZoneOver && "ring-2 ring-red-400 bg-red-50")}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-[#B3A369]" />
          Intelligent Course Recommendations
        </CardTitle>
        
        {!isProfileIncomplete && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isProfileIncomplete ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[#B3A369]/10 rounded-full flex items-center justify-center mb-4">
              <Lightbulb className="h-8 w-8 text-[#B3A369]" />
            </div>
            <h3 className="text-lg font-semibold text-[#003057] mb-2">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Set up your major and graduation year to get personalized course recommendations.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-[#B3A369] text-[#B3A369] hover:bg-[#B3A369] hover:text-white"
            >
              Complete Profile Setup
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-2 mb-6">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
              className="w-full justify-start text-left"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              All Courses
            </Button>
            <Button
              variant={activeTab === 'ai' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ai')}
              className="w-full justify-start text-left"
            >
              <Zap className="h-4 w-4 mr-2" />
              AI Picks
            </Button>
            <Button
              variant={activeTab === 'required' ? 'default' : 'outline'}
              onClick={() => setActiveTab('required')}
              className="w-full justify-start text-left"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Required
            </Button>
          </div>

          <div className="h-[600px] pr-4 overflow-y-auto">
            {coursesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B3A369] mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Analyzing your academic progress...</p>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-0 space-y-6">
                  <CourseSection
                    title="All Available Courses"
                    recommendations={filteredRecommendations([...readyToTake, ...foundationCourses, ...threadCourses])}
                    icon={<BookOpen className="h-4 w-4 text-[#003057]" />}
                    description="All recommended courses based on your profile"
                  />
                </TabsContent>

                <TabsContent value="ai" className="mt-0 space-y-6">
                  <CourseSection
                    title="AI-Enhanced Recommendations"
                    recommendations={filteredRecommendations(aiRecommendations)}
                    icon={<Zap className="h-4 w-4 text-purple-600" />}
                    description="Personalized picks based on your academic profile"
                  />
                </TabsContent>

                <TabsContent value="required" className="mt-0 space-y-6">
                  <CourseSection
                    title="Required Courses"
                    recommendations={filteredRecommendations(foundationCourses)}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    description="Essential courses for your degree program"
                  />
                </TabsContent>
              </>
            )}

            {showAllTabs && (
              <TabsContent value="minors" className="mt-0 space-y-6">
                {minorPrograms.length > 0 ? (
                  minorPrograms.map((minor) => (
                    <div key={minor.id} className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Plus className="h-4 w-4 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-[#003057]">{minor.name}</h3>
                          <p className="text-xs text-muted-foreground">Minor requirements</p>
                        </div>
                      </div>
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Minor courses loading...
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No minors selected</p>
                  </div>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export const CourseRecommendationsAI = React.memo(CourseRecommendationsAIComponent);
CourseRecommendationsAI.displayName = 'CourseRecommendationsAI';