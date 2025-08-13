/**
 * Performance Monitoring and Metrics Collection
 * Tracks application performance metrics for optimization insights
 */

interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count' | 'percent';
    timestamp: number;
    metadata?: Record<string, unknown>;
    sessionId?: string;
}

interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usedPercent: number;
}

// interface BundleAnalytics {
//     bundleSize: number;
//     chunkCount: number;
//     loadTime: number;
//     criticalResourceLoadTime: number;
// }

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private observers: PerformanceObserver[] = [];
    private isMonitoring = false;
    private maxMetrics = 1000; // Limit stored metrics to prevent memory issues
    private sessionId = this.generateSessionId();

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeMonitoring();
        }
    }

    /**
     * Initialize performance monitoring
     */
    private initializeMonitoring(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        // Monitor navigation timing
        this.trackNavigationTiming();
        
        // Monitor resource loading
        this.trackResourceTiming();
        
        // Monitor Core Web Vitals
        this.trackWebVitals();
        
        // Monitor memory usage
        this.trackMemoryUsage();
        
        // Monitor paint timing
        this.trackPaintTiming();

        // Set up periodic monitoring
        this.startPeriodicMonitoring();

        console.log('Performance monitoring initialized');
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add a performance metric
     */
    private addMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'sessionId'>): void {
        const fullMetric: PerformanceMetric = {
            ...metric,
            timestamp: performance.now(),
            sessionId: this.sessionId
        };

        this.metrics.push(fullMetric);

        // Limit stored metrics to prevent memory leaks
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        // Log critical performance issues
        if (this.isCriticalMetric(fullMetric)) {
            console.warn('Critical performance issue detected:', fullMetric);
        }
    }

    /**
     * Check if metric indicates a critical performance issue
     */
    private isCriticalMetric(metric: PerformanceMetric): boolean {
        const criticalThresholds = {
            'memory-usage-percent': 80, // >80% memory usage
            'component-render-time': 100, // >100ms component render
            'api-response-time': 3000, // >3s API response
            'page-load-time': 5000, // >5s page load
            'bundle-load-time': 10000, // >10s bundle load
            'lcp': 4000, // >4s Largest Contentful Paint
            'fid': 300, // >300ms First Input Delay
        };

        const threshold = criticalThresholds[metric.name as keyof typeof criticalThresholds];
        return threshold !== undefined && metric.value > threshold;
    }

    /**
     * Track navigation timing
     */
    private trackNavigationTiming(): void {
        if (!('performance' in window) || !performance.navigation) return;

        const timing = performance.timing;
        const navigation = performance.navigation;

        this.addMetric({
            name: 'page-load-time',
            value: timing.loadEventEnd - timing.navigationStart,
            unit: 'ms',
            metadata: {
                type: navigation.type,
                redirectCount: navigation.redirectCount
            }
        });

        this.addMetric({
            name: 'dom-ready-time',
            value: timing.domContentLoadedEventEnd - timing.navigationStart,
            unit: 'ms'
        });

        this.addMetric({
            name: 'first-byte-time',
            value: timing.responseStart - timing.navigationStart,
            unit: 'ms'
        });
    }

    /**
     * Track resource loading performance
     */
    private trackResourceTiming(): void {
        if (!('PerformanceObserver' in window)) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    const resource = entry as PerformanceResourceTiming;
                    
                    // Track bundle loading specifically
                    if (resource.name.includes('/_next/static/chunks/')) {
                        this.addMetric({
                            name: 'bundle-load-time',
                            value: resource.duration,
                            unit: 'ms',
                            metadata: {
                                resource: resource.name,
                                size: resource.transferSize,
                                cached: resource.transferSize === 0
                            }
                        });
                    }

                    // Track API calls
                    if (resource.name.includes('/api/')) {
                        this.addMetric({
                            name: 'api-response-time',
                            value: resource.duration,
                            unit: 'ms',
                            metadata: {
                                endpoint: resource.name,
                                method: 'GET' // Limited info available
                            }
                        });
                    }
                }
            }
        });

        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
    }

    /**
     * Track Core Web Vitals
     */
    private trackWebVitals(): void {
        if (!('PerformanceObserver' in window)) return;

        // Track Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.addMetric({
                name: 'lcp',
                value: lastEntry.startTime,
                unit: 'ms',
                metadata: {
                    element: (lastEntry as any).element?.tagName,
                    url: (lastEntry as any).url
                }
            });
        });

        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);
        } catch {
            // Fallback for browsers that don't support LCP
        }

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.addMetric({
                    name: 'fid',
                    value: (entry as any).processingStart - entry.startTime,
                    unit: 'ms',
                    metadata: {
                        eventType: (entry as any).name
                    }
                });
            }
        });

        try {
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);
        } catch {
            // Fallback for browsers that don't support FID
        }
    }

    /**
     * Track paint timing
     */
    private trackPaintTiming(): void {
        if (!('PerformanceObserver' in window)) return;

        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.addMetric({
                    name: entry.name.replace('-', '_'),
                    value: entry.startTime,
                    unit: 'ms'
                });
            }
        });

        try {
            paintObserver.observe({ entryTypes: ['paint'] });
            this.observers.push(paintObserver);
        } catch {
            // Fallback for browsers that don't support paint timing
        }
    }

    /**
     * Track memory usage
     */
    private trackMemoryUsage(): void {
        if (!('memory' in performance)) return;

        const getMemoryInfo = (): MemoryInfo => {
            const memory = (performance as any).memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };
        };

        // Initial measurement
        const initialMemory = getMemoryInfo();
        this.addMetric({
            name: 'memory-usage-percent',
            value: initialMemory.usedPercent,
            unit: 'percent',
            metadata: initialMemory
        });

        // Periodic memory monitoring
        setInterval(() => {
            const currentMemory = getMemoryInfo();
            this.addMetric({
                name: 'memory-usage-percent',
                value: currentMemory.usedPercent,
                unit: 'percent',
                metadata: currentMemory
            });
        }, 30000); // Every 30 seconds
    }

    /**
     * Start periodic monitoring of custom metrics
     */
    private startPeriodicMonitoring(): void {
        // Monitor localStorage usage
        setInterval(() => {
            try {
                let totalSize = 0;
                for (const key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalSize += localStorage[key].length;
                    }
                }
                
                this.addMetric({
                    name: 'localStorage-size',
                    value: totalSize,
                    unit: 'bytes'
                });
            } catch {
                // Ignore localStorage access errors
            }
        }, 60000); // Every minute
    }

    /**
     * Track component render performance
     */
    public trackComponentRender(componentName: string, renderTime: number): void {
        this.addMetric({
            name: 'component-render-time',
            value: renderTime,
            unit: 'ms',
            metadata: {
                component: componentName
            }
        });
    }

    /**
     * Track user interaction performance
     */
    public trackUserInteraction(action: string, duration: number): void {
        this.addMetric({
            name: 'user-interaction-time',
            value: duration,
            unit: 'ms',
            metadata: {
                action
            }
        });
    }

    /**
     * Track API call performance
     */
    public trackAPICall(endpoint: string, method: string, duration: number, success: boolean): void {
        this.addMetric({
            name: 'api-call-time',
            value: duration,
            unit: 'ms',
            metadata: {
                endpoint,
                method,
                success
            }
        });
    }

    /**
     * Get performance summary
     */
    public getPerformanceSummary(): {
        totalMetrics: number;
        criticalIssues: number;
        averageMetrics: Record<string, number>;
        memoryUsage: MemoryInfo | null;
        recommendations: string[];
    } {
        const criticalIssues = this.metrics.filter(m => this.isCriticalMetric(m)).length;
        
        // Calculate averages for key metrics
        const averageMetrics: Record<string, number> = {};
        const metricGroups = this.metrics.reduce((groups, metric) => {
            if (!groups[metric.name]) groups[metric.name] = [];
            groups[metric.name].push(metric.value);
            return groups;
        }, {} as Record<string, number[]>);

        for (const [name, values] of Object.entries(metricGroups)) {
            if (values.length > 0) {
                averageMetrics[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        }

        // Get current memory info
        const memoryUsage = ('memory' in performance) 
            ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
                usedPercent: ((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100
            }
            : null;

        // Generate recommendations
        const recommendations = this.generateRecommendations(averageMetrics, memoryUsage);

        return {
            totalMetrics: this.metrics.length,
            criticalIssues,
            averageMetrics,
            memoryUsage,
            recommendations
        };
    }

    /**
     * Generate performance recommendations
     */
    private generateRecommendations(averages: Record<string, number>, memory: MemoryInfo | null): string[] {
        const recommendations: string[] = [];

        if (averages['component-render-time'] > 50) {
            recommendations.push('Consider optimizing slow-rendering components with React.memo');
        }

        if (averages['api-response-time'] > 1000) {
            recommendations.push('API responses are slow - consider caching or optimization');
        }

        if (memory && memory.usedPercent > 70) {
            recommendations.push('High memory usage detected - check for memory leaks');
        }

        if (averages['bundle-load-time'] > 5000) {
            recommendations.push('Bundle loading is slow - consider code splitting');
        }

        if (averages['lcp'] > 2500) {
            recommendations.push('Largest Contentful Paint is slow - optimize critical resources');
        }

        return recommendations;
    }

    /**
     * Export metrics for analysis
     */
    public exportMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Clear stored metrics
     */
    public clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Stop monitoring and cleanup
     */
    public stop(): void {
        this.isMonitoring = false;
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component render performance
export const usePerformanceTracking = (componentName: string) => {
    if (typeof window === 'undefined') return { trackRender: () => {} };

    const trackRender = (renderTime: number) => {
        performanceMonitor.trackComponentRender(componentName, renderTime);
    };

    return { trackRender };
};

// Utility function to measure execution time
export const measureExecutionTime = <T>(
    fn: () => T,
    name: string
): T => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    performanceMonitor.trackUserInteraction(name, duration);
    return result;
};

// Export for usage in other files
export default performanceMonitor;