Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path .venv)) { python -m venv .venv }
& .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
alembic upgrade head
python seed.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 6200
