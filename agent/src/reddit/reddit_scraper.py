import asyncio
from src.reddit.client import RedditClient
from src.db.db import DatabaseManager
from src.agent.services import score_lead_intent_two_stage


SLEEP_INTERVAL = 1

class ConfigManager:
    def __init__(self):
        self.needs_refresh = False
        self.current_icps = []
        self.current_subreddits = []
    
    def trigger_refresh(self):
        self.needs_refresh = True
    
    def refresh_complete(self, icps, subreddits):
        self.needs_refresh = False
        self.current_icps = icps
        self.current_subreddits = subreddits

config_manager = ConfigManager()

def contains_icp_keywords(text, icps):
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
    post_content = ""
    if hasattr(post, 'selftext') and post.selftext:
        post_content = post.selftext
    for icp in icps:
        try:
            result = await score_lead_intent_two_stage(
                post_title=post.title,
                post_content=post_content,
                icp_description=icp['description']
            )
            if result.final_score > 30:
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
        except Exception as e:
            pass

def get_all_subreddits_from_icps(icps):
    all_subreddits = set()
    for icp in icps:
        if icp.get('subreddits'):
            for subreddit in icp['subreddits']:
                all_subreddits.add(subreddit.strip())
    all_subreddits.add("TestAgent")
    return list(all_subreddits)

async def refresh_monitoring_config(db_manager):
    icps = db_manager.refresh_icps_cache()
    if not icps:
        config_manager.refresh_complete([], [])
        return [], []
    all_subreddits = get_all_subreddits_from_icps(icps)
    if not all_subreddits:
        config_manager.refresh_complete(icps, [])
        return icps, []
    all_subreddits.append("TestAgent")
    all_subreddits = [s.replace("r/", "") for s in all_subreddits]
    config_manager.refresh_complete(icps, all_subreddits)
    return icps, all_subreddits

async def monitor_all_subreddits(reddit_client, db_manager):
    while True:
        icps, all_subreddits = await refresh_monitoring_config(db_manager)
        if not icps or not all_subreddits:
            while not config_manager.needs_refresh:
                await asyncio.sleep(0.1)
            continue
        subreddit_string = "+".join(all_subreddits)
        current_subreddit = None
        try:
            current_subreddit = await reddit_client.get_subreddit(subreddit_string)
            async for post in current_subreddit.stream.submissions(skip_existing=False):
                if config_manager.needs_refresh:
                    new_icps, new_subreddits = await refresh_monitoring_config(db_manager)
                    if not new_icps or not new_subreddits:
                        break
                    icps = new_icps
                    all_subreddits = new_subreddits
                    new_subreddit_string = "+".join(all_subreddits)
                    if new_subreddit_string != subreddit_string:
                        subreddit_string = new_subreddit_string
                        current_subreddit = await reddit_client.get_subreddit(subreddit_string)
                        break
                await process_post(post, db_manager, icps)
                await asyncio.sleep(0.1)
        except Exception as e:
            await asyncio.sleep(5)

async def reddit_main():
    reddit_client = RedditClient()
    db_manager = DatabaseManager()
    await monitor_all_subreddits(reddit_client, db_manager)
