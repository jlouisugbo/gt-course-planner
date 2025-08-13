/**
 * GT Design System - Consolidated Dashboard Components
 * Unified stat cards, insight cards, and dashboard elements with GT branding
 */

"use client";

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  // AlertCircle,
  CheckCircle2,
  // Clock,
  // BookOpen,
  // GraduationCap,
  Target,
  Award,
  // BarChart3,
  ChevronRight,
  Info,
  AlertTriangle,
  Lightbulb,
  // Star
} from 'lucide-react';

// GT Brand Colors
const _GT_NAVY = '#003057';
const _GT_GOLD = '#B3A369';

// Base interfaces
interface GTStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  variant?: 'default' | 'gt-navy' | 'gt-gold' | 'success' | 'warning' | 'error';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  isLoading?: boolean;
  onClick?: () => void;
  delay?: number;
  className?: string;
}

interface GTInsightCardProps {
  type: 'success' | 'warning' | 'info' | 'tip' | 'achievement';
  icon?: React.ComponentType<any>;
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
  dismissable?: boolean;
  onDismiss?: () => void;
  delay?: number;
  className?: string;
}

interface GTProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  description?: string;
  variant?: 'default' | 'gt-navy' | 'gt-gold';
  showPercentage?: boolean;
  icon?: React.ComponentType<any>;
  delay?: number;
  className?: string;
}

// Color configurations
const cardVariants = {
  default: {
    bg: 'bg-white',
    border: 'border-gray-200',
    iconBg: 'bg-gray-500',
    text: 'text-gray-900',
    accent: 'text-gray-600'
  },
  'gt-navy': {
    bg: 'bg-white',
    border: 'border-[#003057]/20',
    iconBg: 'bg-[#003057]',
    text: 'text-[#003057]',
    accent: 'text-[#003057]/80'
  },
  'gt-gold': {
    bg: 'bg-white', 
    border: 'border-[#B3A369]/20',
    iconBg: 'bg-[#B3A369]',
    text: 'text-[#B3A369]',
    accent: 'text-[#B3A369]/80'
  },
  success: {
    bg: 'bg-green-50/50',
    border: 'border-green-200',
    iconBg: 'bg-green-500',
    text: 'text-green-900',
    accent: 'text-green-700'
  },
  warning: {
    bg: 'bg-yellow-50/50',
    border: 'border-yellow-200',
    iconBg: 'bg-yellow-500',
    text: 'text-yellow-900',
    accent: 'text-yellow-700'
  },
  error: {
    bg: 'bg-red-50/50',
    border: 'border-red-200',
    iconBg: 'bg-red-500',
    text: 'text-red-900',
    accent: 'text-red-700'
  }
};

const insightVariants = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle2
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info
  },
  tip: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: Lightbulb
  },
  achievement: {
    bg: 'bg-[#B3A369]/10',
    border: 'border-[#B3A369]/20',
    text: 'text-[#003057]',
    icon: Award
  }
};

