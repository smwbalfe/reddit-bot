import asyncio
from datetime import datetime
from typing import List, Optional, Set
from src.db.db import ScraperDatabaseManager
from src.lead_scoring.scoreing import score_post
from src.models.agent_models import LeadIntentResponse
from src.reddit.client import RedditClient
from src.models.db_models import ICPModel
from src.lead_scoring.lead_scoring_service import score_lead_intent_two_stage
from src.embeddings.openai_embeddings_service import embeddings_service
from src.utils.text_utils import condense_reddit_post
from asyncpraw.models import Submission

import logging

from src.reddit.post import build_post_data

logger = logging.getLogger("agent_scraper")

_shared_db_manager = None
_shared_reddit_client = None


def get_shared_db_manager() -> ScraperDatabaseManager:
    global _shared_db_manager
    if _shared_db_manager is None:
        _shared_db_manager = ScraperDatabaseManager()
    return _shared_db_manager


def get_shared_reddit_client() -> RedditClient:
    global _shared_reddit_client
    if _shared_reddit_client is None:
        _shared_reddit_client = RedditClient()
    return _shared_reddit_client


def get_scraper_config() -> dict:
    return {
        "polling_interval": 120,
        "confidence_threshold": 30,
        "initial_seeding_posts_per_subreddit": 25,
        "error_retry_delay": 60,
    }


def get_active_icps(db_manager: ScraperDatabaseManager) -> list:
    icps = db_manager.get_icps()
    logger.info(f"Loaded {len(icps)} ICPs")
    return icps


async def handle_initial_seeding(
    db_manager: ScraperDatabaseManager, icp_id: int
) -> None:
    logger.info(f"Starting initial seeding for ICP {icp_id}")
    icp = db_manager.get_icp_by_id(icp_id)
    db_manager.mark_icp_as_seeded(icp_id)
    await collect_initial_posts_for_icp(icp, db_manager)
    logger.info(f"Initial seeding completed for ICP {icp_id}")


async def handle_regular_collection(
    icps: list, db_manager: ScraperDatabaseManager
) -> None:
    if not icps:
        logger.info("No ICPs found")
        return

    tasks = []
    for icp in icps:
        task = asyncio.create_task(collect_new_posts_for_icp(icp, db_manager))
        tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Error during collection for ICP {icps[i].id}: {result}")

    logger.info("Collection cycle completed")


def get_subreddits_for_icp(icp: ICPModel) -> Set[str]:
    subreddits = set()
    if not icp.data or not icp.data.subreddits:
        return subreddits
    for subreddit in icp.data.subreddits:
        clean_subreddit = subreddit.strip() if subreddit else ""
        if clean_subreddit:
            subreddits.add(clean_subreddit)
    logger.info(f"ICPID {icp.id} subreddits: {subreddits}")
    return subreddits


async def process_subreddit_posts(subreddit_name: str, icp: ICPModel, db_manager: ScraperDatabaseManager, limit: int = 100):
    reddit_client = get_shared_reddit_client()
    subreddit = await reddit_client.get_subreddit(subreddit_name)
    
    can_add_lead = db_manager.can_user_add_lead(icp.userId)
    if not can_add_lead:
        logger.info(f"SKIPPED: User {icp.userId} has reached their lead limit")
        return
    
    posts_to_process = []
    async for post in subreddit.new(limit=limit):
        processed = db_manager.post_processed_for_icp(icp.id, post.id)
        if not processed:
            posts_to_process.append(post)
    
    await process_posts_in_batches(posts_to_process, icp, db_manager)


async def process_posts_in_batches(posts: List[Submission], icp: ICPModel, db_manager: ScraperDatabaseManager, batch_size: int = 25):
    for i in range(0, len(posts), batch_size):
        batch = posts[i:i + batch_size]
        tasks = []
        for post in batch:
            task = asyncio.create_task(process_post_for_icp(post, icp, db_manager))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for j, result in enumerate(results):
            if isinstance(result, Exception):
                post_id = getattr(batch[j], 'id', 'unknown')
                logger.warning(f"Exception processing post {post_id} for ICP {icp.id}: {result}")


async def collect_new_posts_for_icp(icp: ICPModel, db_manager: ScraperDatabaseManager):
    logger.info(f"Collecting posts for ICP {icp.id}")
    subreddits = get_subreddits_for_icp(icp)

    if not subreddits:
        logger.info(f"No subreddits configured for ICP {icp.id}")
        return

    tasks = [process_subreddit_posts(subreddit_name, icp, db_manager) for subreddit_name in subreddits]
    await asyncio.gather(*tasks, return_exceptions=True)


async def collect_initial_posts_for_icp(
    icp: ICPModel,
    db_manager: ScraperDatabaseManager,
):
    subreddits = get_subreddits_for_icp(icp)
    reddit_client = get_shared_reddit_client()
    await collect_initial_posts(icp, subreddits, reddit_client, db_manager)


