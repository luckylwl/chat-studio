"""
API Routes for Rate Limit Management
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional
from pydantic import BaseModel

from backend.middleware.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/rate-limits", tags=["rate-limits"])


# Request Models
class TierLimitUpdate(BaseModel):
    tier: str
    capacity: int
    refill_rate: float


class UserLimitReset(BaseModel):
    user_id: str
    tier: Optional[str] = None


# Routes
@router.get("/stats")
async def get_rate_limit_stats():
    """
    Get rate limiting statistics

    Returns:
        Rate limit configuration and stats
    """
    try:
        stats = rate_limiter.get_statistics()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_rate_limits(user_id: str):
    """
    Get rate limit status for specific user

    Args:
        user_id: User ID

    Returns:
        Current rate limit status for all tiers
    """
    try:
        limits = await rate_limiter.get_user_limits(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "limits": limits
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/user/reset")
async def reset_user_rate_limit(request: UserLimitReset):
    """
    Reset rate limit for user

    Args:
        request: Reset request with user_id and optional tier

    Returns:
        Success message
    """
    try:
        await rate_limiter.reset_user_limit(request.user_id, request.tier)

        return {
            "success": True,
            "message": f"Rate limit reset for user {request.user_id}",
            "tier": request.tier or "all"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tier")
async def update_tier_limits(request: TierLimitUpdate):
    """
    Update rate limits for a subscription tier

    Args:
        request: Tier limit configuration

    Returns:
        Success message
    """
    try:
        rate_limiter.update_tier_limits(
            request.tier,
            request.capacity,
            request.refill_rate
        )

        return {
            "success": True,
            "message": f"Tier limits updated for {request.tier}",
            "config": {
                "tier": request.tier,
                "capacity": request.capacity,
                "refill_rate": request.refill_rate
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check")
async def check_current_rate_limit(request: Request):
    """
    Check current rate limit status for the requesting client

    Returns:
        Rate limit info for current request
    """
    try:
        info = await rate_limiter.check_rate_limit(request)
        return {
            "success": True,
            "rate_limit": info
        }
    except Exception as e:
        raise HTTPException(status_code=429, detail=str(e))


@router.get("/tiers")
async def list_tier_configurations():
    """
    List all tier configurations

    Returns:
        Configuration for all subscription tiers
    """
    try:
        tiers = {}
        for tier, bucket in rate_limiter.tier_buckets.items():
            tiers[tier] = {
                "capacity": bucket.capacity,
                "refill_rate": bucket.refill_rate,
                "requests_per_minute": bucket.refill_rate * 60,
                "requests_per_hour": bucket.refill_rate * 3600
            }

        return {
            "success": True,
            "tiers": tiers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def rate_limiter_health():
    """
    Check rate limiter health

    Returns:
        Health status
    """
    try:
        # Check Redis connection
        redis_healthy = rate_limiter.redis.health_check() if rate_limiter.redis else False

        return {
            "success": True,
            "healthy": redis_healthy,
            "redis_connected": redis_healthy,
            "tiers_configured": len(rate_limiter.tier_buckets)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
