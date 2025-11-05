"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, PanInfo, type HTMLMotionProps } from 'framer-motion';

// Touch-friendly button wrapper
export function TouchButton({
  children,
  className,
  onTap,
  disabled = false,
  size = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
} & HTMLMotionProps<"button">) {
  const sizeClasses = {
    sm: 'min-h-[40px] min-w-[40px] px-3 py-2',
    default: 'min-h-[44px] min-w-[44px] px-4 py-2',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3'
  };

  return (
    <motion.button
      className={cn(
        'touch-manipulation select-none',
        'relative overflow-hidden',
        'transition-colors duration-200',
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      onTap={onTap}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Swipeable card component
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className,
  ...props
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  className?: string;
} & HTMLMotionProps<"div">) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (event: any, info: PanInfo) => {
    setDragOffset(info.offset.x);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  return (
    <motion.div
      className={cn(
        'relative touch-manipulation',
        isDragging && 'z-10',
        className
      )}
      drag="x"
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.3}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      {...props}
    >
      {/* Swipe indicators */}
      {(onSwipeLeft || onSwipeRight) && (
        <>
          {onSwipeLeft && (
            <div 
              className={cn(
                "absolute right-0 top-0 h-full w-16 bg-red-500 flex items-center justify-center",
                "transition-opacity duration-200",
                dragOffset < -50 ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="text-white text-sm font-medium">Delete</span>
            </div>
          )}
          {onSwipeRight && (
            <div 
              className={cn(
                "absolute left-0 top-0 h-full w-16 bg-green-500 flex items-center justify-center",
                "transition-opacity duration-200",
                dragOffset > 50 ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="text-white text-sm font-medium">Done</span>
            </div>
          )}
        </>
      )}
      
      {children}
    </motion.div>
  );
}

// Pull-to-refresh component
export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
}: {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshThreshold?: number;
  className?: string;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = () => {
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setCanRefresh(true);
    }
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (!canRefresh || info.offset.y < 0) return;
    
    const distance = Math.min(info.offset.y, refreshThreshold * 1.5);
    setPullDistance(distance);
  };

  const handlePanEnd = async (event: any, info: PanInfo) => {
    if (!canRefresh) return;
    
    if (info.offset.y >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setCanRefresh(false);
  };

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      {/* Refresh indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center",
          "bg-gt-navy-50 border-b border-gt-navy-100",
          "transition-all duration-200 ease-out"
        )}
        style={{
          height: `${pullDistance}px`,
          opacity: refreshProgress
        }}
      >
        <div className="flex items-center space-x-2 text-gt-navy">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ 
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: "linear"
            }}
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Mobile-optimized grid component
export function TouchGrid({
  children,
  columns = 1,
  gap = 4,
  className,
  ...props
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  gap?: number;
  className?: string;
} & React.ComponentProps<"div">) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div
      className={cn(
        'grid touch-manipulation',
        gridClasses[columns],
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Mobile keyboard-safe viewport
export function KeyboardSafeView({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ height: viewportHeight }}
    >
      {children}
    </div>
  );
}