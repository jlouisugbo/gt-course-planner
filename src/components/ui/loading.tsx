"use client";

import React from 'react';
import { cn } from '@/lib/utils';
// import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

// Enhanced Skeleton with shimmer effect
export function SkeletonShimmer({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gt-navy-100/20 rounded-md",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]",
        "before:translate-x-[-100%]",
        className
      )}
      {...props}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Course Card Skeleton
export function CourseCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn(
      "border rounded-lg bg-white",
      compact ? "p-3" : "p-4"
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <SkeletonShimmer className="h-5 w-20" />
              <SkeletonShimmer className="h-4 w-8" />
            </div>
            <SkeletonShimmer className="h-4 w-full max-w-48" />
          </div>
          <SkeletonShimmer className="h-5 w-5" />
        </div>
        
        {/* Description */}
        {!compact && (
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 w-full" />
            <SkeletonShimmer className="h-3 w-3/4" />
            <SkeletonShimmer className="h-3 w-1/2" />
          </div>
        )}
        
        {/* Badges and details */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <SkeletonShimmer className="h-5 w-12" />
            <SkeletonShimmer className="h-5 w-16" />
          </div>
          <SkeletonShimmer className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

// Course Grid Skeleton
export function CourseGridSkeleton({ 
  count = 6, 
  compact = false 
}: { 
  count?: number; 
  compact?: boolean; 
}) {
  return (
    <div className={cn(
      "grid gap-4",
      compact 
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} compact={compact} />
      ))}
    </div>
  );
}

// Dashboard Card Skeleton
export function DashboardCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-8 w-16" />
          </div>
          <SkeletonShimmer className="h-8 w-8" />
        </div>
        <SkeletonShimmer className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// Loading Spinner Component
export function LoadingSpinner({ 
  size = "default",
  className,
  ...props 
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
} & React.ComponentProps<"div">) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-gt-navy", sizeClasses[size])} />
    </div>
  );
}

// Full Page Loading
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

// Loading Overlay
export function LoadingOverlay({ 
  isVisible,
  message = "Loading...",
  children
}: {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {isVisible && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// List Loading Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <SkeletonShimmer className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <SkeletonShimmer className="h-4 w-full max-w-48" />
            <SkeletonShimmer className="h-3 w-full max-w-32" />
          </div>
          <SkeletonShimmer className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// Button Loading State
export function ButtonLoading({ 
  children, 
  isLoading, 
  loadingText = "Loading...",
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
} & React.ComponentProps<"button">) {
  return (
    <button 
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(props.className, isLoading && "cursor-not-allowed")}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}