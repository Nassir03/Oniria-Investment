-- Migration 004: Leads, Site Settings, and Audit Log
-- Created by Kelvin - Database Lead
-- Tables: leads, lead_notes, site_settings, audit_log

CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'viewing_scheduled', 'converted', 'lost', 'spam');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no VARCHAR(50) UNIQUE NOT NULL,
  source VARCHAR(100) DEFAULT 'website',
  project_id UUID REFERENCES projects(id),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  message TEXT,
  status lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE leads IS 'Contact and project enquiries submitted through the public site, each with a unique reference number.';

CREATE UNIQUE INDEX idx_leads_reference ON leads(reference_no);
CREATE INDEX idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX idx_leads_project ON leads(project_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);

CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE lead_notes IS 'Internal staff notes and follow-up history for a specific lead.';

CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);

CREATE TABLE site_settings (
  key VARCHAR(255) PRIMARY KEY,
  value_json JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE site_settings IS 'Editable site-wide settings such as contact info, social links, and footer content, stored as key/value pairs.';

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_log IS 'Compliance and change-history log for publish/unpublish actions, article edits, role changes, and lead status changes.';

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;