import asyncio
from datetime import datetime
from typing import Dict, Set
from dataclasses import dataclass
from src.reddit.client import RedditClient
from src.db.db import DatabaseManager
from src.models.db_models import ICPModel
from src.agent.services import score_lead_intent_two_stage
from praw.models import Submission

SLEEP_INTERVAL = 1

@dataclass
class StreamConfig:
    subreddits: Set[str]
    icp: ICPModel
    stream_id: str

class IsolatedStreamManager:
    def __init__(self):
        self.active_streams: Dict[str, asyncio.Task] = {}
        self.stream_configs: Dict[str, StreamConfig] = {}
        self.needs_refresh = False
        self._lock = asyncio.Lock()
    
    def trigger_refresh(self):
        self.needs_refresh = True
    
    async def refresh_streams(self, db_manager: DatabaseManager):
        async with self._lock:
            print("Refreshing streams...")
            icps = db_manager.refresh_icps_cache()
            if not icps:
                print("No ICPs found, stopping all streams.")
                await self._stop_all_streams()
                return
            
            new_configs = {}
            for icp in icps:
                stream_id = f"icp_{icp.id}_stream"
                subreddits = set()
                if icp.data and icp.data.subreddits:
                    for subreddit in icp.data.subreddits:
                        subreddits.add(subreddit.strip())
                subreddits.add("TestAgent")
                
                config = StreamConfig(
                    subreddits=subreddits,
                    icp=icp,
                    stream_id=stream_id
                )
                new_configs[stream_id] = config
            
            streams_to_stop = set(self.stream_configs.keys()) - set(new_configs.keys())
            for stream_id in streams_to_stop:
                print(f"Stopping stream: {stream_id}")
                await self._stop_stream(stream_id)
            
            for stream_id, config in new_configs.items():
                if (stream_id not in self.stream_configs or 
                    self.stream_configs[stream_id].subreddits != config.subreddits or
                    self.stream_configs[stream_id].icp.id != config.icp.id):
                    
                    if stream_id in self.active_streams:
                        print(f"Restarting stream: {stream_id}")
                        await self._stop_stream(stream_id)
                    
                    print(f"Starting stream: {stream_id} for ICP {config.icp.id} with subreddits: {config.subreddits}")
                    await self._start_stream(stream_id, config, db_manager)
            
            self.stream_configs = new_configs
            self.needs_refresh = False
    
    
    async def _start_stream(self, stream_id: str, config: StreamConfig, db_manager: DatabaseManager):
        reddit_client = RedditClient()
        task = asyncio.create_task(
            self._run_isolated_stream(stream_id, config, reddit_client, db_manager)
        )
        self.active_streams[stream_id] = task
    
    async def _stop_stream(self, stream_id: str):
        if stream_id in self.active_streams:
            print(f"Stopping stream task: {stream_id}")
            task = self.active_streams[stream_id]
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                print(f"Stream {stream_id} cancelled.")
            del self.active_streams[stream_id]
        
        if stream_id in self.stream_configs:
            del self.stream_configs[stream_id]
    
    async def _stop_all_streams(self):
        print("Stopping all streams...")
        for stream_id in list(self.active_streams.keys()):
            await self._stop_stream(stream_id)
    
    async def _run_isolated_stream(self, stream_id: str, config: StreamConfig, 
                                 reddit_client: RedditClient, db_manager: DatabaseManager):
        subreddit_string = "+".join(config.subreddits)
        print(f"Running isolated stream {stream_id} for ICP {config.icp.id} on subreddits: {subreddit_string}")
        while True:
            try:
                if self.needs_refresh:
                    print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking loop.")
                    break
                
                current_subreddit = await reddit_client.get_subreddit(subreddit_string)
                print(f"ICP {config.icp.id} listening to subreddit(s): {subreddit_string}")
                
                async for post in current_subreddit.stream.submissions(skip_existing=False):
                    if self.needs_refresh:
                        print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking post loop.")
                        break
                    
                    post_subreddit = post.subreddit.display_name
                    if post_subreddit not in config.subreddits:
                        continue

                    print(f"Processing post: {post.title} in subreddit: {post_subreddit} for ICP {config.icp.id}")
                    await self._process_post_for_icp(post, db_manager, config.icp)
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                print(f"Exception in stream {stream_id} (ICP {config.icp.id}): {e}")
                if self.needs_refresh:
                    print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking after exception.")
                    break
                await asyncio.sleep(5)
    
    async def _process_post_for_icp(self, post: Submission, db_manager: DatabaseManager, icp: ICPModel):
        subreddit_name = post.subreddit.display_name
        post_content = post.selftext if post.selftext else ""
        reddit_created_at = datetime.fromtimestamp(post.created_utc).isoformat() if post.created_utc else None

        try:
            print(f"Scoring post '{post.title}' for ICP {icp.id}")
            result = await score_lead_intent_two_stage(
                post_title=post.title,
                post_content=post_content,
                icp_description=icp.data.description if icp.data and icp.data.description else "",
                icp_pain_points=icp.data.painPoints if icp.data and icp.data.painPoints else ""
            )
            print(f"Score: {result.lead_quality} | {post.title}")
            if result.lead_quality > 1:
                print(f"Inserting post '{post.title}' with score {result.lead_quality} into database.")
                post_data = {
                    "subreddit": subreddit_name,
                    "title": post.title,
                    "content": post_content,
                    "url": post.url,
                    "icp_id": icp.id,
                    "lead_quality": result.lead_quality,
                    "submission_id": post.id,
                    "reddit_created_at": reddit_created_at,
                    "analysis_data": {
                        "painPoints": result.pain_points,
                        "productFitScore": result.factor_scores.product_fit,
                        "intentSignalsScore": result.factor_scores.intent_signals,
                        "urgencyIndicatorsScore": result.factor_scores.urgency_indicators,
                        "decisionAuthorityScore": result.factor_scores.decision_authority,
                        "engagementQualityScore": result.factor_scores.engagement_quality,
                        "productFitJustification": result.factor_justifications.product_fit,
                        "intentSignalsJustification": result.factor_justifications.intent_signals,
                        "urgencyIndicatorsJustification": result.factor_justifications.urgency_indicators,
                        "decisionAuthorityJustification": result.factor_justifications.decision_authority,
                        "engagementQualityJustification": result.factor_justifications.engagement_quality
                    }
                }
                db_manager.insert_reddit_post(post_data)
        except Exception as e:
            print(f"Error processing post '{post.title}' for ICP {icp.id}: {e}")

stream_manager = IsolatedStreamManager()

async def reddit_main():
    db_manager = DatabaseManager()
    print("Starting reddit_main loop")
    await stream_manager.refresh_streams(db_manager)
    while True:
        try:
            if stream_manager.needs_refresh:
                print("Detected refresh needed in main loop.")
                await stream_manager.refresh_streams(db_manager)
            await asyncio.sleep(5)  
        except Exception as e:
            print(f"Exception in reddit_main: {e}")
            await asyncio.sleep(10) 
