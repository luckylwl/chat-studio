"""
Redis client configuration and management
Provides connection pooling and async operations
"""

import redis.asyncio as aioredis
import redis
from typing import Optional, Any
import json
import pickle
import logging
import os
from datetime import timedelta

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_MAX_CONNECTIONS = int(os.getenv("REDIS_MAX_CONNECTIONS", "50"))

# Connection URLs
REDIS_URL = f"redis://{':' + REDIS_PASSWORD + '@' if REDIS_PASSWORD else ''}{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"


class RedisClient:
    """
    Redis client wrapper with connection pooling

    Provides both sync and async interfaces for Redis operations
    """

    def __init__(self):
        self.sync_client: Optional[redis.Redis] = None
        self.async_client: Optional[aioredis.Redis] = None
        self._pool: Optional[redis.ConnectionPool] = None
        self._async_pool: Optional[aioredis.ConnectionPool] = None

    def initialize_sync(self):
        """Initialize synchronous Redis client"""
        try:
            self._pool = redis.ConnectionPool(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                max_connections=REDIS_MAX_CONNECTIONS,
                decode_responses=False,  # Handle encoding manually
            )
            self.sync_client = redis.Redis(connection_pool=self._pool)
            # Test connection
            self.sync_client.ping()
            logger.info("Sync Redis client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize sync Redis client: {e}")
            raise

    async def initialize_async(self):
        """Initialize asynchronous Redis client"""
        try:
            self._async_pool = aioredis.ConnectionPool.from_url(
                REDIS_URL,
                max_connections=REDIS_MAX_CONNECTIONS,
                decode_responses=False,
            )
            self.async_client = aioredis.Redis(connection_pool=self._async_pool)
            # Test connection
            await self.async_client.ping()
            logger.info("Async Redis client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize async Redis client: {e}")
            raise

    def close_sync(self):
        """Close synchronous Redis connection"""
        if self.sync_client:
            self.sync_client.close()
            logger.info("Sync Redis client closed")

    async def close_async(self):
        """Close asynchronous Redis connection"""
        if self.async_client:
            await self.async_client.close()
            await self._async_pool.disconnect()
            logger.info("Async Redis client closed")

    def health_check(self) -> bool:
        """Check if Redis is healthy"""
        try:
            if self.sync_client:
                self.sync_client.ping()
                return True
            return False
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    async def async_health_check(self) -> bool:
        """Async health check"""
        try:
            if self.async_client:
                await self.async_client.ping()
                return True
            return False
        except Exception as e:
            logger.error(f"Async Redis health check failed: {e}")
            return False

    # Synchronous operations
    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            value = self.sync_client.get(key)
            if value:
                return pickle.loads(value)
            return None
        except Exception as e:
            logger.error(f"Failed to get key {key}: {e}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """
        Set value in Redis

        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds

        Returns:
            bool: Success status
        """
        try:
            serialized = pickle.dumps(value)
            if expire:
                self.sync_client.setex(key, expire, serialized)
            else:
                self.sync_client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to set key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        try:
            self.sync_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete key {key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.sync_client.exists(key))
        except Exception as e:
            logger.error(f"Failed to check existence of key {key}: {e}")
            return False

    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        try:
            return bool(self.sync_client.expire(key, seconds))
        except Exception as e:
            logger.error(f"Failed to set expiration on key {key}: {e}")
            return False

    def ttl(self, key: str) -> int:
        """Get time to live for key"""
        try:
            return self.sync_client.ttl(key)
        except Exception as e:
            logger.error(f"Failed to get TTL for key {key}: {e}")
            return -1

    def keys(self, pattern: str = "*") -> list:
        """Get keys matching pattern"""
        try:
            return [k.decode() for k in self.sync_client.keys(pattern)]
        except Exception as e:
            logger.error(f"Failed to get keys with pattern {pattern}: {e}")
            return []

    def flush_db(self) -> bool:
        """Flush all keys in current database"""
        try:
            self.sync_client.flushdb()
            logger.warning("Redis database flushed")
            return True
        except Exception as e:
            logger.error(f"Failed to flush database: {e}")
            return False

    # Async operations
    async def async_get(self, key: str) -> Optional[Any]:
        """Async get value from Redis"""
        try:
            value = await self.async_client.get(key)
            if value:
                return pickle.loads(value)
            return None
        except Exception as e:
            logger.error(f"Failed to async get key {key}: {e}")
            return None

    async def async_set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Async set value in Redis"""
        try:
            serialized = pickle.dumps(value)
            if expire:
                await self.async_client.setex(key, expire, serialized)
            else:
                await self.async_client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to async set key {key}: {e}")
            return False

    async def async_delete(self, key: str) -> bool:
        """Async delete key from Redis"""
        try:
            await self.async_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to async delete key {key}: {e}")
            return False

    async def async_exists(self, key: str) -> bool:
        """Async check if key exists"""
        try:
            return bool(await self.async_client.exists(key))
        except Exception as e:
            logger.error(f"Failed to async check existence of key {key}: {e}")
            return False

    # Hash operations
    def hget(self, name: str, key: str) -> Optional[Any]:
        """Get value from hash"""
        try:
            value = self.sync_client.hget(name, key)
            if value:
                return pickle.loads(value)
            return None
        except Exception as e:
            logger.error(f"Failed to hget {name}:{key}: {e}")
            return None

    def hset(self, name: str, key: str, value: Any) -> bool:
        """Set value in hash"""
        try:
            serialized = pickle.dumps(value)
            self.sync_client.hset(name, key, serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to hset {name}:{key}: {e}")
            return False

    def hgetall(self, name: str) -> dict:
        """Get all values from hash"""
        try:
            data = self.sync_client.hgetall(name)
            return {
                k.decode(): pickle.loads(v)
                for k, v in data.items()
            }
        except Exception as e:
            logger.error(f"Failed to hgetall {name}: {e}")
            return {}

    # List operations
    def lpush(self, key: str, *values) -> bool:
        """Push values to list (left)"""
        try:
            serialized = [pickle.dumps(v) for v in values]
            self.sync_client.lpush(key, *serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to lpush to {key}: {e}")
            return False

    def rpush(self, key: str, *values) -> bool:
        """Push values to list (right)"""
        try:
            serialized = [pickle.dumps(v) for v in values]
            self.sync_client.rpush(key, *serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to rpush to {key}: {e}")
            return False

    def lrange(self, key: str, start: int = 0, end: int = -1) -> list:
        """Get range of values from list"""
        try:
            values = self.sync_client.lrange(key, start, end)
            return [pickle.loads(v) for v in values]
        except Exception as e:
            logger.error(f"Failed to lrange {key}: {e}")
            return []

    # Set operations
    def sadd(self, key: str, *members) -> bool:
        """Add members to set"""
        try:
            serialized = [pickle.dumps(m) for m in members]
            self.sync_client.sadd(key, *serialized)
            return True
        except Exception as e:
            logger.error(f"Failed to sadd to {key}: {e}")
            return False

    def smembers(self, key: str) -> set:
        """Get all members of set"""
        try:
            members = self.sync_client.smembers(key)
            return {pickle.loads(m) for m in members}
        except Exception as e:
            logger.error(f"Failed to smembers {key}: {e}")
            return set()


# Global Redis client instance
redis_client = RedisClient()
