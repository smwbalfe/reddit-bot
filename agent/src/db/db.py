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
    
    def insert_reddit_post(self, subreddit: str, title: str, content: str, url: str, icp_id: int, 
                          lead_quality: int, submission_id: str, pain_points: str = None,
                          product_fit_score: int = None, intent_signals_score: int = None, 
                          urgency_indicators_score: int = None, decision_authority_score: int = None,
                          engagement_quality_score: int = None, product_fit_justification: str = None, 
                          intent_signals_justification: str = None, urgency_indicators_justification: str = None,
                          decision_authority_justification: str = None, engagement_quality_justification: str = None,
                          reddit_created_at: str = None, reddit_edited_at: str = None) -> Optional[List[Dict[str, Any]]]:
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        '''INSERT INTO "RedditPost" 
                           ("icpId", "submissionId", subreddit, title, content, url, "leadQuality", 
                            "painPoints", "productFitScore", "intentSignalsScore", "urgencyIndicatorsScore", 
                            "decisionAuthorityScore", "engagementQualityScore", "productFitJustification", 
                            "intentSignalsJustification", "urgencyIndicatorsJustification", 
                            "decisionAuthorityJustification", "engagementQualityJustification",
                            "redditCreatedAt", "redditEditedAt") 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                        (icp_id, submission_id, subreddit, title, content, url, lead_quality, 
                         pain_points, product_fit_score, intent_signals_score, urgency_indicators_score,
                         decision_authority_score, engagement_quality_score, product_fit_justification,
                         intent_signals_justification, urgency_indicators_justification,
                         decision_authority_justification, engagement_quality_justification,
                         reddit_created_at, reddit_edited_at)
                    )
                    conn.commit()
        except Exception as e:
            print(f"Failed to insert reddit post: {e}")
            print("Fetching all ICPs as fallback...")
            return self.get_icps()
        return None
    
    def refresh_icps_cache(self) -> List[Dict[str, Any]]:
        """Force refresh of ICPs from database"""
        return self.get_icps()

 