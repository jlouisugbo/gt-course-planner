"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  User, 
  Search, 
  BookOpen, 
  MousePointer, 
  RefreshCw,
  Clock,
  Eye,
  Plus,
  Minus
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'login' | 'page_view' | 'course_search' | 'course_add' | 'course_remove' | 'requirement_view';
  user_id?: string;
  user_email?: string;
  item?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface LiveActivityFeedProps {
  className?: string;
  maxItems?: number;
  refreshInterval?: number;
}

const activityIcons = {
  login: User,
  page_view: Eye,
  course_search: Search,
  course_add: Plus,
  course_remove: Minus,
  requirement_view: BookOpen,
};

const activityColors = {
  login: 'bg-green-500',
  page_view: 'bg-blue-500',
  course_search: 'bg-purple-500',
  course_add: 'bg-gt-gold',
  course_remove: 'bg-red-500',
  requirement_view: 'bg-gt-navy',
};

const activityLabels = {
  login: 'User Login',
  page_view: 'Page View',
  course_search: 'Course Search',
  course_add: 'Course Added',
  course_remove: 'Course Removed',
  requirement_view: 'Requirements Viewed',
};

export default function LiveActivityFeed({ 
  className = '', 
  maxItems = 20,
  refreshInterval = 30000 
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivities = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (loading) {
        // Only set loading on initial load
      }

      const response = await fetch('/api/analytics/report?type=realtime');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.recentActions && Array.isArray(data.recentActions)) {
        setActivities(data.recentActions.slice(0, maxItems));
        setError(null);
      } else {
        // Fallback to empty array if no recent actions
        setActivities([]);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to fetch activity data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [maxItems, loading]);

  useEffect(() => {
    // Initial fetch
    fetchActivities();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchActivities();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, maxItems, fetchActivities]);

  const handleManualRefresh = () => {
    fetchActivities(true);
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
    return username.length > 10 ? `${username.substring(0, 10)}...` : username;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gt-navy">
            <Activity className="h-5 w-5 text-gt-gold animate-pulse" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
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
            <Activity className="h-5 w-5 text-gt-gold animate-pulse" />
            Live Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <RefreshCw 
                className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              {error}
            </div>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Activities will appear here as users interact with the app</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const IconComponent = activityIcons[activity.type] || MousePointer;
              const colorClass = activityColors[activity.type] || 'bg-gray-500';
              const label = activityLabels[activity.type] || 'Unknown Action';

              return (
                <div
                  key={`${activity.id || activity.timestamp}-${activity.type}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                >
                  <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white shadow-sm`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {label}
                      </Badge>
                      {activity.user_email && (
                        <span className="text-xs text-gt-navy font-medium">
                          {truncateEmail(activity.user_email)}
                        </span>
                      )}
                    </div>
                    
                    {activity.item && (
                      <p className="text-sm text-gray-600 truncate">
                        {activity.item}
                      </p>
                    )}
                    
                    {activity.metadata && (
                      <div className="flex items-center gap-2 mt-1">
                        {activity.metadata.page && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {activity.metadata.page}
                          </span>
                        )}
                        {activity.metadata.query && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded max-w-24 truncate">
                            &ldquo;{activity.metadata.query}&rdquo;
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
        )}
      </CardContent>
    </Card>
  );
}