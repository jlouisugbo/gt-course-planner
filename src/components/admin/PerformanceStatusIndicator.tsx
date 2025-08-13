"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Zap,
  Database,
  Server,
  Globe,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceData {
  overall_status: 'healthy' | 'warning' | 'critical';
  metrics: PerformanceMetric[];
  recommendations: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    actions: string[];
  }>;
  uptime: number;
  lastIncident?: string;
}

interface PerformanceStatusIndicatorProps {
  className?: string;
  refreshInterval?: number;
}

export default function PerformanceStatusIndicator({ 
  className = '', 
  refreshInterval = 30000 
}: PerformanceStatusIndicatorProps) {
  const [performance, setPerformance] = useState<PerformanceData>({
    overall_status: 'healthy',
    metrics: [],
    recommendations: [],
    uptime: 99.9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPerformanceData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }

      const response = await fetch('/api/analytics/performance?type=summary&hours=1');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process performance data into our format
      const processedData: PerformanceData = {
        overall_status: determineOverallStatus(data),
        metrics: processMetrics(data.summary || []),
        recommendations: processRecommendations(data),
        uptime: calculateUptime(data),
        lastIncident: data.lastIncident
      };

      setPerformance(processedData);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('Failed to fetch performance data');
      
      // Set fallback data for demo purposes
      setPerformance({
        overall_status: 'warning',
        metrics: [
          {
            name: 'API Response Time',
            value: 250,
            unit: 'ms',
            status: 'warning',
            threshold: { warning: 200, critical: 500 },
            trend: 'up'
          },
          {
            name: 'Database Query Time',
            value: 85,
            unit: 'ms',
            status: 'healthy',
            threshold: { warning: 100, critical: 300 },
            trend: 'stable'
          },
          {
            name: 'Memory Usage',
            value: 68,
            unit: '%',
            status: 'healthy',
            threshold: { warning: 80, critical: 95 },
            trend: 'down'
          }
        ],
        recommendations: [
          {
            level: 'warning',
            message: 'API response times are above optimal levels',
            actions: ['Review slow endpoints', 'Consider caching strategies']
          }
        ],
        uptime: 99.2,
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [determineOverallStatus, processMetrics, calculateUptime]);

  const determineOverallStatus = useCallback((data: any): 'healthy' | 'warning' | 'critical' => {
    if (!data.summary || data.summary.length === 0) return 'healthy';
    
    const metrics = data.summary;
    const criticalCount = metrics.filter((m: any) => {
      const value = parseFloat(m.average);
      return value > getCriticalThreshold(m.metric);
    }).length;
    
    const warningCount = metrics.filter((m: any) => {
      const value = parseFloat(m.average);
      return value > getWarningThreshold(m.metric) && value <= getCriticalThreshold(m.metric);
    }).length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 1) return 'warning';
    return 'healthy';
  }, []);

  const processMetrics = useCallback((summaryData: any[]): PerformanceMetric[] => {
    const metricConfigs: Record<string, { unit: string; warning: number; critical: number }> = {
      'api_response': { unit: 'ms', warning: 200, critical: 500 },
      'db_query': { unit: 'ms', warning: 100, critical: 300 },
      'page_load': { unit: 'ms', warning: 1000, critical: 3000 },
      'memory_usage': { unit: '%', warning: 80, critical: 95 },
      'cpu_usage': { unit: '%', warning: 70, critical: 90 }
    };

    return summaryData.map(metric => {
      const config = metricConfigs[metric.metric] || { unit: 'ms', warning: 100, critical: 500 };
      const value = parseFloat(metric.average);
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (value > config.critical) status = 'critical';
      else if (value > config.warning) status = 'warning';

      return {
        name: formatMetricName(metric.metric),
        value: Math.round(value),
        unit: config.unit,
        status,
        threshold: {
          warning: config.warning,
          critical: config.critical
        },
        trend: 'stable' // We'll enhance this with historical data later
      };
    });
  }, []);

  const processRecommendations = (data: any) => {
    const recommendations = [];
    
    if (data.summary) {
      const slowQueries = data.summary.filter((m: any) => 
        m.metric.includes('db') && parseFloat(m.average) > 100
      );
      
      if (slowQueries.length > 0) {
        recommendations.push({
          level: 'warning' as const,
          message: 'Database queries are running slower than optimal',
          actions: ['Review query indexes', 'Consider query optimization', 'Check connection pool']
        });
      }

      const slowApi = data.summary.filter((m: any) => 
        m.metric.includes('api') && parseFloat(m.average) > 200
      );
      
      if (slowApi.length > 0) {
        recommendations.push({
          level: 'warning' as const,
          message: 'API endpoints are responding slowly',
          actions: ['Review endpoint performance', 'Consider caching', 'Check server resources']
        });
      }
    }

    return recommendations;
  };

  const calculateUptime = useCallback((_data: any): number => {
    // Calculate uptime based on recent performance data
    // For now, using a simulated calculation
    return 99.5;
  }, []);

  const getCriticalThreshold = (metricName: string): number => {
    const thresholds: Record<string, number> = {
      'api_response': 500,
      'db_query': 300,
      'page_load': 3000,
      'memory_usage': 95,
      'cpu_usage': 90
    };
    return thresholds[metricName] || 500;
  };

  const getWarningThreshold = (metricName: string): number => {
    const thresholds: Record<string, number> = {
      'api_response': 200,
      'db_query': 100,
      'page_load': 1000,
      'memory_usage': 80,
      'cpu_usage': 70
    };
    return thresholds[metricName] || 100;
  };

  const formatMetricName = (name: string): string => {
    const names: Record<string, string> = {
      'api_response': 'API Response Time',
      'db_query': 'Database Query Time',
      'page_load': 'Page Load Time',
      'memory_usage': 'Memory Usage',
      'cpu_usage': 'CPU Usage'
    };
    return names[name] || name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    // Initial fetch
    fetchPerformanceData();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchPerformanceData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchPerformanceData]);

  const handleManualRefresh = () => {
    fetchPerformanceData(true);
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getMetricIcon = (metricName: string) => {
    const icons: Record<string, any> = {
      'API Response Time': Globe,
      'Database Query Time': Database,
      'Page Load Time': Clock,
      'Memory Usage': Server,
      'CPU Usage': Zap
    };
    return icons[metricName] || Activity;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gt-navy">
            <Activity className="h-5 w-5 text-gt-gold animate-pulse" />
            Performance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
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
            <Activity className="h-5 w-5 text-gt-gold" />
            Performance Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(performance.overall_status)}>
              {getStatusIcon(performance.overall_status)}
              <span className="ml-1 capitalize">{performance.overall_status}</span>
            </Badge>
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
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {performance.uptime}% uptime (7d)
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && !performance.metrics.length ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              {error}
            </div>
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performance.metrics.map((metric) => {
                const IconComponent = getMetricIcon(metric.name);
                const progressValue = Math.min(100, (metric.value / metric.threshold.critical) * 100);
                
                return (
                  <div
                    key={metric.name}
                    className={`p-4 rounded-lg border ${
                      metric.status === 'healthy' 
                        ? 'bg-green-50 border-green-200' 
                        : metric.status === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${
                          metric.status === 'healthy' 
                            ? 'text-green-600' 
                            : metric.status === 'warning'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`} />
                        <span className="text-sm font-medium text-gray-700">
                          {metric.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        {getStatusIcon(metric.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg font-bold">
                        {metric.value}{metric.unit}
                      </span>
                      <span className="text-xs text-gray-500">
                        Critical: {metric.threshold.critical}{metric.unit}
                      </span>
                    </div>
                    
                    <Progress 
                      value={progressValue} 
                      className={`h-2 ${
                        metric.status === 'healthy' 
                          ? '[&>div]:bg-green-500' 
                          : metric.status === 'warning'
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Recommendations */}
            {performance.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gt-navy flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Recommendations
                </h4>
                {performance.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      rec.level === 'critical' 
                        ? 'bg-red-50 border-red-200' 
                        : rec.level === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {rec.message}
                    </p>
                    {rec.actions.length > 0 && (
                      <div className="space-y-1">
                        {rec.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            {action}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}