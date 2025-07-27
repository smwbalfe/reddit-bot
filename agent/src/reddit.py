import asyncio
import logging
from src.rclient.client import RedditClient
from src.db import DatabaseManager
from src.agent.tools import score_lead_intent

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ACCEPTED_SUBREDDITS = [
    'entrepreneur', 'startups', 'AskReddit', 'SaaS', 'Entrepreneur', 'smallbusiness', 'business', 'venturecapital', 'growmybusiness', 'marketing', 'sales', 'ProductManagement', 'nocode', 'indiehackers', 'sideproject', 'juststart', 'ecommerce', 'freelance', 'consulting', 'b2b', 'startup', 'techstartups', 'YCombinator', 'microSaaS', 'bootstrapped', 'mvp', 'ProductHunt', 'growthhacking', 'digitalmarketing', 'contentmarketing', 'emailmarketing', 'socialmediamarketing', 'SEO', 'PPC', 'analytics', 'customerSuccess', 'leadgeneration', 'b2bsales', 'salessoftware', 'crm', 'automation', 'productivity', 'remotework', 'entrepreneurship', 'businessplan', 'funding', 'investing', 'angelinvesting', 'seedfunding', 'seriesA', 'lean', 'agile', 'tools', 'softwarerecommendations', 'monetization', 'revenue', 'mrr', 'arr', 'churn', 'retention', 'onboarding', 'ux', 'ui', 'design', 'webdesign', 'frontend', 'backend', 'fullstack', 'lowcode', 'bubble', 'webflow', 'airtable', 'notion', 'slack', 'discord', 'stripe', 'paypal', 'shopify', 'wordpress', 'woocommerce', 'squarespace', 'wix', 'cloudflare', 'github', 'docker', 'kubernetes', 'heroku', 'netlify', 'vercel', 'supabase', 'firebase', 'mongodb', 'postgresql', 'aws', 'azure', 'gcp', 'serverless', 'api', 'zapier', 'workflow', 'alternatives', 'ArtificialIntelligence', 'MachineLearning', 'ChatGPT', 'OpenAI', 'GPT', 'LLM', 'AITools', 'artificial', 'technology', 'coldemail', 'outbound', 'prospecting', 'salesfunnel', 'outreach', 'coldcalling', 'AiStartups', 'AIBusiness', 'ArtificialIntelligenceNews', 'email', 'emailautomation', 'salesautomation', 'scaling', 'growth', 'futurology', 'singularity'
]
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
            
            # Only store posts with medium to high lead quality (>30.0)
            if result.lead_quality > 1.0:
                db_manager.insert_reddit_post(
                    subreddit=subreddit_name,
                    title=post.title,
                    content=post_content,
                    category=result.category,
                    url=post.url,
                    icp_id=icp['id'],
                    lead_quality=result.lead_quality,
                    justification=result.justification
                )
                
                logger.info(f"Stored post for ICP {icp['name']} with lead quality {result.lead_quality}")
            
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
