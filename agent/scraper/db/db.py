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


FREE_LEAD_LIMIT = int(os.getenv("FREE_LEAD_LIMIT", 500))


class ScraperDatabaseManager:
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

    def get_icps(self) -> List[ICPModel]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "ICP"')
                rows = cur.fetchall()
                icps = []
                for row in rows:
                    row_dict = dict(row)
                    if row_dict.get("data"):
                        row_dict["data"] = ICPDataModel(**row_dict["data"])
                    icps.append(ICPModel(**row_dict))
                return icps

    def get_unseeded_icps(self) -> List[ICPModel]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT * FROM "ICP" WHERE seeded = FALSE OR seeded IS NULL'
                )
                rows = cur.fetchall()
                icps = []
                for row in rows:
                    row_dict = dict(row)
                    if row_dict.get("data"):
                        row_dict["data"] = ICPDataModel(**row_dict["data"])
                    icps.append(ICPModel(**row_dict))
                return icps

    def mark_icp_as_seeded(self, icp_id: int) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'UPDATE "ICP" SET seeded = true, "updatedAt" = NOW() WHERE id = %s',
                        (icp_id,),
                    )
                    conn.commit()
                    return cur.rowcount > 0
        except Exception as e:
            print(f"Error marking ICP {icp_id} as seeded: {e}")
            return False

    def insert_reddit_post(
        self, post_data: Dict[str, Any]
    ) -> Optional[List[Dict[str, Any]]]:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """INSERT INTO "RedditPost" 
                           ("icpId", "submissionId", subreddit, title, content, url, "leadQuality", "analysisData",
                            "redditCreatedAt") 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                           ON CONFLICT ("submissionId") DO NOTHING""",
                        (
                            post_data["icp_id"],
                            post_data["submission_id"],
                            post_data["subreddit"],
                            post_data["title"],
                            post_data["content"],
                            post_data["url"],
                            post_data["lead_quality"],
                            json.dumps(post_data["analysis_data"]),
                            post_data["reddit_created_at"],
                        ),
                    )
                    conn.commit()
                    if cur.rowcount == 0:
                        print(
                            f"Post {post_data['submission_id']} already exists, skipping duplicate insert"
                        )
        except Exception as e:
            print(f"Failed to insert reddit post: {e}")
            print("Fetching all ICPs as fallback...")
            return self.get_icps()
        return None

    def post_exists(self, submission_id: str) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'SELECT COUNT(*) as count FROM "RedditPost" WHERE "submissionId" = %s',
                        (submission_id,),
                    )
                    result = cur.fetchone()
                    return result["count"] > 0 if result else False
        except Exception as e:
            print(f"Error checking if post exists: {e}")
            return False

    def post_processed_for_icp(self, icp_id: int, submission_id: str) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'SELECT COUNT(*) as count FROM "ProcessedPost" WHERE "icpId" = %s AND "submissionId" = %s',
                        (icp_id, submission_id),
                    )
                    result = cur.fetchone()
                    return result["count"] > 0 if result else False
        except Exception as e:
            print(f"Error checking if post processed for ICP {icp_id}: {e}")
            return False

    def mark_post_processed(self, icp_id: int, submission_id: str) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """INSERT INTO "ProcessedPost" ("icpId", "submissionId") 
                           VALUES (%s, %s)
                           ON CONFLICT DO NOTHING""",
                        (icp_id, submission_id),
                    )
                    conn.commit()
                    return True
        except Exception as e:
            print(f"Error marking post {submission_id} as processed for ICP {icp_id}: {e}")
            return False

    def batch_check_processed_posts(self, icp_id: int, submission_ids: list) -> set:
        """Check which posts have already been processed for an ICP. Returns set of processed submission IDs."""
        try:
            if not submission_ids:
                return set()
            
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    placeholders = ','.join(['%s'] * len(submission_ids))
                    cur.execute(
                        f'SELECT "submissionId" FROM "ProcessedPost" WHERE "icpId" = %s AND "submissionId" IN ({placeholders})',
                        [icp_id] + submission_ids,
                    )
                    results = cur.fetchall()
                    return {row["submissionId"] for row in results}
        except Exception as e:
            print(f"Error batch checking processed posts for ICP {icp_id}: {e}")
            return set()

    def get_system_flag(self, key: str) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute('SELECT value FROM "SystemFlag" WHERE key = %s', (key,))
                    result = cur.fetchone()
                    return result["value"] if result else False
        except Exception as e:
            print(f"Error getting system flag {key}: {e}")
            return False

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

    def set_initial_seeding_mode(self, enabled: bool) -> bool:
        return self.set_system_flag("initial_seeding_mode", enabled)

    def set_system_flag(self, key: str, value) -> bool:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Handle both boolean and string values
                    if isinstance(value, str):
                        cur.execute(
                            """INSERT INTO "SystemFlag" (key, "stringValue", "updatedAt") 
                               VALUES (%s, %s, NOW()) 
                               ON CONFLICT (key) 
                               DO UPDATE SET "stringValue" = EXCLUDED."stringValue", "updatedAt" = NOW()""",
                            (key, value),
                        )
                    else:
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

    def is_user_subscribed(self, user_id: str) -> bool:
        """Check if user has active Stripe subscription using same pattern as NextJS"""
        try:
            customer_id = self.redis_client.get(f"user:{user_id}:stripe-customer-id")
            if not customer_id:
                return False

            sub_data = self.redis_client.get(
                f"stripe:customer:{customer_id}:sub-status"
            )
            if not sub_data:
                return False

            if isinstance(sub_data, (bytes, str)):
                import json

                if isinstance(sub_data, bytes):
                    sub_data = sub_data.decode()
                sub_data = json.loads(sub_data)

            return sub_data.get("status") == "active"
        except Exception as e:
            print(f"Error checking subscription for user {user_id}: {e}")
            return False

    def get_user_monthly_qualified_leads(self, user_id: str) -> int:
        """Get qualified leads count for current month from UsageTracking table"""
        try:
            from datetime import datetime

            now = datetime.now()

            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'SELECT "qualifiedLeads" FROM "UsageTracking" WHERE "userId" = %s AND month = %s AND year = %s',
                        (user_id, now.month, now.year),
                    )
                    result = cur.fetchone()
                    return result["qualifiedLeads"] if result else 0
        except Exception as e:
            print(f"Error getting monthly qualified leads for user {user_id}: {e}")
            return 0

    def increment_user_qualified_leads(self, user_id: str) -> None:
        """Increment qualified leads count for current month in UsageTracking table"""
        try:
            from datetime import datetime

            now = datetime.now()

            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # First try to update existing record
                    cur.execute(
                        """UPDATE "UsageTracking" 
                           SET "qualifiedLeads" = "qualifiedLeads" + 1, "updatedAt" = NOW()
                           WHERE "userId" = %s AND month = %s AND year = %s""",
                        (user_id, now.month, now.year),
                    )

                    # If no rows were updated, insert a new record
                    if cur.rowcount == 0:
                        cur.execute(
                            """INSERT INTO "UsageTracking" ("userId", month, year, "qualifiedLeads", "updatedAt")
                               VALUES (%s, %s, %s, 1, NOW())""",
                            (user_id, now.month, now.year),
                        )

                    conn.commit()
        except Exception as e:
            print(f"Error incrementing qualified leads for user {user_id}: {e}")

    def can_user_add_lead(self, user_id: str) -> bool:
        """Check if user can add more leads (40 limit for non-subscribers)"""
        is_subscribed = self.is_user_subscribed(user_id)
        if is_subscribed:
            return True

        monthly_leads = self.get_user_monthly_qualified_leads(user_id)
        return monthly_leads < FREE_LEAD_LIMIT
