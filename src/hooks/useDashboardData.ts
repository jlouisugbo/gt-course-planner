"use client";

// Minimal types and hook to satisfy dashboard components during refactor
export type DashboardActivity = {
  id: string;
  type: 'course_completed' | 'course_added' | 'semester_planned' | 'gpa_updated' | string;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: string;
};

export type DashboardStats = {
  creditsCompleted: number;
  creditsInProgress: number;
  creditsPlanned: number;
  totalCreditsRequired: number;
  totalCredits: number;
  currentGPA: number;
  targetGPA: number;
  progressPercentage: number;
  onTrack: boolean;
  onTrackForGraduation: boolean;
  coursesRemaining: number;
  coursesCompleted: number;
};

export type DashboardUser = {
  name?: string;
  email?: string;
  major?: string;
  startYear?: number;
  graduationYear?: number;
  avatar?: string;
};

export type Deadline = {
  id: string;
  title: string;
  dueDate: Date;
  daysLeft: number;
};

export function useDashboardData() {
  const user: DashboardUser = { name: 'Student Name', major: 'Undeclared', startYear: new Date().getFullYear() - 1, graduationYear: new Date().getFullYear() + 3 };
  const academicProgress: DashboardStats = {
    creditsCompleted: 0,
    creditsInProgress: 0,
    creditsPlanned: 0,
    totalCreditsRequired: 126,
    totalCredits: 126,
    currentGPA: 0,
    targetGPA: 3.5,
    progressPercentage: 0,
    onTrack: false,
    onTrackForGraduation: false,
    coursesRemaining: 0,
    coursesCompleted: 0,
  };

  return {
    user,
    academicProgress,
    recentActivity: [] as DashboardActivity[],
    courses: { completed: [] as string[], planned: [] as string[], inProgress: [] as string[], remainingCount: 0 },
    gpaHistory: [] as Array<{ semester: string; gpa: number }>,
    upcomingDeadlines: [] as Deadline[],
  };
}
