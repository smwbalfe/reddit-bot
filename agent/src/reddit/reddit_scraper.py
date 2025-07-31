import asyncio
import logging
from src.reddit.client import RedditClient
from src.db.db import DatabaseManager
from src.agent.services import score_lead_intent, review_lead_quality

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


SLEEP_INTERVAL = 1

def contains_icp_keywords(text, icps):
    """Check if text contains any keywords from any ICP"""
    if not text:
        return False
    
    text_lower = text.lower()
    
    for icp in icps:
        if icp.get('keywords'):
            for keyword in icp['keywords']:
                if keyword.lower() in text_lower:
                    return True
    
    return False

async def process_post(post, db_manager, icps):
    """Process a Reddit post by scoring it against all ICPs and storing results"""
    subreddit_name = post.subreddit.display_name
    
    logger.info(f"Processing post in r/{subreddit_name}: {post.title}")
    
    post_content = ""
    if hasattr(post, 'selftext') and post.selftext:
        post_content = post.selftext
    
    for icp in icps:
        try:
      
            result = await score_lead_intent(
                post_title=post.title,
                post_content=post_content,
                icp_description=icp['description']
            )
            
    

            if result.lead_quality > 30.0:
                # Perform Gemini Pro review before storing
                review_approved = await review_lead_quality(
                    post_title=post.title,
                    post_content=post_content,
                    icp_description=icp['description'],
                    initial_result=result
                )
                
                if review_approved:
                    print("Storing Lead - Approved by reviewer")

                    db_manager.insert_reddit_post(
                        subreddit=subreddit_name,
                        title=post.title,
                        content=post_content,
                        url=post.url,
                        icp_id=icp['id'],
                        lead_quality=result.lead_quality,
                        lead_category=result.buying_intent_category,
                        justification=result.justification,
                        pain_points=result.pain_points,
                        suggested_engagement=result.suggested_engagement
                    )
                    
                    logger.info(f"Stored post for ICP {icp['name']} with lead quality {result.lead_quality} - Review approved")
                else:
                    logger.info(f"Rejected post for ICP {icp['name']} with lead quality {result.lead_quality} - Review rejected by Gemini Pro")
            
        except Exception as e:
            logger.error(f"Error processing post for ICP {icp['name']}: {e}")

def get_all_subreddits_from_icps(icps):
    """Collate and deduplicate all subreddits from ICPs"""
    all_subreddits = set()
    
    for icp in icps:
        if icp.get('subreddits'):
            for subreddit in icp['subreddits']:
                all_subreddits.add(subreddit.strip())
    
    all_subreddits.add("TestAgent")
    return list(all_subreddits)

async def monitor_all_subreddits(reddit_client, db_manager):
    """Monitor subreddits collated from all ICPs"""
    logger.info("Starting monitoring for ICP subreddits")

    icps = db_manager.get_icps()
    
    if not icps:
        logger.error("No ICPs found in database")
        return

    logger.info(f"Found {len(icps)} ICPs to score against")

    all_subreddits = get_all_subreddits_from_icps(icps)
    
    if not all_subreddits:
        logger.error("No subreddits found in any ICP")
        return
    
    all_subreddits.append("TestAgent")
    subreddit_string = "+".join(all_subreddits)
    logger.info(f"Monitoring {len(all_subreddits)} unique subreddits: {subreddit_string}")

    try:
        subreddit = await reddit_client.get_subreddit(subreddit_string)
        async for post in subreddit.stream.submissions(skip_existing=True):
            post_content = ""


            if hasattr(post, 'selftext') and post.selftext:
                post_content = post.selftext
            
            full_text = f"{post.title} {post_content}"
            
            await process_post(post, db_manager, icps)
            # if contains_icp_keywords(full_text, icps):
            #     await process_post(post, db_manager, icps)
            # else:
            #     print(f"Skipping post in r/{post.subreddit.display_name}: {post.title}")
            
            await asyncio.sleep(SLEEP_INTERVAL)

            

    except Exception as e:
        logger.error(f"Error monitoring subreddits: {e}")
        await asyncio.sleep(5)

async def reddit_main():
    logger.info("Starting Reddit Bot")
    reddit_client = RedditClient()
    db_manager = DatabaseManager()
    await monitor_all_subreddits(reddit_client, db_manager)
