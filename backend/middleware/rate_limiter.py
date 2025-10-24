"""
API Rate Limiting System
Token bucket algorithm with Redis backend
"""

import time
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import hashlib

from backend.cache.redis_client import redis_client

logger = logging.getLogger(__name__)


class RateLimitExceeded(HTTPException):
    """Rate limit exceeded exception"""

    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        retry_after: Optional[int] = None
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(retry_after)} if retry_after else {}
        )


class TokenBucket:
    """
    Token bucket rate limiter

    Algorithm:
    - Bucket has a capacity (max tokens)
    - Tokens are added at a constant rate
    - Each request consumes one token
    - If no tokens available, request is rejected
    """

    def __init__(
        self,
        capacity: int,
        refill_rate: float,
        redis_client=None
    ):
        """
        Initialize token bucket

        Args:
            capacity: Maximum number of tokens in bucket
            refill_rate: Tokens per second refill rate
            redis_client: Redis client for distributed rate limiting
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.redis = redis_client

    def _get_bucket_key(self, identifier: str) -> str:
        """Get Redis key for bucket"""
        return f"rate_limit:bucket:{identifier}"

    def _get_bucket_state(self, identifier: str) -> Tuple[float, float]:
        """
        Get current bucket state

        Args:
            identifier: Bucket identifier

        Returns:
            Tuple of (tokens, last_refill_time)
        """
        if not self.redis:
            return (self.capacity, time.time())

        key = self._get_bucket_key(identifier)
        data = self.redis.hgetall(key)

        if not data:
            # Initialize bucket
            tokens = self.capacity
            last_refill = time.time()
            self.redis.hset(key, "tokens", tokens)
            self.redis.hset(key, "last_refill", last_refill)
            self.redis.expire(key, 3600)  # Expire after 1 hour
            return (tokens, last_refill)

        tokens = float(data.get("tokens", self.capacity))
        last_refill = float(data.get("last_refill", time.time()))

        return (tokens, last_refill)

    def _set_bucket_state(
        self,
        identifier: str,
        tokens: float,
        last_refill: float
    ):
        """
        Set bucket state

        Args:
            identifier: Bucket identifier
            tokens: Number of tokens
            last_refill: Last refill timestamp
        """
        if not self.redis:
            return

        key = self._get_bucket_key(identifier)
        self.redis.hset(key, "tokens", tokens)
        self.redis.hset(key, "last_refill", last_refill)
        self.redis.expire(key, 3600)

    def consume(
        self,
        identifier: str,
        tokens: int = 1
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Attempt to consume tokens

        Args:
            identifier: Unique identifier (user ID, IP, etc.)
            tokens: Number of tokens to consume

        Returns:
            Tuple of (success, info_dict)
        """
        current_time = time.time()
        current_tokens, last_refill = self._get_bucket_state(identifier)

        # Calculate tokens to add based on time elapsed
        time_elapsed = current_time - last_refill
        tokens_to_add = time_elapsed * self.refill_rate
        current_tokens = min(self.capacity, current_tokens + tokens_to_add)

        # Check if enough tokens available
        if current_tokens >= tokens:
            # Consume tokens
            current_tokens -= tokens
            self._set_bucket_state(identifier, current_tokens, current_time)

            return True, {
                "allowed": True,
                "remaining": int(current_tokens),
                "capacity": self.capacity,
                "reset_at": current_time + (self.capacity - current_tokens) / self.refill_rate
            }
        else:
            # Not enough tokens
            retry_after = int((tokens - current_tokens) / self.refill_rate)

            return False, {
                "allowed": False,
                "remaining": 0,
                "capacity": self.capacity,
                "retry_after": retry_after,
                "reset_at": current_time + (self.capacity - current_tokens) / self.refill_rate
            }


