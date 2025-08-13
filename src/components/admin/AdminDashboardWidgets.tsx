"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Settings, 
  Minimize2, 
  Eye,
  EyeOff,
  Layout
} from 'lucide-react';

import LiveActivityFeed from './LiveActivityFeed';
import RealtimeMetricsCards from './RealtimeMetricsCards';
import LiveCourseActivity from './LiveCourseActivity';
import PerformanceStatusIndicator from './PerformanceStatusIndicator';

interface WidgetConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
  order: number;
}

interface AdminDashboardWidgetsProps {
  className?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export default function AdminDashboardWidgets({ 
  className = '', 
  refreshInterval = 30000,
  autoRefresh = true
}: AdminDashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    {
      id: 'metrics-cards',
      name: 'Real-time Metrics',
      component: RealtimeMetricsCards,
      props: { refreshInterval },
      visible: true,
      size: 'large',
      order: 1
    },
    {
      id: 'activity-feed',
      name: 'Live Activity Feed',
      component: LiveActivityFeed,
      props: { refreshInterval, maxItems: 20 },
      visible: true,
      size: 'medium',
      order: 2
    },
    {
      id: 'course-activity',
      name: 'Course Activity',
      component: LiveCourseActivity,
      props: { refreshInterval, maxItems: 15 },
      visible: true,
      size: 'medium',
      order: 3
    },
    {
      id: 'performance-status',
      name: 'Performance Status',
      component: PerformanceStatusIndicator,
      props: { refreshInterval },
      visible: true,
      size: 'large',
      order: 4
    }
  ]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState<Date | null>(null);

  // Sort widgets by order and filter visible ones
  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setLastGlobalRefresh(new Date());
    
    // Simulate refresh time
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const updateWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size }
        : widget
    ));
  };

  const reorderWidget = (widgetId: string, direction: 'up' | 'down') => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const newOrder = direction === 'up' ? widget.order - 1 : widget.order + 1;
    const swapWidget = widgets.find(w => w.order === newOrder);
    
    if (swapWidget) {
      setWidgets(prev => prev.map(w => {
        if (w.id === widgetId) return { ...w, order: newOrder };
        if (w.id === swapWidget.id) return { ...w, order: widget.order };
        return w;
      }));
    }
  };

  const getWidgetGridClass = (size: 'small' | 'medium' | 'large', layout: 'grid' | 'list') => {
    if (layout === 'list') return 'col-span-full';
    
    switch (size) {
      case 'small':
        return 'col-span-1 md:col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-1 lg:col-span-1';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-2';
      default:
        return 'col-span-1';
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastGlobalRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-gt-navy" />
            <h2 className="text-lg font-semibold text-gt-navy">Real-time Dashboard</h2>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            {visibleWidgets.length} widgets active
          </Badge>
          {autoRefresh && (
            <Badge variant="outline" className="text-xs">
              Auto-refresh: {refreshInterval / 1000}s
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastGlobalRefresh && (
            <span className="text-xs text-gray-500 mr-2">
              Last refresh: {lastGlobalRefresh.toLocaleTimeString()}
            </span>
          )}
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLayout('grid')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                layout === 'grid' 
                  ? 'bg-white text-gt-navy shadow-sm' 
                  : 'text-gray-600 hover:text-gt-navy'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                layout === 'list' 
                  ? 'bg-white text-gt-navy shadow-sm' 
                  : 'text-gray-600 hover:text-gt-navy'
              }`}
            >
              List
            </button>
          </div>

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleGlobalRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
        </div>
      </div>

      {/* Widget Settings Panel */}
      {showSettings && (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gt-navy">Widget Settings</h3>
            <Button
              onClick={() => setShowSettings(false)}
              variant="ghost"
              size="sm"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="p-3 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{widget.name}</span>
                  <Button
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {widget.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Size</label>
                  <select
                    value={widget.size}
                    onChange={(e) => updateWidgetSize(widget.id, e.target.value as any)}
                    className="w-full text-xs border rounded px-2 py-1"
                    disabled={!widget.visible}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex gap-1">
                  <Button
                    onClick={() => reorderWidget(widget.id, 'up')}
                    disabled={!widget.visible || widget.order === 1}
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                  >
                    ↑
                  </Button>
                  <Button
                    onClick={() => reorderWidget(widget.id, 'down')}
                    disabled={!widget.visible || widget.order === widgets.length}
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className={`grid gap-6 ${
        layout === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' 
          : 'grid-cols-1'
      }`}>
        {visibleWidgets.map((widget) => {
          const WidgetComponent = widget.component;
          return (
            <div
              key={`${widget.id}-${refreshKey}`}
              className={getWidgetGridClass(widget.size, layout)}
            >
              <WidgetComponent
                {...widget.props}
                className="h-full"
              />
            </div>
          );
        })}
      </div>

      {visibleWidgets.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets visible</h3>
          <p className="text-gray-600 mb-4">
            Enable some widgets in the settings to see real-time dashboard data.
          </p>
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Open Widget Settings
          </Button>
        </div>
      )}
    </div>
  );
}