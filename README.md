# \# ONIRIA Investments — Database

# 

# PostgreSQL 17 (Supabase-managed) migration files live in `database/migrations`

# and should be applied in filename order.

# 

# \## Local Setup

# 

# 1\. Install PostgreSQL 17 and pgAdmin 4.

# 2\. In pgAdmin, create a new database named `oniria\_investments`.

# 3\. Open a Query Tool on `oniria\_investments` and run each file in

# &#x20;  `database/migrations/` in filename order (001 through 004).

# 4\. Run `database/seed/001\_projects\_seed.sql` to load the four placeholder

# &#x20;  ONIRIA projects (Stone Town, Michamvi, ONA Towers, V Town).

# 5\. See `database/docs/database-dictionary.md` for a full explanation of

# &#x20;  every table and field.

# 

# \## Authentication

# 

# `profiles.id` is designed to match Supabase Auth's `auth.users.id` exactly.

# Staff sign in through Supabase Auth; the backend (FastAPI) validates the

# JWT and checks `staff\_roles` for permissions on every protected request.

# 

# \## Row-Level Security

# 

# RLS is enabled on all sensitive tables (`profiles`, `staff\_roles`, `leads`,

# `lead\_notes`, `audit\_log`, `site\_settings`, `projects`, `news\_articles`).

# 

# \- `projects` and `news\_articles` allow public read access only where

# &#x20; `status = 'published'`.

# \- All other RLS-enabled tables have no public policy — they are accessible

# &#x20; only through the backend's privileged service-role connection.

# 

# \## Migration Files

# 

# | File | Contents |

# |---|---|

# | 001\_profiles\_staff\_roles.sql | Staff profiles and role assignments |

# | 002\_projects.sql | Portfolio projects, media, business areas |

# | 003\_newsroom.sql | News categories, articles, and article-category links |

# | 004\_leads\_settings\_audit.sql | Leads, lead notes, site settings, audit log |

# 

# Never commit real passwords, service-role keys, or production credentials.

# 

# Maintained by Kelvin — Database Lead.

