"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Plus, 
  Minus, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  Search
} from 'lucide-react';

interface CourseActivity {
  id: string;
  action: 'added' | 'removed' | 'searched' | 'viewed';
  course_code: string;
  course_title?: string;
  user_email?: string;
  timestamp: string;
  metadata?: {
    semester?: string;
    plan_type?: string;
    search_query?: string;
  };
}

interface CourseStats {
  mostAdded: Array<{
    course_code: string;
    course_title?: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  mostSearched: Array<{
    query: string;
    count: number;
    timestamp: string;
  }>;
  totalCourseActions: number;
  activeUsers: number;
}

interface LiveCourseActivityProps {
  className?: string;
  maxItems?: number;
  refreshInterval?: number;
}

const actionIcons = {
  added: Plus,
  removed: Minus,
  searched: Search,
  viewed: BookOpen,
};

const actionColors = {
  added: 'bg-green-500 text-white',
  removed: 'bg-red-500 text-white',
  searched: 'bg-blue-500 text-white',
  viewed: 'bg-purple-500 text-white',
};

const actionLabels = {
  added: 'Added',
  removed: 'Removed',
  searched: 'Searched',
  viewed: 'Viewed',
};

export default function LiveCourseActivity({ 
  className = '', 
  maxItems = 15,
  refreshInterval = 30000 
}: LiveCourseActivityProps) {
  const [activities, setActivities] = useState<CourseActivity[]>([]);
  const [stats, setStats] = useState<CourseStats>({
    mostAdded: [],
    mostSearched: [],
    totalCourseActions: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'popular'>('activity');

  const fetchCourseActivity = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }

      // Fetch both realtime activity and course statistics
      const [realtimeResponse, statsResponse] = await Promise.all([
        fetch('/api/analytics/report?type=realtime'),
        fetch('/api/analytics/course-stats?hours=24')
      ]);

      if (!realtimeResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch course activity data');
      }

      const [realtimeData, statsData] = await Promise.all([
        realtimeResponse.json(),
        statsResponse.json()
      ]);

      // Filter course-related activities
      const courseActivities = (realtimeData.recentActions || [])
        .filter((action: any) => 
          ['course_add', 'course_remove', 'course_search', 'course_view'].includes(action.type)
        )
        .map((action: any) => ({
          id: action.id || `${action.timestamp}-${action.type}`,
          action: action.type.replace('course_', '') as CourseActivity['action'],
          course_code: action.item || 'Unknown',
          course_title: action.metadata?.course_title,
          user_email: action.user_email,
          timestamp: action.timestamp,
          metadata: action.metadata
        }))
        .slice(0, maxItems);

      setActivities(courseActivities);

      // Process stats from course-stats API
      const processedStats: CourseStats = {
        mostAdded: (statsData.popular_courses || []).slice(0, 5).map((course: any) => ({
          course_code: course.course_code,
          course_title: course.course_title,
          count: course.additions || 0,
          trend: course.trend || 'stable'
        })),
        mostSearched: (statsData.popular_searches || []).slice(0, 5),
        totalCourseActions: courseActivities.length,
        activeUsers: realtimeData.activeUsers || 0
      };

      setStats(processedStats);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch course activity:', err);
      setError('Failed to fetch course activity data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [maxItems]);

  useEffect(() => {
    // Initial fetch
    fetchCourseActivity();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchCourseActivity();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, maxItems, fetchCourseActivity]);

  const handleManualRefresh = () => {
    fetchCourseActivity(true);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return time.toLocaleDateString();
  };

  const truncateEmail = (email?: string) => {
    if (!email) return 'Anonymous';
    const [username] = email.split('@');
    return username.length > 8 ? `${username.substring(0, 8)}...` : username;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gt-navy">
            <BookOpen className="h-5 w-5 text-gt-gold" />
            Live Course Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gt-navy">
            <BookOpen className="h-5 w-5 text-gt-gold" />
            Live Course Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === 'activity' 
                    ? 'bg-white text-gt-navy shadow-sm' 
                    : 'text-gray-600 hover:text-gt-navy'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeTab === 'popular' 
                    ? 'bg-white text-gt-navy shadow-sm' 
                    : 'text-gray-600 hover:text-gt-navy'
                }`}
              >
                Popular
              </button>
            </div>
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {stats.activeUsers} active
              </span>
              <span>{stats.totalCourseActions} actions/hr</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              {error}
            </div>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'activity' ? (
              activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent course activity</p>
                  <p className="text-xs mt-1">Course interactions will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => {
                    const IconComponent = actionIcons[activity.action] || BookOpen;
                    const colorClass = actionColors[activity.action] || 'bg-gray-500 text-white';
                    const label = actionLabels[activity.action] || 'Action';

                    return (
                      <div
                        key={`${activity.id}-${activity.timestamp}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                      >
                        <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center shadow-sm`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {label}
                            </Badge>
                            <span className="text-sm font-medium text-gt-navy">
                              {activity.course_code}
                            </span>
                            {activity.user_email && (
                              <span className="text-xs text-gray-500">
                                by {truncateEmail(activity.user_email)}
                              </span>
                            )}
                          </div>
                          
                          {activity.course_title && (
                            <p className="text-xs text-gray-600 truncate">
                              {activity.course_title}
                            </p>
                          )}
                          
                          {activity.metadata && (
                            <div className="flex items-center gap-2 mt-1">
                              {activity.metadata.semester && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {activity.metadata.semester}
                                </span>
                              )}
                              {activity.metadata.search_query && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded max-w-20 truncate">
                                  "{activity.metadata.search_query}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* Most Added Courses */}
                <div>
                  <h4 className="text-sm font-semibold text-gt-navy mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Most Added Courses (24h)
                  </h4>
                  {stats.mostAdded.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No course additions recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.mostAdded.map((course, index) => (
                        <div
                          key={course.course_code}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">
                              {index + 1}
                            </span>
                            <div>
                              <span className="font-medium text-gt-navy">
                                {course.course_code}
                              </span>
                              {course.course_title && (
                                <p className="text-xs text-gray-600 truncate max-w-48">
                                  {course.course_title}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(course.trend)}
                            <Badge variant="secondary" className="text-xs">
                              +{course.count}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Most Searched */}
                <div>
                  <h4 className="text-sm font-semibold text-gt-navy mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-500" />
                    Popular Searches (24h)
                  </h4>
                  {stats.mostSearched.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No search queries recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.mostSearched.map((search, index) => (
                        <div
                          key={`${search.query}-${index}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-400 w-6">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium truncate max-w-32">
                              "{search.query}"
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {search.count} searches
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}