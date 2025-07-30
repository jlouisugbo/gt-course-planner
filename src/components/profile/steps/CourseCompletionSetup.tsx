"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, Users } from "lucide-react";
import { UserProfile } from "@/types";
import { VisualDegreeProgram, VisualCourse } from "@/types/requirements";
import { supabase } from "@/lib/supabaseClient";
import { CompletableCourseCard } from "../components/CompletableCourseCard";
import { CompletableGroupCard } from "../components/CompletableGroupCard";
import { useCompletionTracking } from "@/hooks/useCompletionTracking";

interface CourseCompletionSetupProps {
  profile: Partial<UserProfile>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
}

export const CourseCompletionSetup: React.FC<CourseCompletionSetupProps> = ({
  profile,
  setProfile
}) => {
  const [degreeProgram, setDegreeProgram] = useState<VisualDegreeProgram | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use the completion tracking hook instead of local state
  const { 
    completedCourses, 
    completedGroups, 
    toggleCourseCompletion
  } = useCompletionTracking();

  // Fetch degree program based on user's major
  useEffect(() => {
    console.log('🔍 CourseCompletionSetup useEffect triggered');
    console.log('📋 Profile data:', { 
      major: profile.major, 
      name: profile.name,
      hasProfile: !!profile
    });
    
    // Add debugger for debugging
    debugger;
    
    const fetchDegreeProgram = async () => {
      if (!profile.major) {
        console.log('❌ No major found in profile, skipping degree program fetch');
        console.log('🔍 Full profile object:', profile);
        setLoading(false);
        return;
      }

      console.log('✅ Major found, starting degree program fetch');
      setLoading(true);
      try {
        console.log('Looking for degree program with major:', profile.major);

        // Query degree program that matches the major title
        const { data, error } = await supabase
          .from('degree_programs')
          .select('*')
          .eq('name', profile.major)
          .eq('degree_type', 'BS')
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching specific degree program:', error);
          console.log('Query was for major:', profile.major);
          
          // Try a fallback approach - case insensitive search
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('degree_programs')
            .select('*')
            .ilike('name', profile.major || '')
            .eq('is_active', true)
            .limit(1);
            
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            console.log('Found fallback degree program:', fallbackData[0].name);
            const data = fallbackData[0];
            const requirements = data.requirements || [];
            const structuredProgram: VisualDegreeProgram = {
              id: data.id,
              name: data.name,
              degreeType: data.degree_type || 'Major',
              college: data.college_id ? `College ${data.college_id}` : undefined,
              totalCredits: data.total_credits,
              requirements: requirements,
              footnotes: []
            };
            setDegreeProgram(structuredProgram);
          } else {
            setDegreeProgram(null);
          }
        } else if (data) {
          // Parse the requirements JSON and structure it as VisualDegreeProgram
          const requirements = data.requirements || [];
          const structuredProgram: VisualDegreeProgram = {
            id: data.id,
            name: data.name,
            degreeType: data.degree_type || 'Major',
            college: data.college_id ? `College ${data.college_id}` : undefined,
            totalCredits: data.total_credits,
            requirements: requirements,
            footnotes: []
          };
          setDegreeProgram(structuredProgram);
        }
      } catch (error) {
        console.error('Exception fetching degree program:', error);
        setDegreeProgram(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDegreeProgram();
  }, [profile.major, profile]);

  // Completion data is now handled by useCompletionTracking hook
  // No need to update profile with completion data
  useEffect(() => {
    // This effect is no longer needed as completion tracking is handled by Zustand
    console.log('Completion data updated:', {
      courses: completedCourses.size,
      groups: completedGroups.size
    });
  }, [completedCourses, completedGroups, setProfile]);

  const handleCourseToggle = (courseCode: string) => {
    toggleCourseCompletion(courseCode);
  };



  // Function to check if a course/group is satisfied (recursive for nested groups)
  const isCourseSatisfied = useCallback((course: VisualCourse): boolean => {
    if (course.courseType === 'regular' || course.courseType === 'flexible') {
      return completedCourses.has(course.code);
    } else if (course.courseType === 'and_group') {
      // For AND groups, all nested courses must be completed
      return course.groupCourses?.every(subCourse => 
        isCourseSatisfied(subCourse)
      ) || false;
    } else if (course.courseType === 'or_group') {
      // For OR groups, at least one nested course/group must be completed
      return course.groupCourses?.some(subCourse => 
        isCourseSatisfied(subCourse)
      ) || false;
    } else if (course.courseType === 'selection') {
      // For SELECT groups, the required number of options must be completed
      const satisfiedCount = course.selectionOptions?.filter(option =>
        isCourseSatisfied(option)
      ).length || 0;
      return satisfiedCount >= (course.selectionCount || 1);
    }
    return false;
  }, [completedCourses]);

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    if (!degreeProgram) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    const countCourses = (courses: VisualCourse[]) => {
      courses.forEach(course => {
        if (course.courseType === 'regular' || course.courseType === 'flexible') {
          total++;
          if (completedCourses.has(course.code)) completed++;
        } else {
          // For groups, count as one requirement
          total++;
          if (isCourseSatisfied(course)) completed++;
        }
      });
    };

    degreeProgram.requirements.forEach(category => {
      countCourses(category.courses);
    });

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [degreeProgram, completedCourses, isCourseSatisfied]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
          <p className="text-slate-600">Loading degree requirements...</p>
        </div>
      </motion.div>
    );
  }

  if (!degreeProgram) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800 mb-2">No Requirements Found</h3>
            <p className="text-amber-700">
              We couldn&apos;t find degree requirements for &quot;{profile.major}&quot;. 
              You can skip this step and complete setup.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-[#B3A369]" />
          <h3 className="text-lg font-semibold">Course Completion Status</h3>
        </div>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">{degreeProgram.name}</h4>
                <p className="text-sm text-blue-700">
                  Mark the courses you have already completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {completionStats.percentage}%
                </div>
                <div className="text-sm text-blue-700">
                  {completionStats.completed} of {completionStats.total} completed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Categories */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {degreeProgram.requirements.map((category, index) => (
          <Card key={index} className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span>{category.name}</span>
                <Badge variant="outline" className="text-xs">
                  {category.courses.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Grid layout for compact course cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {category.courses.map((course, courseIndex) => {
                  const key = `${course.code}-${courseIndex}`;
                  
                  if (course.courseType === 'regular' || course.courseType === 'flexible') {
                    return (
                      <CompletableCourseCard
                        key={key}
                        course={course}
                        isCompleted={completedCourses.has(course.code)}
                        onToggle={() => handleCourseToggle(course.code)}
                      />
                    );
                  } else {
                    // For groups, render them in a separate section below the grid
                    return null;
                  }
                })}
              </div>
              
              {/* Render groups separately with full width */}
              <div className="mt-4 space-y-3">
                {category.courses.map((course, courseIndex) => {
                  const key = `${course.code}-${courseIndex}`;
                  
                  if (course.courseType !== 'regular' && course.courseType !== 'flexible') {
                    return (
                      <CompletableGroupCard
                        key={key}
                        course={course}
                        completedCourses={completedCourses}
                        onCourseToggle={handleCourseToggle}
                        isGroupSatisfied={isCourseSatisfied(course)}
                      />
                    );
                  } else {
                    return null;
                  }
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Almost Done!</h4>
              <p className="text-sm text-green-700">
                Review your completed courses and click &quot;Complete Setup&quot; when ready.
                You can always update this information later in your profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};