/**
 * Storage Manager - Handles localStorage cleanup and optimization
 * Prevents memory leaks and manages storage size limits
 */

interface StorageData {
    timestamp: number;
    size: number;
    key: string;
}

export class StorageManager {
    private static readonly MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static readonly MAX_AGE_DAYS = 30; // 30 days
    private static readonly CLEANUP_KEYS = [
        'gt-planner-storage-',
        'gt-course-planner-cookie-',
        'gt-planner-anonymous-session'
    ];

    /**
     * Cleanup old localStorage entries
     */
    static cleanupStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const now = Date.now();
            const cutoffTime = now - (this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
            const storageData: StorageData[] = [];
            let totalSize = 0;

            // Collect all relevant storage data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !this.isRelevantKey(key)) continue;

                try {
                    const value = localStorage.getItem(key);
                    if (!value) continue;

                    const parsed = JSON.parse(value);
                    const timestamp = parsed.state?.lastUpdated || parsed.lastUpdated || 0;
                    const size = value.length;

                    storageData.push({ key, timestamp, size });
                    totalSize += size;
                } catch {
                    // Invalid JSON, mark for cleanup
                    storageData.push({ key, timestamp: 0, size: 0 });
                }
            }

            // Remove old entries
            const entriesToRemove = storageData.filter(
                entry => entry.timestamp < cutoffTime || entry.timestamp === 0
            );

            entriesToRemove.forEach(entry => {
                console.log(`Removing old storage entry: ${entry.key}`);
                localStorage.removeItem(entry.key);
            });

            // If still over size limit, remove oldest entries
            if (totalSize > this.MAX_STORAGE_SIZE) {
                const remainingEntries = storageData
                    .filter(entry => entry.timestamp >= cutoffTime && entry.timestamp !== 0)
                    .sort((a, b) => a.timestamp - b.timestamp);

                let currentSize = remainingEntries.reduce((sum, entry) => sum + entry.size, 0);
                
                while (currentSize > this.MAX_STORAGE_SIZE && remainingEntries.length > 1) {
                    const oldest = remainingEntries.shift();
                    if (oldest) {
                        console.log(`Removing oversized storage entry: ${oldest.key}`);
                        localStorage.removeItem(oldest.key);
                        currentSize -= oldest.size;
                    }
                }
            }

            console.log(`Storage cleanup completed. Removed ${entriesToRemove.length} old entries.`);
        } catch (error) {
            console.error('Storage cleanup failed:', error);
        }
    }

    /**
     * Check if storage is approaching limits
     */
    static checkStorageHealth(): { isHealthy: boolean; size: number; itemCount: number } {
        if (typeof window === 'undefined') {
            return { isHealthy: true, size: 0, itemCount: 0 };
        }

        try {
            let totalSize = 0;
            let itemCount = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && this.isRelevantKey(key)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalSize += value.length;
                        itemCount++;
                    }
                }
            }

            const isHealthy = totalSize < this.MAX_STORAGE_SIZE * 0.8; // 80% threshold

            return { isHealthy, size: totalSize, itemCount };
        } catch (error) {
            console.error('Storage health check failed:', error);
            return { isHealthy: false, size: 0, itemCount: 0 };
        }
    }

    /**
     * Get storage usage statistics
     */
    static getStorageStats(): {
        totalSize: number;
        usedPercentage: number;
        itemCount: number;
        oldestEntry: number;
        newestEntry: number;
    } {
        if (typeof window === 'undefined') {
            return { totalSize: 0, usedPercentage: 0, itemCount: 0, oldestEntry: 0, newestEntry: 0 };
        }

        let totalSize = 0;
        let itemCount = 0;
        let oldestEntry = Date.now();
        let newestEntry = 0;

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !this.isRelevantKey(key)) continue;

                const value = localStorage.getItem(key);
                if (!value) continue;

                totalSize += value.length;
                itemCount++;

                try {
                    const parsed = JSON.parse(value);
                    const timestamp = parsed.state?.lastUpdated || parsed.lastUpdated || 0;
                    
                    if (timestamp > 0) {
                        oldestEntry = Math.min(oldestEntry, timestamp);
                        newestEntry = Math.max(newestEntry, timestamp);
                    }
                } catch {
                    // Ignore parsing errors
                }
            }

            return {
                totalSize,
                usedPercentage: (totalSize / this.MAX_STORAGE_SIZE) * 100,
                itemCount,
                oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
                newestEntry
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return { totalSize: 0, usedPercentage: 0, itemCount: 0, oldestEntry: 0, newestEntry: 0 };
        }
    }

    /**
     * Initialize storage manager (call on app startup)
     */
    static initialize(): void {
        if (typeof window === 'undefined') return;

        // Run initial cleanup
        this.cleanupStorage();

        // Set up periodic cleanup (every 24 hours)
        setInterval(() => {
            this.cleanupStorage();
        }, 24 * 60 * 60 * 1000);

        // Monitor storage health
        const health = this.checkStorageHealth();
        if (!health.isHealthy) {
            console.warn(`Storage health warning: ${health.size} bytes used across ${health.itemCount} items`);
        }
    }

    /**
     * Check if a localStorage key is relevant to our cleanup
     */
    private static isRelevantKey(key: string): boolean {
        return this.CLEANUP_KEYS.some(prefix => key.startsWith(prefix));
    }

    /**
     * Emergency cleanup - remove all non-essential data
     */
    static emergencyCleanup(): void {
        if (typeof window === 'undefined') return;

        try {
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && this.isRelevantKey(key)) {
                    // Keep only the most recent session data
                    if (!key.includes(this.getCurrentSessionId())) {
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Emergency cleanup: removed ${keysToRemove.length} storage entries`);
        } catch (error) {
            console.error('Emergency cleanup failed:', error);
        }
    }

    /**
     * Get current session ID (simplified)
     */
    private static getCurrentSessionId(): string {
        return sessionStorage.getItem('gt-planner-anonymous-session') || 'anonymous-fallback';
    }
}

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
    // Delay initialization to avoid blocking
    setTimeout(() => StorageManager.initialize(), 1000);
}