def should_process_post(
    post: Submission, icp: ICPModel, db_manager: ScraperDatabaseManager
) -> bool:
    processed = db_manager.post_processed_for_icp(icp.id, post.id)
    if processed:
        logger.info(
            f"SKIPPED DUPLICATE: Post {post.id} already processed for ICP {icp.id}"
        )
        return False
    
    can_add_lead = db_manager.can_user_add_lead(icp.userId)
    if not can_add_lead:
        logger.info(
            f"SKIPPED LEAD LIMIT: User {icp.userId} has reached their lead limit"
        )
        return False
    
    return True 


def embeddings_prefilter(
    post: Submission, icp: ICPModel, threshold: float = 25.0
) -> tuple[bool, float]:
    """Use OpenAI embeddings to prefilter posts before expensive LLM scoring"""
    try:
        post_text = condense_reddit_post(post.title, post.selftext or "")
        icp_description = (
            icp.data.description if icp.data and icp.data.description else ""
        )

        if not post_text or not icp_description:
            logger.warning(
                f"Missing text for embeddings check: post={bool(post_text)}, icp={bool(icp_description)}"
            )
            return False, 0.0

        passes_filter, similarity_score = embeddings_service.check_similarity(
            post_text, icp_description, threshold
        )

        logger.info(
            f"EMBEDDING SCORE: Post {post.id} similarity {similarity_score:.1f}% (threshold: {threshold}%) - {'PASS' if passes_filter else 'FAIL'}"
        )
        return passes_filter, similarity_score

    except Exception as e:
        logger.warning(f"Error in embeddings prefilter for post {post.id}: {e}")
        return True, 0.0


async def process_post_for_icp(
    post: Submission,
    icp: ICPModel,
    db_manager: ScraperDatabaseManager,
):
    db_manager.mark_post_processed(icp.id, post.id)

    embeddings_task = asyncio.create_task(
        asyncio.to_thread(embeddings_prefilter, post, icp)
    )

    passes_embeddings, similarity_score = await embeddings_task
    logger.info(
        f"EMBEDDING FILTER: Post {post.id} similarity {similarity_score:.1f}% - {'PASS' if passes_embeddings else 'FAIL'}"
    )
    if not passes_embeddings:
        logger.info(
            f"SKIPPED EMBEDDING FILTER: Post {post.id} filtered out (similarity: {similarity_score:.1f}%)"
        )
        return

    result = await score_post(post, icp)

    if not result:
        logger.info(f"SKIPPED: Post {post.id} - no score result")
        return

    logger.info(
        f"AGENT SCORE: Post {post.id} final_score {result.final_score}"
    )

    config = get_scraper_config()
    threshold = config["confidence_threshold"]

    if result.final_score <= threshold:
        logger.info(f"SKIPPED: Post {post.id} score {result.final_score} below threshold {threshold}")
        return

    post_data = build_post_data(post, icp, result)
    db_manager.insert_reddit_post(post_data)
    db_manager.increment_user_qualified_leads(icp.userId)


async def fetch_posts_from_time_period(subreddit, time_filter: str, limit: int, icp: ICPModel, db_manager: ScraperDatabaseManager):
    posts = []
    try:
        if time_filter == "hot":
            async for post in subreddit.hot(limit=limit):
                if should_process_post(post, icp, db_manager):
                    posts.append(post)
        else:
            async for post in subreddit.top(time_filter=time_filter, limit=limit):
                if should_process_post(post, icp, db_manager):
                    posts.append(post)
    except Exception as e:
        logger.warning(f"Error fetching {time_filter} posts: {e}")
    return posts


async def process_initial_subreddit_posts(subreddit_name: str, icp: ICPModel, reddit_client: RedditClient, db_manager: ScraperDatabaseManager, limit: int):
    subreddit = await reddit_client.get_subreddit(subreddit_name)
    
    posts_to_process = []
    
    hot_posts_limit = 30
    
    logger.info(f"Building batch for r/{subreddit_name} - fetching top {hot_posts_limit} hot posts from past month")
    category_posts = await fetch_posts_from_time_period(subreddit, "month", hot_posts_limit, icp, db_manager)
    posts_to_process.extend(category_posts)
    logger.info(f"Added {len(category_posts)} hot posts from past month to batch")
    
    logger.info(f"Batch complete for r/{subreddit_name} - total {len(posts_to_process)} posts to process")
    
    await process_posts_in_batches(posts_to_process, icp, db_manager)


async def collect_initial_posts(
    icp: ICPModel,
    subreddits: Set[str],
    reddit_client: RedditClient,
    db_manager: ScraperDatabaseManager,
):
    config = get_scraper_config()
    limit = config["initial_seeding_posts_per_subreddit"]

    tasks = [process_initial_subreddit_posts(subreddit_name, icp, reddit_client, db_manager, limit) for subreddit_name in subreddits]
    await asyncio.gather(*tasks, return_exceptions=True)


async def run_collection_cycle() -> None:
    logger.info("Starting collection cycle")
    db_manager = get_shared_db_manager()
    try:
        icps = get_active_icps(db_manager)
        await handle_regular_collection(icps, db_manager)
    except Exception as e:
        logger.error(f"Error in collection cycle: {e}")
        raise


def run_collection_cycle_sync() -> None:
    asyncio.run(run_collection_cycle())


if __name__ == "__main__":
    run_collection_cycle_sync()
