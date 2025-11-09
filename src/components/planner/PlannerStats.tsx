"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Target,
  GraduationCap,
  Clock,
  Award
} from 'lucide-react';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import { cn } from '@/lib/utils';

export const PlannerStats: React.FC = () => {
  const plannerStore = usePlannerStore();
  const { semesters } = plannerStore as any;

  const safeSemesters = useMemo(() => {
    return semesters && typeof semesters === 'object' ? semesters : {};
  }, [semesters]);

  const safeUserProfile = useMemo(() => {
    return null as any;
  }, []);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const semesterArray = Object.values(safeSemesters)
      .filter(semester => 
        semester && 
        typeof semester === 'object' &&
        typeof semester.year === 'number'
      );

    const totalSemesters = semesterArray.length;
    const completedSemesters = semesterArray.filter(sem => Boolean(sem.isCompleted)).length;
    const currentSemesters = semesterArray.filter(sem => Boolean(sem.isActive)).length;
    
    const totalCreditsPlanned = semesterArray.reduce((sum, sem) => {
      const credits = typeof sem.totalCredits === 'number' ? sem.totalCredits : 0;
      return sum + credits;
    }, 0);

    const completedCredits = semesterArray
      .filter(sem => Boolean(sem.isCompleted))
      .reduce((sum, sem) => {
        const credits = typeof sem.totalCredits === 'number' ? sem.totalCredits : 0;
        return sum + credits;
      }, 0);

    const averageCreditsPerSemester = totalSemesters > 0 ? totalCreditsPlanned / totalSemesters : 0;
    
    const heavySemesters = semesterArray.filter(sem => {
      const credits = typeof sem.totalCredits === 'number' ? sem.totalCredits : 0;
      return credits > 18;
    }).length;

    const lightSemesters = semesterArray.filter(sem => {
      const credits = typeof sem.totalCredits === 'number' ? sem.totalCredits : 0;
      return credits < 12;
    }).length;

    const progressPercentage = totalSemesters > 0 ? (completedSemesters / totalSemesters) * 100 : 0;

    // Credit distribution
    const creditDistribution = semesterArray.map(sem => {
      const credits = typeof sem.totalCredits === 'number' ? sem.totalCredits : 0;
      const season = typeof sem.season === 'string' ? sem.season : 'Unknown';
      const year = typeof sem.year === 'number' ? sem.year : 0;
      return {
        label: `${season} ${year}`,
        credits,
        isCompleted: Boolean(sem.isCompleted),
        isCurrent: Boolean(sem.isActive)
      };
    }).sort((a, b) => {
      if (a.label.includes('Fall')) return -1;
      if (b.label.includes('Fall')) return 1;
      return 0;
    });

    return {
      totalSemesters,
      completedSemesters,
      currentSemesters,
      totalCreditsPlanned,
      completedCredits,
      averageCreditsPerSemester,
      heavySemesters,
      lightSemesters,
      progressPercentage,
      creditDistribution,
      remainingCredits: Math.max(0, 120 - completedCredits),
      remainingSemesters: Math.max(0, totalSemesters - completedSemesters)
    };
  }, [safeSemesters]);

  // Thread/specialization progress
  const threadProgress = useMemo(() => {
    if (!safeUserProfile?.threads || !Array.isArray(safeUserProfile.threads)) {
      return [];
    }

    return safeUserProfile.threads.map((thread: string) => ({
      name: thread,
      progress: Math.floor(Math.random() * 80) + 20, // Mock progress - would come from requirements
      coursesCompleted: Math.floor(Math.random() * 5) + 1,
      totalCourses: Math.floor(Math.random() * 3) + 6
    }));
  }, [safeUserProfile]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'stable';
    color?: 'default' | 'success' | 'warning' | 'danger';
    progress?: number;
  }> = ({ title, value, subtitle, icon, trend, color = 'default', progress }) => {
    const colorClasses = {
      default: 'text-[#003057]',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-lg bg-opacity-10", {
              'bg-[#003057]': color === 'default',
              'bg-green-600': color === 'success',
              'bg-yellow-600': color === 'warning',
              'bg-red-600': color === 'danger'
            })}>
              {icon}
            </div>
            {trend && (
              <div className={cn("flex items-center gap-1 text-xs", {
                'text-green-600': trend === 'up',
                'text-red-600': trend === 'down',
                'text-gray-600': trend === 'stable'
              })}>
                <TrendingUp className={cn("h-3 w-3", {
                  'rotate-0': trend === 'up',
                  'rotate-180': trend === 'down',
                  'rotate-90': trend === 'stable'
                })} />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className={cn("text-2xl font-bold", colorClasses[color])}>
              {value}
            </div>
            <div className="text-sm font-medium text-gray-900">{title}</div>
            {subtitle && (
              <div className="text-xs text-gray-500">{subtitle}</div>
            )}
            {typeof progress === 'number' && (
              <Progress value={progress} className="mt-2 h-2" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Academic Progress"
          value={`${Math.round(stats.progressPercentage)}%`}
          subtitle={`${stats.completedSemesters}/${stats.totalSemesters} semesters`}
          icon={<GraduationCap className="h-5 w-5 text-[#B3A369]" />}
          color="default"
          progress={stats.progressPercentage}
          trend="up"
        />

        <StatCard
          title="Credits Completed"
          value={stats.completedCredits}
          subtitle={`${stats.remainingCredits} remaining`}
          icon={<BookOpen className="h-5 w-5 text-green-600" />}
          color="success"
          progress={(stats.completedCredits / 120) * 100}
        />

        <StatCard
          title="Average Load"
          value={`${stats.averageCreditsPerSemester.toFixed(1)}`}
          subtitle="credits per semester"
          icon={<BarChart3 className="h-5 w-5 text-[#003057]" />}
          color="default"
        />

        <StatCard
          title="Current GPA"
          value={'0.00'}
          subtitle="cumulative"
          icon={<Award className="h-5 w-5 text-[#B3A369]" />}
          color="default"
        />
      </div>

      {/* Workload Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Workload Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.heavySemesters}</div>
              <div className="text-sm text-red-800">Heavy Semesters</div>
              <div className="text-xs text-red-600 mt-1">&gt;18 credits</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalSemesters - stats.heavySemesters - stats.lightSemesters}
              </div>
              <div className="text-sm text-green-800">Balanced Semesters</div>
              <div className="text-xs text-green-600 mt-1">12-18 credits</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.lightSemesters}</div>
              <div className="text-sm text-yellow-800">Light Semesters</div>
              <div className="text-xs text-yellow-600 mt-1">&lt;12 credits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thread Progress */}
      {threadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#B3A369]" />
              Thread Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threadProgress.map((thread, index) => (
                <motion.div
                  key={thread.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#003057]">{thread.name}</div>
                    <Badge variant="outline">
                      {thread.coursesCompleted}/{thread.totalCourses} courses
                    </Badge>
                  </div>
                  <Progress value={thread.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {thread.progress}% complete
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#003057]" />
            Credit Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.creditDistribution.slice(0, 8).map((sem, index) => (
              <motion.div
                key={sem.label}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ delay: index * 0.1 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium", {
                      'text-green-600': sem.isCompleted,
                      'text-[#B3A369]': sem.isCurrent,
                      'text-gray-600': !sem.isCompleted && !sem.isCurrent
                    })}>
                      {sem.label}
                    </span>
                    {sem.isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    {sem.isCurrent && <Clock className="h-3 w-3 text-[#B3A369]" />}
                  </div>
                  <span className="font-medium">{sem.credits} cr</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all duration-300", {
                      'bg-green-500': sem.isCompleted,
                      'bg-[#B3A369]': sem.isCurrent,
                      'bg-gray-400': !sem.isCompleted && !sem.isCurrent
                    })}
                    style={{ width: `${Math.min((sem.credits / 20) * 100, 100)}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graduation Projection */}
      <Card className="border-[#B3A369] bg-gradient-to-r from-[#B3A369]/5 to-[#003057]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#003057]">
            <GraduationCap className="h-5 w-5 text-[#B3A369]" />
            Graduation Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold text-[#B3A369] mb-1">
                {'TBD'}
              </div>
              <div className="text-sm text-muted-foreground mb-3">Expected Graduation</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Credits Remaining:</span>
                  <span className="font-medium">{stats.remainingCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Semesters Remaining:</span>
                  <span className="font-medium">{stats.remainingSemesters}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#003057] to-[#B3A369] flex items-center justify-center mb-3">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <div className="text-xs text-muted-foreground">
                  On track for graduation
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};