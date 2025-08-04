#!/usr/bin/env python3
"""
Standalone Reddit scraper service that runs independently from the FastAPI server.
Uses database flags for synchronization instead of in-memory triggers.
"""

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
POLLING_INTERVAL_MINUTES = 1
POLLING_INTERVAL_SECONDS = POLLING_INTERVAL_MINUTES * 1
CHECK_REFRESH_INTERVAL = 5

@dataclass
class StreamConfig:
    subreddits: Set[str]
    icp: ICPModel
    stream_id: str

class DatabaseStreamManager:
    def __init__(self):
        self.active_streams: Dict[str, asyncio.Task] = {}
        self.stream_configs: Dict[str, StreamConfig] = {}
        self._lock = asyncio.Lock()
        self.db_manager = DatabaseManager()
    
    async def refresh_streams(self):
        async with self._lock:
            print("Refreshing streams...")
            icps = self.db_manager.get_icps()
            if not icps:
                print("No ICPs found, stopping all streams.")
                await self._stop_all_streams()
                return
            
            new_configs = self._build_stream_configs(icps)
            await self._stop_obsolete_streams(new_configs)
            await self._start_or_restart_streams(new_configs)
            
            self.stream_configs = new_configs
            self.db_manager.clear_scraper_refresh_flag()
    
    def _build_stream_configs(self, icps) -> Dict[str, StreamConfig]:
        new_configs = {}
        for icp in icps:
            stream_id = f"icp_{icp.id}_stream"
            subreddits = self._get_subreddits_for_icp(icp)
            
            config = StreamConfig(
                subreddits=subreddits,
                icp=icp,
                stream_id=stream_id
            )
            new_configs[stream_id] = config
        return new_configs
    
    def _get_subreddits_for_icp(self, icp) -> Set[str]:
        subreddits = set()
        if not icp.data or not icp.data.subreddits:
            subreddits.add("TestAgent")
            return subreddits
        
        for subreddit in icp.data.subreddits:
            subreddits.add(subreddit.strip())
        subreddits.add("TestAgent")
        return subreddits
    
    async def _stop_obsolete_streams(self, new_configs: Dict[str, StreamConfig]):
        streams_to_stop = set(self.stream_configs.keys()) - set(new_configs.keys())
        for stream_id in streams_to_stop:
            print(f"Stopping stream: {stream_id}")
            await self._stop_stream(stream_id)
    
    async def _start_or_restart_streams(self, new_configs: Dict[str, StreamConfig]):
        for stream_id, config in new_configs.items():
            if not self._stream_needs_restart(stream_id, config):
                continue
            
            if stream_id in self.active_streams:
                print(f"Restarting stream: {stream_id}")
                await self._stop_stream(stream_id)
            
            print(f"Starting stream: {stream_id} for ICP {config.icp.id} with subreddits: {config.subreddits}")
            await self._start_stream(stream_id, config)
    
    def _stream_needs_restart(self, stream_id: str, config: StreamConfig) -> bool:
        if stream_id not in self.stream_configs:
            return True
        
        existing_config = self.stream_configs[stream_id]
        return (existing_config.subreddits != config.subreddits or 
                existing_config.icp.id != config.icp.id)
    
    async def _start_stream(self, stream_id: str, config: StreamConfig):
        reddit_client = RedditClient()
        task = asyncio.create_task(
            self._run_isolated_stream(stream_id, config, reddit_client)
        )
        self.active_streams[stream_id] = task
    
    async def _stop_stream(self, stream_id: str):
        await self._stop_active_stream_task(stream_id)
        self._remove_stream_config(stream_id)
    
    async def _stop_active_stream_task(self, stream_id: str):
        if stream_id not in self.active_streams:
            return
        
        print(f"Stopping stream task: {stream_id}")
        task = self.active_streams[stream_id]
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print(f"Stream {stream_id} cancelled.")
        del self.active_streams[stream_id]
    
    def _remove_stream_config(self, stream_id: str):
        if stream_id in self.stream_configs:
            del self.stream_configs[stream_id]
    
    async def _stop_all_streams(self):
        print("Stopping all streams...")
        for stream_id in list(self.active_streams.keys()):
            await self._stop_stream(stream_id)
    
    async def _run_isolated_stream(self, stream_id: str, config: StreamConfig, reddit_client: RedditClient):
        subreddit_string = "+".join(config.subreddits)
        print(f"Running isolated polling stream {stream_id} for ICP {config.icp.id} on subreddits: {subreddit_string}")
        print(f"Polling interval: {POLLING_INTERVAL_MINUTES} minutes ({POLLING_INTERVAL_SECONDS} seconds)")
        
        while True:
            try:
                if self.db_manager.check_scraper_refresh_needed():
                    print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking loop.")
                    break
                
                processed_count = await self._poll_subreddit_posts(stream_id, config, reddit_client, subreddit_string)
                print(f"Processed {processed_count} new posts for ICP {config.icp.id}. Next poll in {POLLING_INTERVAL_MINUTES} minutes.")
                await asyncio.sleep(POLLING_INTERVAL_SECONDS)
                    
            except Exception as e:
                print(f"Exception in stream {stream_id} (ICP {config.icp.id}): {e}")
                if self.db_manager.check_scraper_refresh_needed():
                    print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking after exception.")
                    break
                await asyncio.sleep(60)
    
    async def _poll_subreddit_posts(self, stream_id: str, config: StreamConfig, reddit_client: RedditClient, subreddit_string: str) -> int:
        print(f"ICP {config.icp.id} polling subreddit(s): {subreddit_string}")
        current_subreddit = await reddit_client.get_subreddit(subreddit_string)
        
        processed_count = 0
        async for post in current_subreddit.new(limit=50):
            if self.db_manager.check_scraper_refresh_needed():
                print(f"Stream {stream_id} (ICP {config.icp.id}) needs refresh, breaking post loop.")
                break
            
            if not self._should_process_post(post, config):
                continue

            print(f"Processing post: {post.title} in subreddit: {post.subreddit.display_name} for ICP {config.icp.id}")
            await self._process_post_for_icp(post, config.icp)
            processed_count += 1
            await asyncio.sleep(0.1)
        
        return processed_count
    
    def _should_process_post(self, post, config: StreamConfig) -> bool:
        post_subreddit = post.subreddit.display_name
        if post_subreddit not in config.subreddits:
            return False
        
        if self._is_post_already_processed(post.id):
            return False
        
        return True
    
    def _is_post_already_processed(self, submission_id: str) -> bool:
        """Check if a post has already been processed by checking the database"""
        return self.db_manager.post_exists(submission_id)
    
    async def _process_post_for_icp(self, post: Submission, icp: ICPModel):
        try:
            result = await self._score_post(post, icp)
            print(f"Score: {result.lead_quality} | {post.title}")
            
            if result.lead_quality <= 1:
                return
            
            print(f"Inserting post '{post.title}' with score {result.lead_quality} into database.")
            post_data = self._build_post_data(post, icp, result)
            self.db_manager.insert_reddit_post(post_data)
        except Exception as e:
            print(f"Error processing post '{post.title}' for ICP {icp.id}: {e}")
    
    async def _score_post(self, post: Submission, icp: ICPModel):
        post_content = post.selftext if post.selftext else ""
        icp_description = icp.data.description if icp.data and icp.data.description else ""
        icp_pain_points = icp.data.painPoints if icp.data and icp.data.painPoints else ""
        
        print(f"Scoring post '{post.title}' for ICP {icp.id}")
        return await score_lead_intent_two_stage(
            post_title=post.title,
            post_content=post_content,
            icp_description=icp_description,
            icp_pain_points=icp_pain_points
        )
    
    def _build_post_data(self, post: Submission, icp: ICPModel, result) -> dict:
        subreddit_name = post.subreddit.display_name
        post_content = post.selftext if post.selftext else ""
        reddit_created_at = datetime.fromtimestamp(post.created_utc).isoformat() if post.created_utc else None
        
        return {
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

async def main():
    """Main function for the standalone scraper service"""
    print("Starting standalone Reddit scraper service...")
    stream_manager = DatabaseStreamManager()
    
    await stream_manager.refresh_streams()
    
    while True:
        try:
            await _check_and_refresh_streams(stream_manager)
            await asyncio.sleep(CHECK_REFRESH_INTERVAL)
        except Exception as e:
            print(f"Exception in scraper main: {e}")
            await asyncio.sleep(10)

async def _check_and_refresh_streams(stream_manager: DatabaseStreamManager):
    if not stream_manager.db_manager.check_scraper_refresh_needed():
        return
    
    print("Detected refresh needed in main loop.")
    await stream_manager.refresh_streams()

if __name__ == "__main__":
    asyncio.run(main())