"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Zap
} from 'lucide-react';
import { useDrag } from 'react-dnd';
import { DragTypes, VisualMinorProgram } from '@/types';
import { useUserAwarePlannerStore } from '@/hooks/useUserAwarePlannerStore';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { CourseRecommendationEngine, AIRecommendationEnhancer, CourseRecommendation } from '@/lib/courseRecommendations';

interface CourseRecommendationsAIProps {
  showAllTabs?: boolean;
}

export const CourseRecommendationsAI: React.FC<CourseRecommendationsAIProps> = ({
  showAllTabs = false
}) => {
  const { user } = useAuth();
  const plannerStore = useUserAwarePlannerStore();
  const { userProfile } = plannerStore;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ready');
  const [minorPrograms, setMinorPrograms] = useState<VisualMinorProgram[]>([]);

  // Intelligent course recommendations
  const [readyToTake, setReadyToTake] = useState<CourseRecommendation[]>([]);
  const [foundationCourses, setFoundationCourses] = useState<CourseRecommendation[]>([]);
  const [threadCourses, setThreadCourses] = useState<CourseRecommendation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<CourseRecommendation[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Memoize threads to prevent infinite re-renders
  const threadsKey = userProfile?.threads?.join(',') || '';

  // Load intelligent course recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user || !userProfile) return;
      
      setCoursesLoading(true);
      try {
        // Get completed and planned courses from planner store
        const completedCourses = plannerStore.getCoursesByStatus('completed');
        const plannedCourses = plannerStore.getCoursesByStatus('planned');
        const inProgressCourses = plannerStore.getCoursesByStatus('in-progress');
        
        // Create recommendation engine
        const engine = new CourseRecommendationEngine(
          completedCourses,
          [...plannedCourses, ...inProgressCourses],
          userProfile.major || '',
          Array.isArray(userProfile.threads) ? userProfile.threads : []
        );

        // Generate different types of recommendations
        const allRecommendations = await engine.generateRecommendations({ maxCourses: 20 });
        
        // Categorize recommendations
        const ready = allRecommendations.filter(r => 
          r.category === 'prerequisite-ready' && r.priority === 'high'
        ).slice(0, 6);
        
        const foundation = allRecommendations.filter(r => 
          r.category === 'foundation' || r.category === 'major-requirement'
        ).slice(0, 6);
        
        const thread = allRecommendations.filter(r => 
          r.category === 'thread-related'
        ).slice(0, 6);
        
        // AI-enhanced recommendations (top picks)
        const topPicks = allRecommendations.slice(0, 5);
        
        // Try AI enhancement
        const userProfileAI = {
          major: userProfile.major || '',
          threads: Array.isArray(userProfile.threads) ? userProfile.threads : [],
          completedCourses: completedCourses.map(c => c.code)
        };
        
        const [enhancedReady, enhancedFoundation, enhancedThread, enhancedAI] = await Promise.all([
          AIRecommendationEnhancer.enhanceRecommendations(ready, userProfileAI, 4),
          AIRecommendationEnhancer.enhanceRecommendations(foundation, userProfileAI, 4),
          AIRecommendationEnhancer.enhanceRecommendations(thread, userProfileAI, 4),
          AIRecommendationEnhancer.enhanceRecommendations(topPicks, userProfileAI, 5)
        ]);
        
        setReadyToTake(enhancedReady);
        setFoundationCourses(enhancedFoundation);
        setThreadCourses(enhancedThread);
        setAiRecommendations(enhancedAI);
        
        console.log('Generated intelligent course recommendations');
      } catch (error) {
        console.error('Error generating recommendations:', error);
        // Fallback to empty arrays
        setReadyToTake([]);
        setFoundationCourses([]);
        setThreadCourses([]);
        setAiRecommendations([]);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadRecommendations();
  }, [user, userProfile?.id, userProfile?.major, threadsKey, plannerStore, userProfile]);


  // Load minor programs
  useEffect(() => {
    const loadMinorPrograms = async () => {
      if (!user || !userProfile?.minors) return;
      
      try {
        const { data: sessionData } = await authService.getSession();
        if (!sessionData.session?.access_token) return;

        const programs: VisualMinorProgram[] = [];
        for (const minorName of userProfile.minors) {
          try {
            const response = await fetch(`/api/degree-programs?major=${encodeURIComponent(minorName)}&degree_type=Minor`, {
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
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

  const DraggableCourseCard: React.FC<{ recommendation: CourseRecommendation; index: number }> = ({ recommendation, index }) => {
    const { course } = recommendation;
    const dragRef = useRef<HTMLDivElement>(null);
    
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
        transition={{ delay: index * 0.1 }}
        className={cn(
          "group cursor-move transition-all duration-200",
          isDragging && "opacity-50 scale-95"
        )}
      >
        <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-[#B3A369]/20 hover:border-l-[#B3A369]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-[#B3A369] transition-colors" />
                  <h4 className="font-bold text-sm text-[#003057]">{course.code}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {course.credits} cr
                  </Badge>
                  <Badge className={cn("text-xs border", getPriorityColor(recommendation.priority))}>
                    {recommendation.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {course.title}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {course.college && (
                  <Badge className={cn("text-xs", getCollegeColor(course.college))}>
                    {course.college.replace('College of ', '')}
                  </Badge>
                )}
                {course.course_type && (
                  <Badge variant="outline" className="text-xs">
                    {course.course_type}
                  </Badge>
                )}
              </div>
              
              {recommendation.reasons.length > 0 && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <p className="text-blue-800 font-medium">Why recommended:</p>
                  <p className="text-blue-700">{recommendation.reasons[0]}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  Score: {recommendation.score}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
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

  const CourseSection: React.FC<{ 
    title: string; 
    recommendations: CourseRecommendation[]; 
    icon: React.ReactNode;
    description?: string;
  }> = ({ title, recommendations, icon, description }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div>
          <h3 className="font-semibold text-[#003057]">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <DraggableCourseCard key={recommendation.course.code} recommendation={recommendation} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recommendations available</p>
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-[#B3A369]" />
          Intelligent Course Recommendations
        </CardTitle>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="ready" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </TabsTrigger>
            <TabsTrigger value="foundation" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Foundation
            </TabsTrigger>
            <TabsTrigger value="threads" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Threads
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              AI Picks
            </TabsTrigger>
          </TabsList>

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
                <TabsContent value="ready" className="mt-0 space-y-6">
                  <CourseSection
                    title="Ready to Take"
                    recommendations={filteredRecommendations(readyToTake)}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    description="Courses with satisfied prerequisites"
                  />
                </TabsContent>

                <TabsContent value="foundation" className="mt-0 space-y-6">
                  <CourseSection
                    title="Foundation & Major Requirements"
                    recommendations={filteredRecommendations(foundationCourses)}
                    icon={<Target className="h-4 w-4 text-[#003057]" />}
                    description="Essential courses for your degree program"
                  />
                </TabsContent>

                <TabsContent value="threads" className="mt-0 space-y-6">
                  <CourseSection
                    title={`${userProfile?.threads?.[0] || 'Specialization'} Courses`}
                    recommendations={filteredRecommendations(threadCourses)}
                    icon={<Star className="h-4 w-4 text-[#B3A369]" />}
                    description="Courses supporting your specialization threads"
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
      </CardContent>
    </Card>
  );
};