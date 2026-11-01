import asyncio
import time
from collections import deque
from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import HTTPException, Request, status


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = asyncio.Lock()

    async def check(self, request: Request, scope: str) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{scope}:{client}"
        now = time.monotonic()
        cutoff = now - self.window_seconds

        async with self._lock:
            self._prune(cutoff)
            bucket = self._hits.setdefault(key, deque())

            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_requests:
                retry_after = max(1, int(bucket[0] + self.window_seconds - now) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

    def _prune(self, cutoff: float) -> None:
        if len(self._hits) < 1024:
            return
        stale = [
            key
            for key, bucket in self._hits.items()
            if not bucket or bucket[-1] <= cutoff
        ]
        for key in stale:
            self._hits.pop(key, None)


RateLimitDependency = Callable[[Request], Coroutine[Any, Any, None]]


def rate_limit(
    max_requests: int, window_seconds: int, scope: str
) -> RateLimitDependency:
    limiter = SlidingWindowRateLimiter(max_requests, window_seconds)

    async def dependency(request: Request) -> None:
        await limiter.check(request, scope)

    return dependency
