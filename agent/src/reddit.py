import asyncio
import logging
import json
from src.rclient.client import RedditClient
from src.db import DatabaseManager
from src.agent.tools import score_lead_intent

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ACCEPTED_SUBREDDITS = [
    'entrepreneur', 'startups', 'AskReddit', 'SaaS', 'Entrepreneur', 'smallbusiness', 'business', 'venturecapital', 'growmybusiness', 'marketing', 'sales', 'ProductManagement', 'nocode', 'indiehackers', 'sideproject', 'juststart', 'ecommerce', 'freelance', 'consulting', 'b2b', 'startup', 'techstartups', 'YCombinator', 'microSaaS', 'bootstrapped', 'mvp', 'ProductHunt', 'growthhacking', 'digitalmarketing', 'contentmarketing', 'emailmarketing', 'socialmediamarketing', 'SEO', 'PPC', 'analytics', 'customerSuccess', 'leadgeneration', 'b2bsales', 'salessoftware', 'crm', 'automation', 'productivity', 'remotework', 'entrepreneurship', 'businessplan', 'funding', 'investing', 'angelinvesting', 'seedfunding', 'seriesA', 'lean', 'agile', 'tools', 'softwarerecommendations', 'monetization', 'revenue', 'mrr', 'arr', 'churn', 'retention', 'onboarding', 'ux', 'ui', 'design', 'webdesign', 'frontend', 'backend', 'fullstack', 'lowcode', 'bubble', 'webflow', 'airtable', 'notion', 'slack', 'discord', 'stripe', 'paypal', 'shopify', 'wordpress', 'woocommerce', 'squarespace', 'wix', 'cloudflare', 'github', 'docker', 'kubernetes', 'heroku', 'netlify', 'vercel', 'supabase', 'firebase', 'mongodb', 'postgresql', 'aws', 'azure', 'gcp', 'serverless', 'api', 'zapier', 'workflow', 'alternatives', 'ArtificialIntelligence', 'MachineLearning', 'ChatGPT', 'OpenAI', 'GPT', 'LLM', 'AITools', 'artificial', 'technology', 'coldemail', 'outbound', 'prospecting', 'salesfunnel', 'outreach', 'coldcalling', 'AiStartups', 'AIBusiness', 'ArtificialIntelligenceNews', 'email', 'emailautomation', 'salesautomation', 'scaling', 'growth', 'futurology', 'singularity'
]
SLEEP_INTERVAL = 1

def get_icps_as_json():
    """Fetch all ICPs with their keywords and return as JSON"""
    db_manager = DatabaseManager()
    icps = db_manager.get_icps()
    
    # Convert to a more readable format
    icps_data = []
    for icp in icps:
        icp_dict = {
            'id': icp['id'],
            'name': icp['name'],
            'website': icp['website'],
            'description': icp['description'],
            'keywords': icp['keywords']
        }
        icps_data.append(icp_dict)
    
    json_output = json.dumps(icps_data, indent=2)
    print(json_output)
    return json_output

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

    icps = db_manager.get_icps()
    
    if not icps:
        logger.error("No ICPs found in database")
        return

    logger.info(f"Found {len(icps)} ICPs to score against")

    try:
        subreddit_string = "+".join(ACCEPTED_SUBREDDITS)
        subreddit = await reddit_client.get_subreddit("all")
        async for post in subreddit.stream.submissions(skip_existing=True):
            await process_post(post, db_manager, icps)
            await asyncio.sleep(SLEEP_INTERVAL)

    except Exception as e:
        logger.error(f"Error monitoring subreddits: {e}")
        await asyncio.sleep(5)

async def main():
    logger.info("Starting Reddit Bot")
    
    reddit_client = RedditClient()
    db_manager = DatabaseManager()

    await monitor_all_subreddits(reddit_client, db_manager)

if __name__ == "__main__":
    # Check if we should just output ICPs as JSON
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        get_icps_as_json()
    else:
        try:
            asyncio.run(main())
        except KeyboardInterrupt:
            logger.info("Shutting down Reddit Bot")
