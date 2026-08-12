-- Migration 002: Projects and Business Areas
-- Created by Kelvin - Database Lead
-- Tables: projects, project_media, business_areas

CREATE TYPE project_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  summary TEXT,
  body TEXT,
  status project_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS 'The four ONIRIA portfolio projects (Stone Town, Michamvi, ONA Towers, V Town) shown on the public projects pages.';

CREATE TYPE project_media_type AS ENUM ('image', 'video');

CREATE TABLE project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  media_type project_media_type NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE project_media IS 'Gallery and hero images/videos for each project, in display order.';

CREATE INDEX idx_project_media_project ON project_media(project_id);

CREATE TABLE business_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  summary TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE business_areas IS 'Editable business sector content shown on the Our Business page (e.g. hospitality, residential, mixed-use).';

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published projects"
ON projects FOR SELECT
USING (status = 'published');