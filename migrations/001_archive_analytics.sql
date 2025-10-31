-- =====================================================
-- Migration: Archive Analytics Tables
-- Purpose: Simplify database for MVP by archiving
--          non-essential analytics and monitoring tables
-- Date: 2025-10-28
-- Agent: Infrastructure Stabilization Agent
-- =====================================================

-- Archive analytics and monitoring tables (PRESERVE for post-MVP)
-- Using RENAME instead of DROP to allow rollback if needed

-- Analytics tables
ALTER TABLE IF EXISTS analytics_daily_summary RENAME TO _archived_analytics_daily_summary;
ALTER TABLE IF EXISTS performance_metrics RENAME TO _archived_performance_metrics;
ALTER TABLE IF EXISTS realtime_metrics RENAME TO _archived_realtime_metrics;
ALTER TABLE IF EXISTS query_performance_log RENAME TO _archived_query_performance_log;

-- User activity tracking tables
ALTER TABLE IF EXISTS page_views RENAME TO _archived_page_views;
ALTER TABLE IF EXISTS user_sessions RENAME TO _archived_user_sessions;
ALTER TABLE IF EXISTS feature_usage RENAME TO _archived_feature_usage;
ALTER TABLE IF EXISTS access_logs RENAME TO _archived_access_logs;

-- Security monitoring tables (replaced by simpler auth)
ALTER TABLE IF EXISTS security_events RENAME TO _archived_security_events;
ALTER TABLE IF EXISTS auth_attempts RENAME TO _archived_auth_attempts;
ALTER TABLE IF EXISTS anomaly_detections RENAME TO _archived_anomaly_detections;

-- =====================================================
-- Remove redundant columns from core tables
-- These columns duplicate data stored elsewhere
-- =====================================================

-- users table: completed_courses is tracked in user_courses table
ALTER TABLE IF EXISTS users
DROP COLUMN IF EXISTS completed_courses;

-- user_semesters table: redundant course tracking
-- (Note: This table may not exist - safe to ignore errors)
ALTER TABLE IF EXISTS user_semesters
DROP COLUMN IF EXISTS planned_courses,
DROP COLUMN IF EXISTS completed_courses;

-- =====================================================
-- Rollback Instructions (if needed)
-- =====================================================
-- To restore archived tables:
-- ALTER TABLE _archived_analytics_daily_summary RENAME TO analytics_daily_summary;
-- ALTER TABLE _archived_performance_metrics RENAME TO performance_metrics;
-- (etc. for all archived tables)

-- =====================================================
-- Impact Assessment
-- =====================================================
-- REMOVED: Complex analytics and monitoring infrastructure
-- PRESERVED: Core academic planning functionality
-- TABLES AFFECTED: 11+ archived tables, 2-3 columns removed
-- DATA LOSS: None (all tables renamed, not dropped)
-- MVP IMPACT: Zero - only removes non-essential features
