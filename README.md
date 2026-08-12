# ONIRIA Investments Backend

FastAPI backend implementing the ONIRIA implementation plan: public projects/news APIs, lead capture, Supabase JWT staff authorization, newsroom CRUD/publish/unpublish/archive, lead management, signed storage uploads, audit logs, email notifications, PostgreSQL/SQLAlchemy and Alembic.

## Ports used by this project

- Frontend: `http://localhost:3200`
- Backend API: `http://localhost:6200`
- Swagger/OpenAPI: `http://localhost:6200/docs`
- Health check: `http://localhost:6200/health`
- Local Windows PostgreSQL: `127.0.0.1:3310`

## 1. Windows local setup (recommended when PostgreSQL is installed on Windows)

Open PowerShell in the backend project folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If `.env` does not exist, create it from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your real PostgreSQL password:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_POSTGRES_PASSWORD@127.0.0.1:3310/oniria
FRONTEND_ORIGINS=http://localhost:3200,http://127.0.0.1:3200
```

Make sure PostgreSQL is running and create a database named `oniria` before running migrations.

## 2. Create/update database tables

```powershell
alembic upgrade head
python seed.py
```

To verify migration rollback/re-apply on a development database:

```powershell
alembic downgrade base
alembic upgrade head
python seed.py
```

Do not run the downgrade command against a database containing data you need to keep.

## 3. Run the backend on port 6200

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 6200
```

Open:

- `http://localhost:6200/health`
- `http://localhost:6200/docs`

A healthy database connection returns:

```json
{"status":"ok","database":"ok","environment":"local"}
```

## 4. Run the frontend on port 3200

In the frontend project folder, use the command appropriate to that frontend. For a Next.js project:

```powershell
npm install
npm run dev -- -p 3200
```

The frontend should call the backend at:

```text
http://localhost:6200
```

## 5. Run tests

From the backend folder with the virtual environment active:

```powershell
python -m pytest -q
```

## 6. Optional Docker run

Docker Compose is an alternative to the Windows PostgreSQL setup. Do not start its PostgreSQL service while another PostgreSQL server is already using Windows port `3310`.

```powershell
docker compose up --build
```

Docker exposes:

- API: `http://localhost:6200`
- PostgreSQL: `localhost:3310`

Inside Docker, the API connects to PostgreSQL using `db:5432`; this is intentionally different from the Windows-local `.env` connection `127.0.0.1:3310`.

## 7. Staff authentication

Supabase is not required to test public routes locally. Protected admin routes require these values in `.env`:

```env
SUPABASE_URL=...
SUPABASE_JWT_ISSUER=...
SUPABASE_JWKS_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The frontend signs staff in with Supabase Auth and sends `Authorization: Bearer <access_token>` to protected endpoints. FastAPI validates the token and then loads roles from `staff_roles`.

## 8. Main endpoints

Public:

- `GET /api/v1/projects`
- `GET /api/v1/projects/{slug}`
- `GET /api/v1/news`
- `GET /api/v1/news/{slug}`
- `POST /api/v1/leads`
- `GET /api/v1/business-areas`
- `GET /api/v1/site-settings`

Protected:

- `GET /api/v1/admin/me`
- `GET/POST /api/v1/admin/news`
- `PATCH /api/v1/admin/news/{id}`
- `POST /api/v1/admin/news/{id}/publish`
- `POST /api/v1/admin/news/{id}/unpublish`
- `DELETE /api/v1/admin/news/{id}`
- `GET /api/v1/admin/leads`
- `PATCH /api/v1/admin/leads/{id}`
- `POST /api/v1/admin/uploads/sign`

## 9. Production notes

- Keep `.env`, `DATABASE_URL`, Supabase service-role keys and email keys out of Git.
- Use a managed rate limiter such as Redis when running multiple API instances.
- Configure Supabase Storage before testing signed uploads.
- Apply migrations in staging before production.
- Add RLS as a second database protection layer if the database is also accessed directly through Supabase APIs.
