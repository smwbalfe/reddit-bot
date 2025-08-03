import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import json
from src.models.db_models import ICPModel, ICPDataModel

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
    
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
                    if row_dict.get('data'):
                        row_dict['data'] = ICPDataModel(**row_dict['data'])
                    icps.append(ICPModel(**row_dict))
                return icps
    
    def insert_reddit_post(self, post_data: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        '''INSERT INTO "RedditPost" 
                           ("icpId", "submissionId", subreddit, title, content, url, "leadQuality", "analysisData",
                            "redditCreatedAt") 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                        (post_data["icp_id"], post_data["submission_id"], post_data["subreddit"], 
                         post_data["title"], post_data["content"], post_data["url"], 
                         post_data["lead_quality"], json.dumps(post_data["analysis_data"]),
                         post_data["reddit_created_at"])
                    )
                    conn.commit()
        except Exception as e:
            print(f"Failed to insert reddit post: {e}")
            print("Fetching all ICPs as fallback...")
            return self.get_icps()
        return None
    
    def refresh_icps_cache(self) -> List[ICPModel]:
        """Force refresh of ICPs from database"""
        print("Refreshing ICPs cache...")
        return self.get_icps()

 