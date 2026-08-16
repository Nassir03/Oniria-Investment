-- Migration 005: Staff profile preferences
-- Adds office profile fields used by the admin Settings page.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone VARCHAR(60),
  ADD COLUMN IF NOT EXISTS job_title VARCHAR(120),
  ADD COLUMN IF NOT EXISTS department VARCHAR(120),
  ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(30),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSON DEFAULT '{}'::json NOT NULL;
