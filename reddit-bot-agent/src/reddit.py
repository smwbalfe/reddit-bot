import praw
import os
import logging
from dotenv import load_dotenv
from src.agent import agent

load_dotenv()

logging.basicConfig(
    level=logging.WARNING,
    format="%(message)s"
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def setup_reddit_client():
    logger.info("Setting up Reddit client")
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent="RedditScraper/1.0"
    )

def stream_subreddit(subreddit_name: str):
    logger.info(f"\n\n==============================\nStreaming Subreddit: {subreddit_name}\n==============================\n")
    reddit = setup_reddit_client()
    subreddit = reddit.subreddit(subreddit_name)
    for post in subreddit.stream.submissions(skip_existing=True):
        logger.info(f"\n--- New Post ---\nTitle: {post.title}\n")
        response = agent.run_sync([f"Title: {post.title}", f"Content: {post.selftext}"])
        logger.info(f"\n--- Agent Response ---\n{response.output}\n")

if __name__ == "__main__":
    stream_subreddit("AskReddit")