// GT Stat Card Component
export const GTStatCard = memo<GTStatCardProps>(({
  title,
  value,
  subtitle,
  icon: Icon = Activity,
  variant = 'default',
  trend,
  trendValue,
  isLoading = false,
  onClick,
  delay = 0,
  className
}) => {
  const theme = cardVariants[variant];
  
  const displayValue = useMemo(() => {
    if (isLoading) return '—';
    return value !== null && value !== undefined ? value.toString() : '—';
  }, [value, isLoading]);
  
  const TrendIcon = useMemo(() => {
    return trend === 'up' ? TrendingUp
      : trend === 'down' ? TrendingDown
      : Activity;
  }, [trend]);
  
  const trendClassNames = useMemo(() => {
    return cn(
      "flex items-center mt-2 text-sm",
      trend === "up" ? "text-green-600" 
        : trend === "down" ? "text-red-600" 
        : "text-muted-foreground"
    );
  }, [trend]);

  if (isLoading) {
    return (
      <Card className={cn("h-full animate-pulse", theme.border, className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card 
        className={cn(
          "h-full transition-all duration-300 cursor-pointer group",
          "border-l-4 hover:shadow-xl hover:-translate-y-1",
          "focus-within:ring-2 focus-within:ring-[#003057]/20 focus-within:outline-none",
          "transform-gpu will-change-transform",
          theme.bg,
          theme.border,
          variant === 'gt-gold' && "border-l-[#B3A369] hover:border-l-[#B3A369] hover:shadow-[#B3A369]/20",
          variant === 'gt-navy' && "border-l-[#003057] hover:border-l-[#003057] hover:shadow-[#003057]/20",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : "region"}
        tabIndex={onClick ? 0 : undefined}
        aria-label={`${title} statistics card`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-sm font-medium mb-1",
                "transition-colors duration-300",
                theme.accent,
                onClick && "group-hover:text-[#B3A369]"
              )}>
                {title}
              </h3>
              
              <p className={cn(
                "text-2xl sm:text-3xl font-bold break-words transition-colors duration-300",
                theme.text,
                onClick && "group-hover:text-[#003057]"
              )}>
                {displayValue}
              </p>
              
              {subtitle && (
                <p className={cn("text-sm mt-1", theme.accent)}>
                  {subtitle}
                </p>
              )}
              
              {trend && trendValue && (
                <div className={trendClassNames} role="status">
                  <TrendIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                  <span className="sr-only">
                    {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable trend'}:
                  </span>
                  {trendValue}
                </div>
              )}
            </div>
            
            <div className={cn(
              "p-3 rounded-full flex-shrink-0 ml-4 transition-all duration-300",
              theme.iconBg,
              onClick && "group-hover:scale-110 group-hover:shadow-lg"
            )}>
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

GTStatCard.displayName = 'GTStatCard';

// GT Insight Card Component
export const GTInsightCard = memo<GTInsightCardProps>(({
  type,
  icon,
  title,
  description,
  action = 'Learn More',
  onClick,
  dismissable = false,
  onDismiss,
  delay = 0,
  className
}) => {
  const theme = insightVariants[type];
  const Icon = icon || theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className={cn(
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        "border-l-4",
        theme.bg,
        theme.border,
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full flex-shrink-0",
              type === 'success' && "bg-green-100",
              type === 'warning' && "bg-yellow-100",
              type === 'info' && "bg-blue-100",
              type === 'tip' && "bg-purple-100",
              type === 'achievement' && "bg-[#B3A369]/20"
            )}>
              <Icon className={cn("h-4 w-4", theme.text)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn("font-semibold text-sm mb-1", theme.text)}>
                {title}
              </h4>
              
              <p className={cn("text-sm mb-3 leading-relaxed", theme.text, "opacity-90")}>
                {description}
              </p>
              
              <div className="flex items-center justify-between">
                {onClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClick}
                    className={cn(
                      "h-7 px-2 text-xs font-medium transition-colors",
                      theme.text,
                      "hover:bg-white/50"
                    )}
                  >
                    {action}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                
                {dismissable && onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className={cn(
                      "h-7 w-7 p-0 text-xs opacity-50 hover:opacity-100",
                      theme.text
                    )}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

GTInsightCard.displayName = 'GTInsightCard';

// GT Progress Card Component
export const GTProgressCard = memo<GTProgressCardProps>(({
  title,
  current,
  total,
  unit = 'items',
  description,
  variant = 'gt-gold',
  showPercentage = true,
  icon: Icon = Target,
  delay = 0,
  className
}) => {
  const theme = cardVariants[variant];
  const percentage = Math.round((current / total) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className={cn(
        "h-full transition-all duration-300 hover:shadow-lg",
        theme.bg,
        theme.border,
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={cn("text-lg font-semibold", theme.text)}>
              {title}
            </CardTitle>
            <div className={cn("p-2 rounded-full", theme.iconBg)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={theme.accent}>{current} of {total} {unit}</span>
              {showPercentage && (
                <Badge variant="outline" className={cn("text-xs", theme.text)}>
                  {percentage}%
                </Badge>
              )}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={cn(
                  "h-2 rounded-full",
                  variant === 'gt-gold' && "bg-[#B3A369]",
                  variant === 'gt-navy' && "bg-[#003057]",
                  variant === 'success' && "bg-green-500",
                  variant === 'warning' && "bg-yellow-500",
                  variant === 'error' && "bg-red-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {description && (
            <p className={cn("text-sm", theme.accent)}>
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

GTProgressCard.displayName = 'GTProgressCard';

// Quick Stats Grid Component
interface GTStatsGridProps {
  stats: Array<Omit<GTStatCardProps, 'delay'>>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const GTStatsGrid: React.FC<GTStatsGridProps> = ({
  stats,
  columns = 4,
  className
}) => {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {stats.map((stat, index) => (
        <GTStatCard
          key={`${stat.title}-${index}`}
          {...stat}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
};

const GTDashboardComponents = {
  GTStatCard,
  GTInsightCard,
  GTProgressCard,
  GTStatsGrid
};

export default GTDashboardComponents;