class RateLimiter:
    """
    Multi-tier rate limiter

    Supports:
    - Per-user rate limiting
    - Per-IP rate limiting
    - Per-endpoint rate limiting
    - Subscription tier-based limits
    - Dynamic limit adjustment
    """

    def __init__(self):
        """Initialize rate limiter"""
        self.redis = redis_client

        # Default rate limits (requests per minute)
        self.default_limits = {
            "free": {"capacity": 20, "refill_rate": 20 / 60},  # 20 req/min
            "pro": {"capacity": 100, "refill_rate": 100 / 60},  # 100 req/min
            "enterprise": {"capacity": 500, "refill_rate": 500 / 60},  # 500 req/min
        }

        # IP-based rate limiting (stricter)
        self.ip_limit = TokenBucket(
            capacity=60,
            refill_rate=60 / 60,  # 60 req/min
            redis_client=self.redis
        )

        # Create tier buckets
        self.tier_buckets: Dict[str, TokenBucket] = {}
        for tier, config in self.default_limits.items():
            self.tier_buckets[tier] = TokenBucket(
                capacity=config["capacity"],
                refill_rate=config["refill_rate"],
                redis_client=self.redis
            )

    def get_client_identifier(self, request: Request) -> str:
        """
        Get client identifier from request

        Args:
            request: FastAPI request

        Returns:
            Client identifier (user ID or IP hash)
        """
        # Try to get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"

        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
        return f"ip:{ip_hash}"

    def get_user_tier(self, request: Request) -> str:
        """
        Get user subscription tier

        Args:
            request: FastAPI request

        Returns:
            Subscription tier (free/pro/enterprise)
        """
        # Try to get tier from request state
        tier = getattr(request.state, "subscription_tier", None)
        if tier and tier in self.tier_buckets:
            return tier

        # Default to free tier
        return "free"

    async def check_rate_limit(
        self,
        request: Request,
        endpoint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check rate limit for request

        Args:
            request: FastAPI request
            endpoint: Optional endpoint identifier

        Returns:
            Rate limit info dictionary

        Raises:
            RateLimitExceeded: If rate limit exceeded
        """
        # Get client identifier and tier
        identifier = self.get_client_identifier(request)
        tier = self.get_user_tier(request)

        # Check IP-based rate limit first
        ip = request.client.host if request.client else "unknown"
        ip_allowed, ip_info = self.ip_limit.consume(f"ip:{ip}")

        if not ip_allowed:
            logger.warning(f"IP rate limit exceeded: {ip}")
            raise RateLimitExceeded(
                detail="Too many requests from your IP address",
                retry_after=ip_info.get("retry_after")
            )

        # Check user/tier rate limit
        bucket = self.tier_buckets.get(tier, self.tier_buckets["free"])
        allowed, info = bucket.consume(identifier)

        if not allowed:
            logger.warning(f"Rate limit exceeded: {identifier} (tier: {tier})")
            raise RateLimitExceeded(
                detail=f"Rate limit exceeded for {tier} tier",
                retry_after=info.get("retry_after")
            )

        # Log successful rate limit check
        logger.debug(
            f"Rate limit check: {identifier} (tier: {tier}) - "
            f"remaining: {info['remaining']}/{info['capacity']}"
        )

        return info

    def get_rate_limit_headers(self, info: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate rate limit headers

        Args:
            info: Rate limit info from check_rate_limit

        Returns:
            Headers dictionary
        """
        return {
            "X-RateLimit-Limit": str(info.get("capacity", 0)),
            "X-RateLimit-Remaining": str(info.get("remaining", 0)),
            "X-RateLimit-Reset": str(int(info.get("reset_at", 0))),
        }

    async def get_user_limits(self, user_id: str) -> Dict[str, Any]:
        """
        Get current rate limit status for user

        Args:
            user_id: User ID

        Returns:
            Rate limit status dictionary
        """
        identifier = f"user:{user_id}"

        # Get state for all tiers (user might have multiple)
        status = {}

        for tier, bucket in self.tier_buckets.items():
            tokens, last_refill = bucket._get_bucket_state(identifier)

            # Calculate current tokens
            current_time = time.time()
            time_elapsed = current_time - last_refill
            tokens_to_add = time_elapsed * bucket.refill_rate
            current_tokens = min(bucket.capacity, tokens + tokens_to_add)

            status[tier] = {
                "capacity": bucket.capacity,
                "remaining": int(current_tokens),
                "refill_rate": bucket.refill_rate,
                "reset_at": current_time + (bucket.capacity - current_tokens) / bucket.refill_rate
            }

        return status

    async def reset_user_limit(self, user_id: str, tier: Optional[str] = None):
        """
        Reset rate limit for user

        Args:
            user_id: User ID
            tier: Optional specific tier to reset
        """
        identifier = f"user:{user_id}"

        if tier and tier in self.tier_buckets:
            # Reset specific tier
            bucket = self.tier_buckets[tier]
            bucket._set_bucket_state(identifier, bucket.capacity, time.time())
            logger.info(f"Rate limit reset: {user_id} (tier: {tier})")
        else:
            # Reset all tiers
            for tier_name, bucket in self.tier_buckets.items():
                bucket._set_bucket_state(identifier, bucket.capacity, time.time())
            logger.info(f"Rate limit reset: {user_id} (all tiers)")

    def update_tier_limits(
        self,
        tier: str,
        capacity: int,
        refill_rate: float
    ):
        """
        Update rate limits for a tier

        Args:
            tier: Tier name
            capacity: New capacity
            refill_rate: New refill rate
        """
        self.tier_buckets[tier] = TokenBucket(
            capacity=capacity,
            refill_rate=refill_rate,
            redis_client=self.redis
        )
        logger.info(f"Tier limits updated: {tier} - capacity={capacity}, rate={refill_rate}")

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get rate limiting statistics

        Returns:
            Statistics dictionary
        """
        return {
            "tiers": {
                tier: {
                    "capacity": bucket.capacity,
                    "refill_rate": bucket.refill_rate
                }
                for tier, bucket in self.tier_buckets.items()
            },
            "ip_limit": {
                "capacity": self.ip_limit.capacity,
                "refill_rate": self.ip_limit.refill_rate
            }
        }


# Global rate limiter instance
rate_limiter = RateLimiter()
