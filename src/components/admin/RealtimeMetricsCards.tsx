"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  Eye, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MetricsData {
  activeUsers: number;
  activeSessions: number;
  pageViewsLast24h: number;
  avgSessionDuration: number;
  trends: {
    activeUsers: 'up' | 'down' | 'stable';
    sessions: 'up' | 'down' | 'stable';
    pageViews: 'up' | 'down' | 'stable';
  };
}

interface RealtimeMetricsCardsProps {
  className?: string;
  refreshInterval?: number;
}

export default function RealtimeMetricsCards({ 
  className = '', 
  refreshInterval = 30000 
}: RealtimeMetricsCardsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    activeUsers: 0,
    activeSessions: 0,
    pageViewsLast24h: 0,
    avgSessionDuration: 0,
    trends: {
      activeUsers: 'stable',
      sessions: 'stable',
      pageViews: 'stable'
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsOnline(true);
      
      // Fetch both realtime and overview data
      const [realtimeResponse, overviewResponse] = await Promise.all([
        fetch('/api/analytics/report?type=realtime'),
        fetch('/api/analytics/report?type=overview&startDate=' + 
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (!realtimeResponse.ok || !overviewResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const [realtimeData, overviewData] = await Promise.all([
        realtimeResponse.json(),
        overviewResponse.json()
      ]);

      // Process metrics data
      const newMetrics: MetricsData = {
        activeUsers: realtimeData.activeUsers || 0,
        activeSessions: realtimeData.activeSessions?.length || 0,
        pageViewsLast24h: overviewData.summary?.total_page_views || 0,
        avgSessionDuration: overviewData.summary?.avg_session_duration 
          ? Math.round(overviewData.summary.avg_session_duration / 60) 
          : 0,
        trends: calculateTrends(metrics, {
          activeUsers: realtimeData.activeUsers || 0,
          activeSessions: realtimeData.activeSessions?.length || 0,
          pageViewsLast24h: overviewData.summary?.total_page_views || 0
        })
      };

      setMetrics(newMetrics);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to fetch metrics data');
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  const calculateTrends = (
    previous: MetricsData, 
    current: { activeUsers: number; activeSessions: number; pageViewsLast24h: number }
  ) => {
    const calculateTrend = (prev: number, curr: number, threshold = 0.1) => {
      if (prev === 0) return 'stable';
      const change = (curr - prev) / prev;
      if (change > threshold) return 'up';
      if (change < -threshold) return 'down';
      return 'stable';
    };

    return {
      activeUsers: calculateTrend(previous.activeUsers, current.activeUsers),
      sessions: calculateTrend(previous.activeSessions, current.activeSessions),
      pageViews: calculateTrend(previous.pageViewsLast24h, current.pageViewsLast24h)
    } as const;
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Set up polling interval
    const interval = setInterval(fetchMetrics, refreshInterval);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, [refreshInterval, fetchMetrics]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const _getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsCards = [
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-200',
      trend: metrics.trends.activeUsers,
      description: 'Currently online'
    },
    {
      title: 'Active Sessions',
      value: metrics.activeSessions,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-200',
      trend: metrics.trends.sessions,
      description: 'Live sessions'
    },
    {
      title: 'Page Views (24h)',
      value: metrics.pageViewsLast24h,
      icon: Eye,
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-200',
      trend: metrics.trends.pageViews,
      description: 'Last 24 hours'
    },
    {
      title: 'Avg Session',
      value: `${metrics.avgSessionDuration}m`,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-200',
      trend: 'stable' as const,
      description: 'Average duration'
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gt-navy">Real-time Metrics</h3>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <WifiOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-sm text-gray-500 mt-1">
              Metrics will resume when connection is restored
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card 
                key={card.title} 
                className={`bg-gradient-to-br ${card.color} text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white/80 text-sm font-medium mb-1">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold">
                          {typeof card.value === 'number' 
                            ? formatNumber(card.value) 
                            : card.value
                          }
                        </p>
                        {getTrendIcon(card.trend)}
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        {card.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      <IconComponent className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}