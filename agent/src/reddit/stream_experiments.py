import asyncio
import logging
from datetime import datetime, timezone
from src.reddit.client import RedditClient
from praw.models import Comment

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def time_ago(timestamp):
    """Convert timestamp to human readable 'time ago' format"""
    now = datetime.now(timezone.utc)
    comment_time = datetime.fromtimestamp(timestamp, timezone.utc)
    
    diff = now - comment_time
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return f"{int(seconds)}s ago"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes}m ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours}h ago"
    else:
        days = int(seconds / 86400)
        return f"{days}d ago"


async def stream_comments(subreddit_names: list):
    """Stream live comments from multiple subreddits"""
    reddit_client = RedditClient()
    
    # Create a multireddit from the list of subreddit names
    multireddit = "+".join(subreddit_names)
    subreddit = await reddit_client.get_subreddit(multireddit)
    
    logger.info(f"Starting comment stream for: {', '.join(subreddit_names)}")
    
    try:
        async for comment in subreddit.stream.comments(skip_existing=False):

            com: Comment = comment

      
            await asyncio.sleep(0.5)  # Small delay to not overwhelm output
    except Exception as e:
        logger.error(f"Error streaming comments: {e}")


async def main():
    # Just stream comments from these subreddits
    await stream_comments(["python", "programming", "learnpython"])


if __name__ == "__main__":
    asyncio.run(main())