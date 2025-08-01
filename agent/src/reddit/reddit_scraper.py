import asyncio
import logging
from src.reddit.client import RedditClient
from src.db.db import DatabaseManager
from src.agent.services import score_lead_intent_two_stage

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


SLEEP_INTERVAL = 1

# Global state for configuration management
class ConfigManager:
    def __init__(self):
        self.needs_refresh = False
        self.current_icps = []
        self.current_subreddits = []
    
    def trigger_refresh(self):
        """Signal that ICPs need to be refreshed"""
        self.needs_refresh = True
        logger.info("ICP configuration refresh triggered")
    
    def refresh_complete(self, icps, subreddits):
        """Mark refresh as complete with new data"""
        self.needs_refresh = False
        self.current_icps = icps
        self.current_subreddits = subreddits
        logger.info(f"ICP configuration refreshed: {len(icps)} ICPs, {len(subreddits)} subreddits")

# Global config manager instance
config_manager = ConfigManager()

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

    subreddit_name = post.subreddit.display_name
    
    logger.info(f"Processing post in r/{subreddit_name}: {post.title}")
    
    post_content = ""
    if hasattr(post, 'selftext') and post.selftext:
        post_content = post.selftext
    
    for icp in icps:
        try:
            # Two-stage scoring: fast model for initial filtering, better model for promising leads
            result = await score_lead_intent_two_stage(
                post_title=post.title,
                post_content=post_content,
                icp_description=icp['description']
            )
            
            # Store if final score > 30
            if result.final_score > 30:
                logger.info("Storing Lead - Approved by two-stage scoring")
                
                db_manager.insert_reddit_post(
                    subreddit=subreddit_name,
                    title=post.title,
                    content=post_content,
                    url=post.url,
                    icp_id=icp['id'],
                    lead_quality=result.lead_quality,
                    submission_id=post.id,
                    pain_points=result.pain_points,
                    product_fit_score=result.factor_scores.product_fit,
                    intent_signals_score=result.factor_scores.intent_signals,
                    urgency_indicators_score=result.factor_scores.urgency_indicators,
                    decision_authority_score=result.factor_scores.decision_authority,
                    engagement_quality_score=result.factor_scores.engagement_quality,
                    product_fit_justification=result.factor_justifications.product_fit,
                    intent_signals_justification=result.factor_justifications.intent_signals,
                    urgency_indicators_justification=result.factor_justifications.urgency_indicators,
                    decision_authority_justification=result.factor_justifications.decision_authority,
                    engagement_quality_justification=result.factor_justifications.engagement_quality
                )
                
                logger.info(f"Stored post for ICP {icp['name']} with final score {result.final_score} - Two-stage scoring approved")
            else:
                logger.info(f"Rejected post for ICP {icp['name']} with final score {result.final_score} - Two-stage scoring rejected")
            
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

async def refresh_monitoring_config(db_manager):
    """Refresh ICP configuration and restart monitoring if needed"""
    logger.info("Refreshing ICP configuration...")
    
    # Get fresh ICPs from database
    icps = db_manager.refresh_icps_cache()
    
    if not icps:
        logger.info("No ICPs found in database - entering idle mode")
        config_manager.refresh_complete([], [])
        return [], []
    
    all_subreddits = get_all_subreddits_from_icps(icps)
    
    if not all_subreddits:
        logger.info("No subreddits found in any ICP - entering idle mode")
        config_manager.refresh_complete(icps, [])
        return icps, []
    
    all_subreddits.append("TestAgent")
    all_subreddits = [s.replace("r/", "") for s in all_subreddits]
    
    # Update global config
    config_manager.refresh_complete(icps, all_subreddits)
    
    return icps, all_subreddits

async def monitor_all_subreddits(reddit_client, db_manager):
    """Monitor subreddits collated from all ICPs with dynamic config refresh"""
    logger.info("Starting monitoring for ICP subreddits")

    while True:
        # Initial configuration load
        icps, all_subreddits = await refresh_monitoring_config(db_manager)
        
        # If no configurations, enter idle mode
        if not icps or not all_subreddits:
            logger.info("No active configurations - entering idle mode, waiting for config changes...")
            while not config_manager.needs_refresh:
                await asyncio.sleep(0.1)  # Much shorter sleep for instant response
            continue

        subreddit_string = "+".join(all_subreddits)
        logger.info(f"Monitoring {len(all_subreddits)} unique subreddits: {subreddit_string}")

        current_subreddit = None
        
        try:
            current_subreddit = await reddit_client.get_subreddit(subreddit_string)
            
            async for post in current_subreddit.stream.submissions(skip_existing=False):
                # Check if configuration needs refresh
                if config_manager.needs_refresh:
                    logger.info("Configuration change detected, refreshing...")
                    
                    new_icps, new_subreddits = await refresh_monitoring_config(db_manager)
                    
                    # If configs were removed, break out to idle mode
                    if not new_icps or not new_subreddits:
                        logger.info("All configurations removed, switching to idle mode")
                        break
                    
                    icps = new_icps
                    all_subreddits = new_subreddits
                    
                    # Check if subreddit list changed
                    new_subreddit_string = "+".join(all_subreddits)
                    if new_subreddit_string != subreddit_string:
                        logger.info(f"Subreddit list changed, restarting stream with: {new_subreddit_string}")
                        subreddit_string = new_subreddit_string
                        current_subreddit = await reddit_client.get_subreddit(subreddit_string)
                        # Break to restart the stream with new subreddits
                        break
                
                await process_post(post, db_manager, icps)
                
                # Use shorter sleep to be more responsive to config changes
                await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Error monitoring subreddits: {e}")
            await asyncio.sleep(5)
            # Continue to retry

async def reddit_main():
    logger.info("Starting Reddit Bot")
    reddit_client = RedditClient()
    db_manager = DatabaseManager()
    await monitor_all_subreddits(reddit_client, db_manager)
