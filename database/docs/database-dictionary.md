\# ONIRIA Investments — Database Dictionary



Database: PostgreSQL 17 (Supabase-managed)

Maintained by: Kelvin — Database Lead



This document explains every table and field in the ONIRIA Investments database.

Staff authentication is managed by Supabase Auth; `profiles.id` matches `auth.users.id`.



\---



\## profiles

Staff and customer profile data, linked to Supabase Auth.



| Field | Type | Description |

|---|---|---|

| id | UUID | Matches Supabase auth.users.id exactly |

| full\_name | VARCHAR(255) | Display name |

| email | VARCHAR(255) | Login email, unique |

| status | ENUM | active / suspended |

| created\_at / updated\_at | TIMESTAMP | Record timestamps |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## staff\_roles

Assigns permissions to a staff member.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| user\_id | UUID | Links to profiles |

| role | ENUM | admin / editor / sales / content\_manager |

| granted\_by | UUID | Links to profiles — who granted this role |

| created\_at | TIMESTAMP | When the role was granted |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## projects

The four ONIRIA portfolio projects (Stone Town, Michamvi, ONA Towers, V Town).



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| slug | VARCHAR(255) | URL-friendly identifier, unique |

| name | VARCHAR(255) | Project name |

| category | VARCHAR(100) | e.g. "Residential", "Mixed-Use" |

| location | VARCHAR(255) | Project location |

| summary | TEXT | Short description |

| body | TEXT | Full project content |

| status | ENUM | draft / published / archived |

| featured | BOOLEAN | Shown in featured/signature sections |

| sort\_order | INT | Display order |



RLS: enabled. Public can only SELECT where status = 'published'.



\---



\## project\_media

Gallery and hero images/videos for each project.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| project\_id | UUID | Links to projects |

| url | VARCHAR(500) | Media file location |

| alt\_text | VARCHAR(255) | Accessibility text |

| media\_type | ENUM | image / video |

| sort\_order | INT | Gallery display order |



\---



\## business\_areas

Editable "Our Business" content (hospitality, residential, mixed-use, etc.).



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| slug | VARCHAR(255) | URL-friendly identifier, unique |

| name | VARCHAR(255) | Business area name |

| summary | TEXT | Description |

| sort\_order | INT | Display order |



\---



\## news\_categories

Categories used to classify newsroom articles.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| slug | VARCHAR(255) | URL-friendly identifier, unique |

| name | VARCHAR(255) | Category name |



\---



\## news\_articles

Newsroom articles with a full editorial workflow.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| slug | VARCHAR(255) | URL-friendly identifier, unique |

| title | VARCHAR(255) | Article title |

| excerpt | TEXT | Short summary for listings |

| body | JSONB | Rich-text content (structured, e.g. from TipTap editor) |

| hero\_image\_url | VARCHAR(500) | Main article image |

| status | ENUM | draft / scheduled / published / archived |

| published\_at | TIMESTAMP | When the article went live |

| author\_id | UUID | Links to profiles |



RLS: enabled. Public can only SELECT where status = 'published'.



\---



\## news\_article\_categories

Many-to-many link between articles and categories.



| Field | Type | Description |

|---|---|---|

| article\_id | UUID | Links to news\_articles |

| category\_id | UUID | Links to news\_categories |



\---



\## leads

Contact and project enquiries submitted through the public site.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| reference\_no | VARCHAR(50) | Unique enquiry reference shown to the visitor |

| source | VARCHAR(100) | Where the lead came from, default "website" |

| project\_id | UUID | Links to projects, if project-specific |

| first\_name / last\_name | VARCHAR(255) | Contact name |

| email / phone | VARCHAR | Contact details |

| country | VARCHAR(100) | Visitor's country |

| message | TEXT | Enquiry message |

| status | ENUM | new / contacted / qualified / viewing\_scheduled / converted / lost / spam |

| assigned\_to | UUID | Links to profiles — sales staff responsible |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## lead\_notes

Internal staff notes and follow-up history for a lead.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| lead\_id | UUID | Links to leads |

| staff\_id | UUID | Links to profiles |

| note | TEXT | The note content |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## site\_settings

Editable site-wide settings (contact info, social links, footer content).



| Field | Type | Description |

|---|---|---|

| key | VARCHAR(255) | Setting name, primary key |

| value\_json | JSONB | Setting value, flexible structure |

| updated\_by | UUID | Links to profiles |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## audit\_log

Compliance and change-history log.



| Field | Type | Description |

|---|---|---|

| id | UUID | Unique identifier |

| actor\_id | UUID | Links to profiles — who performed the action |

| action | VARCHAR(100) | What happened (e.g. "publish", "role\_change") |

| entity\_type | VARCHAR(100) | What kind of record was affected |

| entity\_id | UUID | The specific record affected |

| metadata\_json | JSONB | Extra details about the change |



RLS: enabled, no public policy (backend/service-role access only).



\---



\## Notes



\- All tables use UUID primary keys (`gen\_random\_uuid()`), except `profiles.id`

&#x20; which matches Supabase `auth.users.id` directly.

\- RLS is enabled on all sensitive tables. Tables with no public policy are

&#x20; accessible only through the backend's privileged service-role connection.

\- `projects` and `news\_articles` have public read policies limited to

&#x20; `status = 'published'` — drafts are never publicly visible.

\- Seed data currently includes 4 placeholder ONIRIA projects, marked

&#x20; `status = 'draft'` until real approved content is provided.

