/**
 * Lazy Loading Components Configuration
 * Implements code splitting for large components to improve initial bundle size
 */

import React, { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Loading fallback components
const ComponentSkeleton = () => (
    <Card className="w-full">
        <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
            </div>
        </CardContent>
    </Card>
);

const FullPageLoader = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gt-gold" />
            <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
    </div>
);

// Lazy load large components
export const LazyDashboard = lazy(() => 
    import('@/components/dashboard/Dashboard').then(module => ({ 
        default: module.default 
    }))
);

export const LazyPlannerGrid = lazy(() => 
    import('@/components/planner/PlannerGrid').then(module => ({ 
        default: module.PlannerGrid 
    }))
);

export const LazyCourseExplorer = lazy(() => 
    import('@/components/courses/CourseExplorer').then(module => ({ 
        default: module.default 
    }))
);

export const LazyRequirementsDashboard = lazy(() => 
    import('@/components/requirements/RequirementsDashboard').then(module => ({ 
        default: (module as any).RequirementsDashboard 
    }))
);

export const LazyProfileSetup = lazy(() => 
    import('@/components/profile/ProfileSetup').then(module => ({ 
        default: module.default 
    }))
);

// Chart components (typically heavy due to visualization libraries)
export const LazyGPATrendChart = lazy(() => 
    import('@/components/dashboard/parts/GPATrendChart').then(module => ({ 
        default: module.default 
    }))
);

export const LazyCreditDistributionChart = lazy(() => 
    import('@/components/dashboard/parts/CreditDistributionChart').then(module => ({ 
        default: module.default 
    }))
);

// Advanced planner components
export const LazyAcademicTimeline = lazy(() => 
    import('@/components/planner/AcademicTimeline').then(module => ({ 
        default: (module as any).AcademicTimeline 
    }))
);

export const LazyCourseRecommendationsAI = lazy(() => 
    import('@/components/planner/CourseRecommendationsAI').then(module => ({ 
        default: (module as any).default 
    }))
);

// HOC for adding suspense wrapper to lazy components
export function withSuspense<T extends object>(
    LazyComponent: ComponentType<T>,
    fallback: ComponentType = ComponentSkeleton
) {
    const WrappedComponent = (props: T) => (
        <Suspense fallback={React.createElement(fallback)}>
            <LazyComponent {...props} />
        </Suspense>
    );
    
    WrappedComponent.displayName = `withSuspense(${LazyComponent.displayName || LazyComponent.name})`;
    return WrappedComponent;
}

// Pre-configured components with appropriate fallbacks
export const DashboardWithSuspense = withSuspense(LazyDashboard, FullPageLoader);
export const PlannerGridWithSuspense = withSuspense(LazyPlannerGrid, ComponentSkeleton);
export const CourseExplorerWithSuspense = withSuspense(LazyCourseExplorer, FullPageLoader);
export const RequirementsDashboardWithSuspense = withSuspense(LazyRequirementsDashboard, FullPageLoader);
export const ProfileSetupWithSuspense = withSuspense(LazyProfileSetup, FullPageLoader);

// Chart components with skeleton fallbacks
export const GPATrendChartWithSuspense = withSuspense(LazyGPATrendChart, () => (
    <Card className="w-full h-64">
        <CardHeader>
            <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-48 w-full rounded" />
        </CardContent>
    </Card>
));

export const CreditDistributionChartWithSuspense = withSuspense(LazyCreditDistributionChart, () => (
    <Card className="w-full h-64">
        <CardHeader>
            <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
            <Skeleton className="h-32 w-32 rounded-full" />
        </CardContent>
    </Card>
));

// Advanced components with full page loaders
export const AcademicTimelineWithSuspense = withSuspense(LazyAcademicTimeline, FullPageLoader);
export const CourseRecommendationsAIWithSuspense = withSuspense(LazyCourseRecommendationsAI, FullPageLoader);

// Component preloader utility
export const preloadComponent = (componentImport: () => Promise<any>) => {
    // Preload on user interaction or route change
    if (typeof window !== 'undefined') {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => componentImport());
        } else {
            setTimeout(() => componentImport(), 100);
        }
    }
};

// Preload critical components on app initialization
export const preloadCriticalComponents = () => {
    preloadComponent(() => import('@/components/dashboard/Dashboard'));
    preloadComponent(() => import('@/components/planner/PlannerGrid'));
    preloadComponent(() => import('@/components/courses/CourseExplorer'));
};