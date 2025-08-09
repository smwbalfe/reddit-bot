import os
import time
from typing import Optional
import redis.asyncio as redis
from fastapi import HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

class RedisRateLimiter:
    def __init__(self):
        redis_url = os.getenv("UPSTASH_REDIS_REST_URL", "redis://localhost:6379")
        redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        
        if redis_token and redis_url.startswith("https://"):
            self.redis_client = redis.from_url(
                redis_url,
                password=redis_token,
                ssl=True
            )
        else:
            self.redis_client = redis.from_url(redis_url)
    
    async def is_rate_limited(self, key: str, limit: int, window: int) -> bool:
        current_time = int(time.time())
        window_start = current_time - window
        
        pipe = self.redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(current_time): current_time})
        pipe.zcard(key)
        pipe.expire(key, window)
        
        results = await pipe.execute()
        request_count = results[2]
        
        return request_count > limit

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

limiter = Limiter(key_func=get_client_ip)
rate_limiter = RedisRateLimiter()

async def check_rate_limit(request: Request, endpoint: str, limit: int, window: int):
    client_ip = get_client_ip(request)
    key = f"rate_limit:{endpoint}:{client_ip}"
    
    if await rate_limiter.is_rate_limited(key, limit, window):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {limit} requests per {window} seconds."
        )
