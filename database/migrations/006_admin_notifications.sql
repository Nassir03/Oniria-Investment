-- Migration 006: Admin in-app notifications
-- Stores per-staff administration notifications.

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_admin_notifications_user_id ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS ix_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS ix_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS ix_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS ix_admin_notifications_user_read_created ON admin_notifications(user_id, is_read, created_at DESC);
