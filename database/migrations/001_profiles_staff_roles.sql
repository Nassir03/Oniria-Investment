-- Migration 001: Profiles and Staff Roles
-- Created by Kelvin - Database Lead
-- Tables: profiles, staff_roles

CREATE TYPE profile_status AS ENUM ('active', 'suspended');

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  status profile_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE profiles IS 'Staff and customer profile data, linked to Supabase Auth. Stores name, email, and account status for anyone who can log in.';

CREATE TYPE staff_role_type AS ENUM ('admin', 'editor', 'sales', 'content_manager');

CREATE TABLE staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role staff_role_type NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE staff_roles IS 'Assigns admin/editor/sales/content_manager permissions to a staff member (profiles.id).';

CREATE INDEX idx_staff_roles_user ON staff_roles(user_id);
CREATE INDEX idx_staff_roles_role ON staff_roles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;