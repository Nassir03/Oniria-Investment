# ONIRIA Investments — local development

## Ports

- Frontend: `http://localhost:3200`
- FastAPI backend: `http://localhost:6200`
- PostgreSQL: `127.0.0.1:3310`
- Swagger: `http://localhost:6200/docs`
- Health: `http://localhost:6200/health`

## Important PowerShell rule

When documentation shows:

```text
(.venv) PS C:\Users\Nassir\Downloads\Oniria-Investment> alembic upgrade head
```

**type only:**

```powershell
alembic upgrade head
```

Do not paste `(.venv) PS C:\...>` into PowerShell. That text is the prompt, not a command. Pasting the prompt causes errors such as `Unexpected token 'PS'`.

Also, if `$env:DATABASE_URL` prints nothing, that is fine. `Remove-Item Env:DATABASE_URL` will then say the path does not exist; there is nothing to remove.

## Recommended Windows setup

### 1. Create and activate the virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Python 3.12 or 3.13 is recommended for the smoothest dependency support.

### 2. Create `.env` safely

Run:

```powershell
.\scripts\configure-local.ps1
```

Enter the same PostgreSQL password that works with `psql`. The script URL-encodes special characters such as `@` automatically, so you do not need to manually write `%40`.

### 3. Confirm PostgreSQL before running Alembic

```powershell
python scripts\doctor.py
```

You must see:

```text
[ OK ] PostgreSQL connection and authentication work.
```

If this fails with `InvalidPasswordError`, the password entered into `.env` is not the same password PostgreSQL accepts. Do not modify Alembic in that case; rerun `configure-local.ps1` with the correct password.

### 4. Create tables and seed content

```powershell
alembic upgrade head
python seed.py
python -m pytest -q
```

### 5. Start backend

```powershell
.\scripts\start-backend.ps1
```

Verify:

- `http://localhost:6200/health`
- `http://localhost:6200/docs`
- `http://localhost:6200/api/v1/projects`

### 6. Start frontend in a second PowerShell terminal

```powershell
.\.venv\Scripts\Activate.ps1
.\scripts\start-frontend.ps1
```

The frontend starts at `http://localhost:3200`.

## Direct frontend setup (alternative)

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run typecheck
npm run build
npm run dev
```

## Docker alternative

Use Docker **instead of** the Windows PostgreSQL service if port `3310` is already free:

```powershell
docker compose up --build
```

Do not run local PostgreSQL on port `3310` and the Docker PostgreSQL service on port `3310` at the same time.

The Docker frontend uses `http://api:6200/api/v1` for server-side requests inside the Docker network and `http://localhost:6200/api/v1` for browser requests.

## Supabase/admin

Public projects, newsroom reads, business areas, site settings, health, and lead submission can run with local PostgreSQL without Supabase. Staff login and protected admin endpoints require valid Supabase Auth/JWKS configuration and matching `profiles` / `staff_roles` rows in PostgreSQL.

## Secrets

Never commit `.env`, PostgreSQL passwords, Supabase service-role keys, or Resend API keys. Only `.env.example` should be committed.

## Frontend design revision (premium sales / corporate presentation)

The public site is intentionally separated from the staff administration portal.

Public routes:
- `/`
- `/our-story`
- `/projects`
- `/projects/[slug]`
- `/business`
- `/newsroom`
- `/newsroom/[slug]`
- `/contact`

Staff-only entry point (not linked from the public website):
- `/admin/login`
- `/admin`
- `/admin/news`
- `/admin/leads`
- `/admin/projects`
- `/admin/settings`

Brand surface colors are limited to:
- Warm Taupe / Khaki Beige: `#B8A37C`
- Dark Navy / Midnight Navy: `#031B35`

Local ports:
- Next.js frontend: `3200`
- FastAPI backend: `6200`
- PostgreSQL: `3310`

Frontend checks:
```powershell
cd frontend
npm install
npm run typecheck
npm run build
npm run dev
```

Staff authentication requires valid Supabase frontend credentials in `frontend/.env.local` and matching backend Supabase JWT settings in the backend `.env`.
