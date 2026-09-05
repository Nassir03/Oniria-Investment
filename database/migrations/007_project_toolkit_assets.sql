-- Migration 007: Project Toolkit assets
-- Mirrors Alembic revisions 0005 + 0006 for Supabase/SQL-editor deployments.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS project_toolkit_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_slug VARCHAR(160) NOT NULL DEFAULT 'all-projects',
  category VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  preview_image_url TEXT,
  storage_path TEXT,
  preview_storage_path TEXT,
  media_type VARCHAR(30) NOT NULL DEFAULT 'image',
  file_name VARCHAR(300),
  file_size INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade an existing table created from the earlier Toolkit migration.
ALTER TABLE project_toolkit_assets
  ADD COLUMN IF NOT EXISTS preview_storage_path TEXT;

CREATE INDEX IF NOT EXISTS ix_project_toolkit_assets_project_id
  ON project_toolkit_assets(project_id);
CREATE INDEX IF NOT EXISTS ix_project_toolkit_assets_project_slug
  ON project_toolkit_assets(project_slug);
CREATE INDEX IF NOT EXISTS ix_project_toolkit_assets_category
  ON project_toolkit_assets(category);
CREATE INDEX IF NOT EXISTS ix_project_toolkit_assets_is_public
  ON project_toolkit_assets(is_public);

-- Toolkit rows are served and changed through the authenticated FastAPI layer.
ALTER TABLE project_toolkit_assets ENABLE ROW LEVEL SECURITY;
