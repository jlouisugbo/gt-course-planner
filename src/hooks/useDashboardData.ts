"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { useCompletionTracking } from '@/hooks/useCompletionTracking';

export interface DashboardUser {
    name: string;
    email: string;
    major: string;
    graduationYear: number;
    startYear: number;
    avatar?: string;
}

export interface DashboardStats {
    totalCredits: number;
    creditsCompleted: number;
    creditsInProgress: number;
    creditsPlanned: number;
    currentGPA: number;
    targetGPA: number;
    coursesCompleted: number;
    coursesRemaining: number;
    progressPercentage: number;
    onTrackForGraduation: boolean;
}

export interface DashboardActivity {
    id: string;
    type: 'course_completed' | 'requirement_met' | 'semester_planned' | 'gpa_updated';
    title: string;
    description: string;
    timestamp: Date;
    icon: string;
}

export interface DashboardData {
    user: DashboardUser | null;
    stats: DashboardStats;
    activities: DashboardActivity[];
    upcomingDeadlines: Array<{
        id: string;
        title: string;
        date: Date;
        daysLeft: number;
        type: 'registration' | 'deadline' | 'graduation';
    }>;
    gpaHistory: Array<{
        semester: string;
        gpa: number;
        credits: number;
    }>;
    isLoading: boolean;
    error: string | null;
}

export const useDashboardData = (): DashboardData => {
    const { user: authUser } = useAuth();
    const { 
        semesters, 
        academicProgress, 
        recentActivity,
        getAllCourses,
        getCoursesByStatus,
        calculateGPA,
        getGPAHistory,
        getUpcomingDeadlines 
    } = usePlannerStore();
    const { completedCourses: completedCourseCodes } = useCompletionTracking();
    
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [courseCredits, setCourseCredits] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user profile data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!authUser) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const { data: userRecord, error: userError } = await supabase
                    .from('users')
                    .select('full_name, major, plan_settings')
                    .eq('auth_id', authUser.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user data:', userError);
                    setError('Failed to load user profile');
                    return;
                }

                if (userRecord) {
                    // Extract data from the correct structure
                    const planSettings = userRecord.plan_settings || {};
                    const currentYear = new Date().getFullYear();
                    
                    setUser({
                        name: userRecord.full_name || authUser.user_metadata?.full_name || 'Student',
                        email: authUser.email || '',
                        major: userRecord.major || planSettings.major || 'Undeclared',
                        graduationYear: planSettings.graduation_year || currentYear + 4,
                        startYear: planSettings.start_year || currentYear,
                        avatar: authUser.user_metadata?.avatar_url
                    });
                }
            } catch (err) {
                console.error('Error in fetchUserData:', err);
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [authUser]);

    // Fetch credits for completed courses
    useEffect(() => {
        const fetchCourseCredits = async () => {
            if (completedCourseCodes.size === 0) {
                setCourseCredits(new Map());
                return;
            }

            try {
                const { data: courses, error } = await supabase
                    .from('courses')
                    .select('code, credits')
                    .in('code', Array.from(completedCourseCodes));

                if (error) {
                    console.error('Error fetching course credits:', error);
                    return;
                }

                const creditsMap = new Map<string, number>();
                courses?.forEach(course => {
                    creditsMap.set(course.code, course.credits || 3);
                });

                // Add default credits for courses not found in database
                completedCourseCodes.forEach(courseCode => {
                    if (!creditsMap.has(courseCode)) {
                        creditsMap.set(courseCode, 3); // Default 3 credits
                    }
                });

                setCourseCredits(creditsMap);
            } catch (err) {
                console.error('Error fetching course credits:', err);
            }
        };

        fetchCourseCredits();
    }, [completedCourseCodes]);

    // Calculate dashboard stats using completion tracking data
    const stats: DashboardStats = useMemo(() => {
        const allCourses = getAllCourses();
        const inProgressCourses = getCoursesByStatus('in-progress');
        const plannedCourses = getCoursesByStatus('planned');

        // Calculate completed credits from completion tracking system
        const creditsCompleted = Array.from(completedCourseCodes).reduce((sum, courseCode) => {
            return sum + (courseCredits.get(courseCode) || 3);
        }, 0);
        
        const creditsInProgress = inProgressCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
        const creditsPlanned = plannedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
        const totalCredits = creditsCompleted + creditsInProgress + creditsPlanned;
        
        const requiredCredits = academicProgress.totalCreditsRequired || 126;
        const progressPercentage = requiredCredits > 0 ? (creditsCompleted / requiredCredits) * 100 : 0;
        
        const currentGPA = calculateGPA();
        const targetGPA = 3.5; // Could be user-defined
        
        // Estimate remaining courses (assuming average 3 credits per course)
        const coursesRemaining = Math.max(0, Math.ceil((requiredCredits - creditsCompleted) / 3));
        
        // Check if on track (simplified logic)
        const currentYear = new Date().getFullYear();
        const yearsSinceStart = user ? currentYear - user.startYear : 1;
        const expectedProgress = (yearsSinceStart / 4) * 100;
        const onTrackForGraduation = progressPercentage >= (expectedProgress * 0.9); // 90% of expected

        return {
            totalCredits: requiredCredits,
            creditsCompleted,
            creditsInProgress,
            creditsPlanned,
            currentGPA,
            targetGPA,
            coursesCompleted: completedCourseCodes.size,
            coursesRemaining,
            progressPercentage: Math.min(progressPercentage, 100),
            onTrackForGraduation
        };
    }, [getAllCourses, getCoursesByStatus, academicProgress, calculateGPA, user, completedCourseCodes, courseCredits]);

    // Transform recent activities
    const activities: DashboardActivity[] = useMemo(() => {
        return recentActivity.slice(0, 10).map((activity, index) => ({
            id: activity.id?.toString() || index.toString(),
            type: activity.type as any || 'course_completed',
            title: activity.title || 'Activity',
            description: activity.description || '',
            timestamp: activity.timestamp || new Date(),
            icon: getActivityIcon(activity.type)
        }));
    }, [recentActivity]);

    // Get upcoming deadlines
    const upcomingDeadlines = useMemo(() => {
        return getUpcomingDeadlines().slice(0, 5).map(deadline => ({
            id: deadline.id?.toString() || Math.random().toString(),
            title: deadline.title || 'Deadline',
            date: new Date(deadline.date),
            daysLeft: deadline.daysLeft,
            type: deadline.type as any || 'deadline'
        }));
    }, [getUpcomingDeadlines]);

    // Get GPA history
    const gpaHistory = useMemo(() => {
        return getGPAHistory().slice(-8); // Last 8 semesters
    }, [getGPAHistory]);

    return {
        user,
        stats,
        activities,
        upcomingDeadlines,
        gpaHistory,
        isLoading,
        error
    };
};

function getActivityIcon(type: string): string {
    switch (type) {
        case 'course_completed':
        case 'requirement_completed':
            return '✅';
        case 'course_added':
            return '📚';
        case 'semester_planned':
            return '📅';
        case 'gpa_updated':
            return '📊';
        default:
            return '📝';
    }
}