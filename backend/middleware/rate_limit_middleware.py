"""
Rate Limiting Middleware for FastAPI
Automatically applies rate limiting to all requests
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging
import time

from .rate_limiter import rate_limiter, RateLimitExceeded

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for automatic rate limiting

    Features:
    - Automatic rate limit checking for all requests
    - Rate limit headers in responses
    - Configurable exempt paths
    - Request timing
    """

    def __init__(
        self,
        app: ASGIApp,
        exempt_paths: list = None,
        enable_timing: bool = True
    ):
        """
        Initialize rate limit middleware

        Args:
            app: FastAPI app
            exempt_paths: List of paths to exempt from rate limiting
            enable_timing: Enable request timing in headers
        """
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico"
        ]
        self.enable_timing = enable_timing

    async def dispatch(self, request: Request, call_next):
        """
        Process request with rate limiting

        Args:
            request: FastAPI request
            call_next: Next middleware/route handler

        Returns:
            Response with rate limit headers
        """
        start_time = time.time()

        # Check if path is exempt
        if self._is_exempt(request.url.path):
            response = await call_next(request)
            if self.enable_timing:
                self._add_timing_header(response, start_time)
            return response

        try:
            # Check rate limit
            rate_limit_info = await rate_limiter.check_rate_limit(request)

            # Process request
            response = await call_next(request)

            # Add rate limit headers
            headers = rate_limiter.get_rate_limit_headers(rate_limit_info)
            for header, value in headers.items():
                response.headers[header] = value

            # Add timing header
            if self.enable_timing:
                self._add_timing_header(response, start_time)

            return response

        except RateLimitExceeded as e:
            # Rate limit exceeded
            logger.warning(f"Rate limit exceeded: {request.url.path}")

            return JSONResponse(
                status_code=e.status_code,
                content={
                    "error": "rate_limit_exceeded",
                    "message": e.detail,
                    "retry_after": e.headers.get("Retry-After")
                },
                headers=e.headers
            )

        except Exception as e:
            # Log error but don't block request
            logger.error(f"Rate limit check error: {str(e)}")
            response = await call_next(request)

            if self.enable_timing:
                self._add_timing_header(response, start_time)

            return response

    def _is_exempt(self, path: str) -> bool:
        """
        Check if path is exempt from rate limiting

        Args:
            path: Request path

        Returns:
            True if exempt
        """
        for exempt_path in self.exempt_paths:
            if path.startswith(exempt_path):
                return True
        return False

    def _add_timing_header(self, response: Response, start_time: float):
        """
        Add request timing header

        Args:
            response: Response object
            start_time: Request start time
        """
        duration = time.time() - start_time
        response.headers["X-Process-Time"] = f"{duration:.4f}"


# Rate limit decorator for specific endpoints
def rate_limit(
    capacity: int = None,
    refill_rate: float = None,
    tier: str = None
):
    """
    Decorator for endpoint-specific rate limiting

    Args:
        capacity: Token bucket capacity (overrides tier)
        refill_rate: Token refill rate (overrides tier)
        tier: Subscription tier to use

    Example:
        @app.get("/expensive-operation")
        @rate_limit(capacity=10, refill_rate=10/60)
        async def expensive_operation():
            return {"status": "ok"}
    """
    from functools import wraps

    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Apply custom rate limit
            if capacity and refill_rate:
                from .rate_limiter import TokenBucket
                bucket = TokenBucket(capacity, refill_rate, redis_client=rate_limiter.redis)
                identifier = rate_limiter.get_client_identifier(request)

                allowed, info = bucket.consume(identifier)
                if not allowed:
                    raise RateLimitExceeded(
                        detail="Endpoint rate limit exceeded",
                        retry_after=info.get("retry_after")
                    )

            # Or use tier-based rate limit
            elif tier:
                request.state.subscription_tier = tier

            return await func(request, *args, **kwargs)

        return wrapper

    return decorator
