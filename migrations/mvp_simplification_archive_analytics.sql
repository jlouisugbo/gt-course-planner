-- MVP Simplification: Archive Analytics and Monitoring Tables
-- Purpose: Remove enterprise analytics features not needed for MVP
-- Strategy: Rename tables (not drop) to allow rollback if needed post-demo
-- Created: 2025-10-27 by Infrastructure Stabilization Agent

-- ========================================
-- ARCHIVE ANALYTICS TABLES
-- ========================================

-- Archive daily analytics summaries
ALTER TABLE IF EXISTS analytics_daily_summary
  RENAME TO _archived_analytics_daily_summary;

-- Archive performance metrics
ALTER TABLE IF EXISTS performance_metrics
  RENAME TO _archived_performance_metrics;

-- Archive realtime metrics
ALTER TABLE IF EXISTS realtime_metrics
  RENAME TO _archived_realtime_metrics;

-- Archive query performance logs
ALTER TABLE IF EXISTS query_performance_log
  RENAME TO _archived_query_performance_log;

-- Archive page views tracking
ALTER TABLE IF EXISTS page_views
  RENAME TO _archived_page_views;

-- Archive user sessions tracking
ALTER TABLE IF EXISTS user_sessions
  RENAME TO _archived_user_sessions;

-- Archive feature usage tracking
ALTER TABLE IF EXISTS feature_usage
  RENAME TO _archived_feature_usage;

-- Archive access logs
ALTER TABLE IF EXISTS access_logs
  RENAME TO _archived_access_logs;

-- Archive security events table (if exists)
ALTER TABLE IF EXISTS security_events
  RENAME TO _archived_security_events;

-- ========================================
-- REMOVE REDUNDANT COLUMNS
-- ========================================

-- Remove completed_courses from users table (redundant with user_courses)
ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS completed_courses;

-- Remove planned/completed courses from user_semesters (redundant with user_course_plans)
ALTER TABLE IF EXISTS user_semesters
  DROP COLUMN IF EXISTS planned_courses;

ALTER TABLE IF EXISTS user_semesters
  DROP COLUMN IF EXISTS completed_courses;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- List all archived tables (for verification)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '_archived_%'
ORDER BY tablename;

-- Verify core tables still exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'courses',
    'user_courses',
    'user_course_plans',
    'degree_programs',
    'degree_requirements',
    'deadlines'
  )
ORDER BY tablename;

-- ========================================
-- ROLLBACK SCRIPT (if needed)
-- ========================================

-- To restore archived tables, run:
-- ALTER TABLE _archived_analytics_daily_summary RENAME TO analytics_daily_summary;
-- ALTER TABLE _archived_performance_metrics RENAME TO performance_metrics;
-- ALTER TABLE _archived_realtime_metrics RENAME TO realtime_metrics;
-- ALTER TABLE _archived_query_performance_log RENAME TO query_performance_log;
-- ALTER TABLE _archived_page_views RENAME TO page_views;
-- ALTER TABLE _archived_user_sessions RENAME TO user_sessions;
-- ALTER TABLE _archived_feature_usage RENAME TO feature_usage;
-- ALTER TABLE _archived_access_logs RENAME TO access_logs;
-- ALTER TABLE _archived_security_events RENAME TO security_events;
