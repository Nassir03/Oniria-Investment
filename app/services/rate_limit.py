import asyncio
import time
from collections import defaultdict, deque

from app.core.config import settings
from app.core.errors import AppError


class InMemoryMinuteLimiter:
    def __init__(self):
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, key: str, limit: int | None = None):
        limit = limit or settings.lead_rate_limit_per_minute
        now = time.monotonic()
        cutoff = now - 60
        async with self._lock:
            q = self._hits[key]
            while q and q[0] < cutoff:
                q.popleft()
            if len(q) >= limit:
                raise AppError('rate_limited', 'Too many submissions. Please try again shortly.', 429)
            q.append(now)


lead_limiter = InMemoryMinuteLimiter()
