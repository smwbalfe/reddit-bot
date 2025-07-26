import asyncio
import logging
from tools import process_batch_prompts, PromptRequest
from db import insert_reddit_post, get_configs
from src.rclient.client import RedditClient

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 70
CONFIG_POLL_INTERVAL = 10
MONITORING_SLEEP_INTERVAL = 5

current_configs = []
active_tasks = {}

async def process_post(post, configs):
    if not configs:
        return
    
    matching_configs = [config for config in configs if config['subreddit'] == str(post.subreddit)]
    if not matching_configs:
        return
    
    prompts = []
    for config in matching_configs:
        prompt_content = f"ConfigId: {config['id']}\nAgentPrompt: {config['agentPrompt']}\n---\nTitle: {post.title}\nContent: {getattr(post, 'selftext', '')}\nURL: {post.url}"
        prompts.append(prompt_content)
    
    prompt_request = PromptRequest(subreddit=str(post.subreddit), prompts=prompts)
    batch_response = await process_batch_prompts(prompt_request)
    
    for i, score_data in enumerate(batch_response.scores):
        if i < len(matching_configs) and score_data.confidence >= CONFIDENCE_THRESHOLD:
            config = matching_configs[i]
            logger.info(f"Saving post '{post.title}' with confidence {score_data.confidence} for config {config['id']}")
            insert_reddit_post(
                subreddit=str(post.subreddit),
                title=post.title,
                content=getattr(post, 'selftext', ''),
                category="post",
                url=post.url,
                config_id=config['id'],
                confidence=score_data.confidence
            )

async def update_configs():
    global current_configs
    while True:
        try:
            await asyncio.sleep(CONFIG_POLL_INTERVAL)
            current_configs = get_configs()
            logger.info(f"Updated configs: {len(current_configs)} configs loaded")
        except Exception as e:
            logger.error(f"Error polling configs: {e}")

async def monitor_subreddit(reddit_client, subreddit_name):
    logger.info(f"Starting monitoring for r/{subreddit_name}")
    try:
        subreddit = await reddit_client.get_subreddit(subreddit_name)
        async for post in subreddit.stream.submissions(skip_existing=True):
            configs = [config for config in current_configs if config['subreddit'] == subreddit_name]
            await process_post(post, configs)
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"Error monitoring r/{subreddit_name}: {e}")

async def manage_monitoring(reddit_client):
    global active_tasks
    logger.info("Starting Reddit monitoring")
    while True:
        try:
            current_subreddits = set(config['subreddit'] for config in current_configs)
            
            for subreddit in list(active_tasks.keys()):
                if subreddit not in current_subreddits:
                    logger.info(f"Stopping monitoring for r/{subreddit}")
                    active_tasks[subreddit].cancel()
                    del active_tasks[subreddit]
            
            for subreddit in current_subreddits:
                if subreddit not in active_tasks:
                    logger.info(f"Starting new monitor task for r/{subreddit}")
                    task = asyncio.create_task(monitor_subreddit(reddit_client, subreddit))
                    active_tasks[subreddit] = task
            
            await asyncio.sleep(MONITORING_SLEEP_INTERVAL)
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
            await asyncio.sleep(MONITORING_SLEEP_INTERVAL)

async def main():
    global current_configs
    logger.info("Starting Reddit Bot")
    
    reddit_client = RedditClient()
    current_configs = get_configs()
    logger.info(f"Loaded {len(current_configs)} initial configs")
    
    config_task = asyncio.create_task(update_configs())
    monitor_task = asyncio.create_task(manage_monitoring(reddit_client))
    
    await asyncio.gather(config_task, monitor_task)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down Reddit Bot")
