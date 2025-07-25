import os
import asyncio
import logging
from typing import List, Dict, Set
from pydantic import BaseModel
from tools import process_batch_prompts, PromptRequest
from db import insert_reddit_post, get_configs
import asyncpraw

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RedditConfig(BaseModel):
    id: int
    subreddit: str
    agentPrompt: str

class RedditClient:
    def __init__(self):
        self.client_id = os.getenv("REDDIT_CLIENT_ID") or ""
        self.client_secret = os.getenv("REDDIT_CLIENT_SECRET") or ""
        self.username = os.getenv("REDDIT_USERNAME") or ""
        self.password = os.getenv("REDDIT_PASSWORD") or ""
        self._reddit = None
        logger.info("RedditClient initialized")
    
    def get_client(self) -> asyncpraw.Reddit:
        if self._reddit is None:
            self._reddit = asyncpraw.Reddit(
                client_id=self.client_id,
                client_secret=self.client_secret,
                username=self.username,
                password=self.password,
                user_agent="RedditBot/1.0",
            )
            logger.info("Reddit client created")
        return self._reddit
    
    async def get_subreddit(self, subreddit_name: str):
        reddit = self.get_client()
        return await reddit.subreddit(subreddit_name)

class PostProcessor:
    def __init__(self, confidence_threshold: int = 70):
        self.confidence_threshold = confidence_threshold
        logger.info(f"PostProcessor initialized with confidence threshold: {confidence_threshold}")
    
    async def process_post(self, post, configs: List[RedditConfig]):
        if not configs:
            return
            
        logger.info(f"Processing post: {post.title} from r/{post.subreddit}")
        
        prompts = []
        for config in configs:
            prompt_content = f"ConfigId: {config.id}\nAgentPrompt: {config.agentPrompt}\nTargetSubreddit: {config.subreddit}\n---\nTitle: {post.title}\nSubreddit: {post.subreddit}\nContent: {getattr(post, 'selftext', '')}\nURL: {post.url}"
            prompts.append(prompt_content)
        
        prompt_request = PromptRequest(
            subreddit=str(post.subreddit),
            prompts=prompts
        )
        
        batch_response = await process_batch_prompts(prompt_request)
        
        for i, score_data in enumerate(batch_response.scores):
            if i < len(configs):
                config = configs[i]
                confidence_score = score_data.confidence
                if confidence_score >= self.confidence_threshold:
                    await self._save_post(post, config, confidence_score)
    
    async def _save_post(self, post, config: RedditConfig, confidence_score: int):
        logger.info(f"Saving post '{post.title}' with confidence {confidence_score} for config {config.id}")
        insert_reddit_post(
            subreddit=str(post.subreddit),
            title=post.title,
            content=getattr(post, 'selftext', ''),
            category="post",
            url=post.url,
            config_id=config.id,
            confidence=confidence_score
        )
        
        # Reply to the post
        try:
            await post.reply(config.agentPrompt)
            logger.info(f"Successfully replied to post '{post.title}' with agent prompt")
        except Exception as e:
            logger.error(f"Failed to reply to post '{post.title}': {e}")

class ConfigManager:
    def __init__(self, poll_interval: int = 10):
        self.poll_interval = poll_interval
        self.current_configs: List[RedditConfig] = []
        logger.info(f"ConfigManager initialized with poll interval: {poll_interval}s")
    
    async def load_initial_configs(self):
        config_data = get_configs()
        self.current_configs = [
            RedditConfig(
                id=config['id'],
                subreddit=config['subreddit'],
                agentPrompt=config['agentPrompt']
            )
            for config in config_data
        ]
        logger.info(f"Loaded {len(self.current_configs)} initial configs")
    
    async def start_polling(self):
        logger.info("Starting config polling")
        while True:
            try:
                await asyncio.sleep(self.poll_interval)
                new_config_data = get_configs()
                new_configs = [
                    RedditConfig(
                        id=config['id'],
                        subreddit=config['subreddit'],
                        agentPrompt=config['agentPrompt']
                    )
                    for config in new_config_data
                ]
                self.current_configs.clear()
                self.current_configs.extend(new_configs)
                logger.info(f"Updated configs: {len(new_configs)} configs loaded")
            except Exception as e:
                logger.error(f"Error polling configs: {e}")
    
    def get_configs(self) -> List[RedditConfig]:
        return self.current_configs.copy()
    
    def get_subreddits(self) -> Set[str]:
        return set(config.subreddit for config in self.current_configs)

class RedditMonitor:
    def __init__(self, reddit_client: RedditClient, post_processor: PostProcessor, config_manager: ConfigManager):
        self.reddit_client = reddit_client
        self.post_processor = post_processor
        self.config_manager = config_manager
        self.active_tasks: Dict[str, asyncio.Task] = {}
        logger.info("RedditMonitor initialized")
    
    async def monitor_subreddit(self, subreddit_name: str):
        logger.info(f"Starting monitoring for r/{subreddit_name}")
        try:
            subreddit = await self.reddit_client.get_subreddit(subreddit_name)
            async for post in subreddit.stream.submissions(skip_existing=True):
                await self.post_processor.process_post(post, self.config_manager.get_configs())
                await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Error monitoring r/{subreddit_name}: {e}")
    
    async def start_monitoring(self):
        logger.info("Starting Reddit monitoring")
        while True:
            try:
                current_subreddits = self.config_manager.get_subreddits()
                
                for subreddit in list(self.active_tasks.keys()):
                    if subreddit not in current_subreddits:
                        logger.info(f"Stopping monitoring for r/{subreddit}")
                        self.active_tasks[subreddit].cancel()
                        del self.active_tasks[subreddit]
                
                for subreddit in current_subreddits:
                    if subreddit not in self.active_tasks:
                        logger.info(f"Starting new monitor task for r/{subreddit}")
                        task = asyncio.create_task(self.monitor_subreddit(subreddit))
                        self.active_tasks[subreddit] = task
                
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)

async def main():
    logger.info("Starting Reddit Bot")
    reddit_client = RedditClient()
    post_processor = PostProcessor()
    config_manager = ConfigManager()
    reddit_monitor = RedditMonitor(reddit_client, post_processor, config_manager)
    
    await config_manager.load_initial_configs()
    
    config_task = asyncio.create_task(config_manager.start_polling())
    monitor_task = asyncio.create_task(reddit_monitor.start_monitoring())
    
    await asyncio.gather(config_task, monitor_task)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down Reddit Bot")
