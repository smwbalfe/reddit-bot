import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def get_configs():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM "Config"')
            return cur.fetchall()

def insert_reddit_post(subreddit, title, content, category, url, config_id, confidence):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    '''INSERT INTO "RedditPost" 
                       (subreddit, title, content, category, url, "configId", confidence, "createdAt", "updatedAt") 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())''',
                    (subreddit, title, content, category, url, config_id, confidence)
                )
                conn.commit()
    except Exception as e:
        print(f"Failed to insert reddit post: {e}")
        print("Fetching all configs as fallback...")
        return get_configs() 