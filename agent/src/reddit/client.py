import asyncpraw
import os
import logging
import asyncio
from dotenv import load_dotenv

load_dotenv()


class RedditClient:
    def __init__(self):
        required_envs = ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"]
      
        
    
        
        self.client_id = os.getenv("REDDIT_CLIENT_ID")
        self.client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        print(self.client_id, self.client_secret)  
        self._reddit = None
        self._current_loop = None

    def get_client(self) -> asyncpraw.Reddit:
        current_loop = asyncio.get_event_loop()

        if self._reddit is None or self._current_loop != current_loop:
            if self._reddit is not None:
                try:
                    asyncio.create_task(self._reddit.close())
                except:
                    pass

            self._reddit = asyncpraw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                user_agent=f"python:reddit-bot:v1.0 (by /u/sbdevs)",
                username=os.getenv("REDDIT_USERNAME"),
                password=os.getenv("REDDIT_PASSWORD")
            )
            self._current_loop = current_loop

        return self._reddit

    async def close(self):
        if self._reddit is not None:
            await self._reddit.close()
            self._reddit = None
            self._current_loop = None

    async def get_subreddit(self, subreddit_name: str):
        if not subreddit_name or not subreddit_name.strip():
            raise ValueError(
                f"Invalid subreddit name: '{subreddit_name}' - cannot be empty"
            )
        reddit = self.get_client()
        return await reddit.subreddit(subreddit_name.strip())
