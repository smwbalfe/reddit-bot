import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
    
    def _get_connection(self):
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
    
    def get_icps(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT * FROM "ICP"')
                return cur.fetchall()
    
    def insert_reddit_post(self, subreddit: str, title: str, content: str, 
                          category: str, url: str, icp_id: int, 
                          confidence: float, justification: str = None) -> Optional[List[Dict[str, Any]]]:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        '''INSERT INTO "RedditPost" 
                           (subreddit, title, content, category, url, "icpId", confidence, justification, "createdAt", "updatedAt") 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())''',
                        (subreddit, title, content, category, url, icp_id, confidence, justification)
                    )
                    conn.commit()
        except Exception as e:
            print(f"Failed to insert reddit post: {e}")
            print("Fetching all ICPs as fallback...")
            return self.get_icps()
        return None

 