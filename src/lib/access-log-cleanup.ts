import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Access log cleanup configuration
 */
const ACCESS_LOG_CONFIG = {
    // Keep detailed logs for 30 days
    RETENTION_DAYS: 30,
    // Keep aggregated stats for 6 months
    AGGREGATION_RETENTION_DAYS: 180,
    // Batch size for cleanup operations
    CLEANUP_BATCH_SIZE: 1000,
};

/**
 * Clean up old access logs based on retention policy
 */
export async function cleanupAccessLogs(): Promise<{
    deletedLogs: number;
    error?: string;
}> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - ACCESS_LOG_CONFIG.RETENTION_DAYS);

        console.log(`Cleaning up access logs older than ${cutoffDate.toISOString()}`);

        // Delete old access logs in batches
        let totalDeleted = 0;
        let hasMore = true;

        while (hasMore) {
            const { data: logsToDelete, error: selectError } = await supabaseAdmin()
                .from('access_logs')
                .select('id')
                .lt('created_at', cutoffDate.toISOString())
                .limit(ACCESS_LOG_CONFIG.CLEANUP_BATCH_SIZE);

            if (selectError) {
                throw selectError;
            }

            if (!logsToDelete || logsToDelete.length === 0) {
                hasMore = false;
                break;
            }

            const idsToDelete = logsToDelete.map(log => log.id);

            const { error: deleteError } = await supabaseAdmin()
                .from('access_logs')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) {
                throw deleteError;
            }

            totalDeleted += logsToDelete.length;
            console.log(`Deleted ${logsToDelete.length} access logs (total: ${totalDeleted})`);

            // If we got fewer than the batch size, we're done
            if (logsToDelete.length < ACCESS_LOG_CONFIG.CLEANUP_BATCH_SIZE) {
                hasMore = false;
            }
        }

        console.log(`Access log cleanup completed. Deleted ${totalDeleted} records.`);
        return { deletedLogs: totalDeleted };

    } catch (error) {
        console.error('Error cleaning up access logs:', error);
        return { 
            deletedLogs: 0, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Generate aggregated access statistics before cleanup
 * This preserves important metrics while reducing storage
 */
export async function generateAccessStats(days: number = 30): Promise<void> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // You could create an access_stats table to store aggregated data
        // For now, we'll just log the stats
        const { data: stats, error } = await supabaseAdmin()
            .from('access_logs')
            .select('endpoint, method, response_status, user_id, created_at')
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        if (stats) {
            // Generate daily aggregated stats
            const dailyStats = stats.reduce((acc: any, log: any) => {
                const date = String(log.created_at).split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        total_requests: 0,
                        unique_users: new Set(),
                        endpoints: {} as Record<string, number>,
                        status_codes: {} as Record<string, number>,
                    };
                }
                
                acc[date].total_requests++;
                acc[date].unique_users.add(log.user_id);
                acc[date].endpoints[String(log.endpoint)] = (acc[date].endpoints[String(log.endpoint)] || 0) + 1;
                acc[date].status_codes[String(log.response_status)] = (acc[date].status_codes[String(log.response_status)] || 0) + 1;
                
                return acc;
            }, {});

            // Convert Sets to counts
            Object.keys(dailyStats).forEach(date => {
                dailyStats[date].unique_users = dailyStats[date].unique_users.size;
            });

            console.log('Generated access statistics:', dailyStats);
        }

    } catch (error) {
        console.error('Error generating access stats:', error);
    }
}

/**
 * API endpoint to manually trigger cleanup
 */
export async function cleanupHandler() {
    // Generate stats before cleanup
    await generateAccessStats();
    
    // Clean up old logs
    const result = await cleanupAccessLogs();
    
    return result;
}