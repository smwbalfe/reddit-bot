import asyncpraw
import os
import logging

logger = logging.getLogger(__name__)

class RedditClient:
    def __init__(self):
        self.client_id = os.getenv("REDDIT_CLIENT_ID") or ""
        self.client_secret = os.getenv("REDDIT_CLIENT_SECRET") or ""
        self._reddit = None
        logger.info("RedditClient initialized")
    
    def get_client(self) -> asyncpraw.Reddit:
        if self._reddit is None:
            self._reddit = asyncpraw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent="RedditBot/1.0",
            )
            logger.info("Reddit client created")
        return self._reddit
    
    async def get_subreddit(self, subreddit_name: str):
        reddit = self.get_client()
        return await reddit.subreddit(subreddit_name)