"""ONIRIA local diagnostic. Does not print the database password."""
import asyncio
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def fail(message: str) -> None:
    print(f"[FAIL] {message}")
    raise SystemExit(1)


def ok(message: str) -> None:
    print(f"[ OK ] {message}")


try:
    from app.core.config import settings
except Exception as exc:
    fail(f"Configuration could not load: {exc}")

url = make_url(settings.database_url)
print("ONIRIA diagnostic")
print(f"API prefix: {settings.api_v1_prefix}")
print(f"Frontend origins: {', '.join(settings.frontend_origins)}")
print(f"Database: {url.drivername}://{url.username}:***@{url.host}:{url.port}/{url.database}")

if url.host not in {'127.0.0.1', 'localhost', 'db'}:
    print(f"[WARN] Unexpected DB host: {url.host}")
if url.port not in {3310, 5432}:
    print(f"[WARN] Unexpected DB port: {url.port}")


async def check_db() -> None:
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            value = await conn.scalar(text('SELECT 1'))
            if value != 1:
                fail('PostgreSQL SELECT 1 returned an unexpected value.')
            ok('PostgreSQL connection and authentication work.')
    except Exception as exc:
        fail(f"PostgreSQL connection failed: {exc.__class__.__name__}: {exc}")
    finally:
        await engine.dispose()


asyncio.run(check_db())
ok('Backend configuration is ready for Alembic.')
print('Next: alembic upgrade head')
