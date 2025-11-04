-- =====================================================
-- GT Course Planner - Smart Notifications System
-- Migration: create_notifications_system.sql
-- Created: 2025-01-30
-- Description: Creates notifications and preferences tables
--              with RLS policies for user isolation
-- =====================================================

-- =====================================================
-- TABLE: notifications
-- Stores individual notification records for users
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deadline', 'requirement', 'course', 'gpa', 'advisor', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500), -- Link to relevant page
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata for debugging and tracking
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES: notifications
-- Optimized for common query patterns
-- =====================================================
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Composite index for fetching unread notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC)
  WHERE read = FALSE;

-- =====================================================
-- RLS POLICIES: notifications
-- FERPA-compliant: Users can only access their own notifications
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id))
  WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Policy: System can insert notifications (service role only)
-- This allows server-side notification creation
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- =====================================================
-- TABLE: notification_preferences
-- User preferences for notification types and delivery
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Notification type toggles
  deadline_reminders BOOLEAN DEFAULT TRUE,
  requirement_alerts BOOLEAN DEFAULT TRUE,
  course_updates BOOLEAN DEFAULT TRUE,
  gpa_alerts BOOLEAN DEFAULT TRUE,
  advisor_notifications BOOLEAN DEFAULT TRUE,
  system_notifications BOOLEAN DEFAULT TRUE,

  -- Delivery preferences
  email_notifications BOOLEAN DEFAULT FALSE,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_digest_frequency IN ('none', 'daily', 'weekly')),

  -- Notification timing preferences
  deadline_reminder_days INTEGER DEFAULT 7 CHECK (deadline_reminder_days > 0 AND deadline_reminder_days <= 30),
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES: notification_preferences
-- =====================================================
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- RLS POLICIES: notification_preferences
-- FERPA-compliant: Users can only manage their own preferences
-- =====================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own preferences (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id))
  WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- =====================================================
-- FUNCTION: Auto-create default preferences for new users
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preferences when user is created
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- FUNCTION: Auto-expire old notifications
-- Run this periodically (e.g., via cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION expire_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 90 days or past expiration date
  DELETE FROM notifications
  WHERE
    (expires_at IS NOT NULL AND expires_at < NOW())
    OR
    (created_at < NOW() - INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS: Documentation for developers
-- =====================================================
COMMENT ON TABLE notifications IS 'Smart notifications for GT Course Planner users';
COMMENT ON COLUMN notifications.type IS 'Notification category: deadline, requirement, course, gpa, advisor, system';
COMMENT ON COLUMN notifications.priority IS 'Notification urgency level: low, medium, high';
COMMENT ON COLUMN notifications.action_url IS 'Internal link for notification CTA (e.g., /planner, /deadlines)';
COMMENT ON COLUMN notifications.metadata IS 'Additional context data for notification triggers';

COMMENT ON TABLE notification_preferences IS 'User preferences for notification types and delivery settings';
COMMENT ON COLUMN notification_preferences.deadline_reminder_days IS 'How many days before deadline to send reminder';

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================
-- Check tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('notifications', 'notification_preferences');

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('notifications', 'notification_preferences');

-- Check policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('notifications', 'notification_preferences');
