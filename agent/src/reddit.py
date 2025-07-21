from ntpath import exists
import os
import asyncio
from dotenv import load_dotenv
from tools import agent
import asyncpraw

load_dotenv()

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or ""
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""


def get_reddit_client():
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = "RedditScraper/1.0"
    reddit = asyncpraw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
    )
    return reddit


async def process_post(post):
    print(post)
    content = [
        f"Title: {post.title}",
        f"Subreddit: {post.subreddit}",
        f"Content: {post.selftext}",
        f"URL: {post.url}",
    ]
    print(content)
    result = await agent.run(content)
    print(result.output)


async def stream_subreddit(reddit, subreddit_name):
    import logging

    logging.basicConfig(level=logging.WARN)
    logger = logging.getLogger("stream_subreddit")
    subreddit = await reddit.subreddit(subreddit_name)
    async for post in subreddit.stream.submissions(skip_existing=True):
        logger.info(f"Processing post: {post.title}")
        await process_post(post)


async def main():
    reddit = get_reddit_client()
    subreddit_name = "AskReddit"
    await stream_subreddit(reddit, subreddit_name)
    await reddit.close()


if __name__ == "__main__":
    asyncio.run(main())
