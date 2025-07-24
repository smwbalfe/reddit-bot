import os
import asyncio
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
from tools import agent
import asyncpraw
from db import get_configs

load_dotenv()

reddit_client_id = os.getenv("REDDIT_CLIENT_ID") or ""
reddit_client_secret = os.getenv("REDDIT_CLIENT_SECRET") or ""

print("REDDIT_CLIENT_ID:", reddit_client_id)
print("REDDIT_CLIENT_SECRET:", reddit_client_secret)

class RedditConfig(BaseModel):
    id: int
    subreddit: str
    agentPrompt: str

def get_reddit_client() -> asyncpraw.Reddit:
    print("Creating Reddit client...")
    return asyncpraw.Reddit(
        client_id=reddit_client_id,
        client_secret=reddit_client_secret,
        user_agent="RedditScraper/1.0",
    )

async def process_post(post, config: RedditConfig):
    print(f"Processing: {post.title[:50]}... from r/{config.subreddit}")
    content = [
        f"Title: {post.title}",
        f"Subreddit: {post.subreddit}",
        f"Content: {getattr(post, 'selftext', '')}",
        f"URL: {post.url}",
        f"AgentPrompt: {config.agentPrompt}",
        f"ConfigId: {config.id}",
    ]
    response = await agent.run(content)
    print(response.output)

async def monitor_subreddit(config: RedditConfig, reddit: asyncpraw.Reddit):
    print(f"Monitoring r/{config.subreddit}")
    try:
        subreddit = await reddit.subreddit(config.subreddit)
        async for post in subreddit.stream.submissions(skip_existing=True):
            await process_post(post, config)
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"Error monitoring r/{config.subreddit}: {e}")

async def main():
    print("Starting Reddit Bot...")
    reddit = get_reddit_client()
    
    config_data = get_configs()
    configs = [
        RedditConfig(
            id=config['id'],
            subreddit=config['subreddit'],
            agentPrompt=config['agentPrompt']
        )
        for config in config_data
    ]
    
    tasks = []
    for config in configs:
        task = asyncio.create_task(monitor_subreddit(config, reddit))
        tasks.append(task)
    
    print(f"Started monitoring {len(tasks)} subreddits")
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down...")
