import asyncio
import logging
from src.rclient.client import RedditClient
from src.db import DatabaseManager
from src.agent.tools import score_lead_intent

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ACCEPTED_SUBREDDITS = ['cats', 'catpictures', 'AskReddit','catadvice', 'catlovers', 'catowners', 'catcare', 'catmemes', 'catpics', 'catlove', 'catsareassholes', 'catswhoyell', 'catswithjobs', 'catsstandingup', 'catpranks', 'catadoption', 'catrescue']
SLEEP_INTERVAL = 1

async def process_post(post, db_manager, icps):
    """Process a Reddit post by scoring it against all ICPs and storing results"""
    subreddit_name = post.subreddit.display_name
    
    logger.info(f"Processing post in r/{subreddit_name}: {post.title}")
    
    post_content = ""
    if hasattr(post, 'selftext') and post.selftext:
        post_content = post.selftext
    
    # Score the post against each ICP
    for icp in icps:
        try:
            # Score lead intent using the agent
            result = await score_lead_intent(
                post_title=post.title,
                post_content=post_content,
                icp_description=icp['description']
            )
            
            # Only store posts with medium to high confidence (>30.0)
            if result.confidence > 30.0:
                db_manager.insert_reddit_post(
                    subreddit=subreddit_name,
                    title=post.title,
                    content=post_content,
                    category=result.category,
                    url=post.url,
                    icp_id=icp['id'],
                    confidence=result.confidence,
                    justification=result.justification
                )
                
                logger.info(f"Stored post for ICP {icp['name']} with confidence {result.confidence}")
            
        except Exception as e:
            logger.error(f"Error processing post for ICP {icp['name']}: {e}")

async def monitor_all_subreddits(reddit_client, db_manager):
    """Monitor discrete list of subreddits"""
    logger.info("Starting monitoring for discrete subreddits")
    
    # Get ICPs from database
    icps = db_manager.get_icps()
    if not icps:
        logger.error("No ICPs found in database")
        return

    logger.info(f"Found {len(icps)} ICPs to score against")

    try:
        subreddit_string = "+".join(ACCEPTED_SUBREDDITS)
        subreddit = await reddit_client.get_subreddit(subreddit_string)
        async for post in subreddit.stream.submissions(skip_existing=True):
            print(post)
            await process_post(post, db_manager, icps)
            await asyncio.sleep(SLEEP_INTERVAL)

    except Exception as e:
        logger.error(f"Error monitoring subreddits: {e}")
        await asyncio.sleep(5)

async def main():
    logger.info("Starting Reddit Bot")
    
    reddit_client = RedditClient()
    db_manager = DatabaseManager()
    
    # Monitor discrete list of subreddits
    await monitor_all_subreddits(reddit_client, db_manager)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down Reddit Bot")
