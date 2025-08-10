import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import json
from upstash_redis import Redis
from shared.models.db_models import ICPModel, ICPDataModel
import os

load_dotenv()


class ServerDatabaseManager:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

        redis_url = os.getenv("UPSTASH_REDIS_REST_URL")
        redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        if not redis_token:
            raise ValueError("REDIS_TOKEN environment variable is required for Upstash")

        self.redis_client = Redis(url=redis_url, token=redis_token)

    def _get_connection(self):
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)

   

    def set_system_flag(self, key: str, value: bool) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """INSERT INTO "SystemFlag" (key, value, "updatedAt") 
                           VALUES (%s, %s, NOW()) 
                           ON CONFLICT (key) 
                           DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()""",
                        (key, value),
                    )
                    conn.commit()
                    return True
        except Exception as e:
            print(f"Error setting system flag {key}: {e}")
            return False

    def trigger_scraper_refresh(self) -> bool:
        return self.set_system_flag("scraper_refresh_needed", True)

    