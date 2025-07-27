import asyncio
import json
import logging
from typing import List, AsyncGenerator
import httpx
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Post(BaseModel):
    selftext: str
    title: str
    permalink: str

class Child(BaseModel):
    data: Post

class Data(BaseModel):
    children: List[Child]

class Response(BaseModel):
    data: Data

class RedditStreamer:
    def __init__(self, subreddits: List[str] = None, limit: int = 100, interval: int = 1):
        # Lead generation focused subreddits
        self.subreddits = subreddits or [
            "startups",
            "entrepreneur",
            "smallbusiness",
            "marketing",
            "SaaS",
            "webdev",
            "digitalnomad",
            "freelance",
            "growmybusiness",
            "businessnetworking"
        ]
        self.limit = limit
        self.interval = interval
        
    async def fetch_posts(self) -> List[Post]:
        all_posts = []
        async with httpx.AsyncClient() as client:
            for subreddit in self.subreddits:
                try:
                    url = f"https://www.reddit.com/r/{subreddit}/new/.json?limit={self.limit}"
                    response = await client.get(url)
                    
                    if response.status_code >= 200 and response.status_code < 300:
                        reddit_response = Response(**response.json())
                        posts = [child.data for child in reddit_response.data.children]
                        all_posts.extend(posts)
                        logger.info(f"Successfully fetched {len(posts)} posts from r/{subreddit}")
                    else:
                        logger.error(f"HTTP error for r/{subreddit}: Status code {response.status_code}, Response: {response.text}")
                        continue
                        
                except httpx.HTTPError as e:
                    logger.error(f"HTTP error occurred for r/{subreddit}: {e}")
                    continue
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error for r/{subreddit}: {e}")
                    continue
                except Exception as e:
                    logger.exception(f"Unexpected error for r/{subreddit}: {e}")
                    continue
        return all_posts

    async def stream_posts(self) -> AsyncGenerator[List[Post], None]:
        while True:
            posts = await self.fetch_posts()
            if posts:
                yield posts
            await asyncio.sleep(self.interval)

    async def print_all_posts(self):
        async for posts in self.stream_posts():
            for post in posts:
                print(f"Title: {post.title}")
                print(f"Selftext: {post.selftext}")
                print(f"Permalink: {post.permalink}")
                print()

async def main():
    streamer = RedditStreamer()
    await streamer.print_all_posts()

if __name__ == "__main__":
    asyncio.run(main())