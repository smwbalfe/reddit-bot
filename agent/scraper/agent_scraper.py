import asyncio
from datetime import datetime
from typing import Set
from scraper.db.db import ScraperDatabaseManager
from shared.reddit.client import RedditClient
from shared.models.db_models import ICPModel
from scraper.lead_scoring.lead_scoring_service import score_lead_intent_two_stage
from scraper.embeddings.openai_embeddings_service import embeddings_service
from asyncpraw.models import Submission

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_scraper")


def get_scraper_config() -> dict:
    return {
        "polling_interval": 300,  
        "confidence_threshold": 30,
        "initial_seeding_posts_per_subreddit": 50,
        "error_retry_delay": 60,
    }


async def cancel_all_tasks(tasks: list) -> None:
    if not tasks:
        return

    logger.info(f"Cancelling {len(tasks)} running tasks")
    for task in tasks:
        if not task.done():
            task.cancel()

    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info("All tasks have been stopped")
    tasks.clear()


def create_collection_tasks(
    icps: list, db_manager: ScraperDatabaseManager, is_initial_seeding: bool = False
) -> list:
    tasks = []
    for icp in icps:
        task = asyncio.create_task(
            collect_posts_for_icp(
                icp, db_manager, is_initial_seeding=is_initial_seeding
            )
        )
        tasks.append(task)
    return tasks


async def wait_for_tasks_completion(tasks: list) -> None:
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
        tasks.clear()


def refresh_icps_if_needed(db_manager: ScraperDatabaseManager, icps: list) -> list:
    if db_manager.get_system_flag("scraper_refresh_needed") or not icps:
        logger.info("Scraper refresh flag detected - fetching fresh ICPs")
        icps = db_manager.get_icps()
        db_manager.set_system_flag("scraper_refresh_needed", False)
        logger.info(f"Loaded {len(icps)} ICPs")
    return icps


async def handle_initial_seeding(db_manager: ScraperDatabaseManager) -> None:
    unseeded_icps = db_manager.get_unseeded_icps()
    if not unseeded_icps:
        return

    logger.info(f"Found {len(unseeded_icps)} unseeded ICPs - starting initial seeding")
    db_manager.set_initial_seeding_mode(True)

    tasks = create_collection_tasks(unseeded_icps, db_manager, is_initial_seeding=True)
    logger.info(f"Starting initial seeding for {len(unseeded_icps)} ICPs")
    await wait_for_tasks_completion(tasks)

    db_manager.set_initial_seeding_mode(False)
    logger.info("Initial seeding completed")


async def handle_regular_collection(
    icps: list, db_manager: ScraperDatabaseManager
) -> None:
    logger.info("Starting regular collection cycle")
    if not icps:
        logger.info("No ICPs found")
        return

    tasks = create_collection_tasks(icps, db_manager, is_initial_seeding=False)
    logger.info(f"Starting regular collection for {len(icps)} ICPs")
    await wait_for_tasks_completion(tasks)
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


async def collect_posts_for_icp(
    icp: ICPModel, db_manager: ScraperDatabaseManager, is_initial_seeding: bool = False
):
    logger.info(
        f"Collecting posts for ICP {icp.id} (initial_seeding={is_initial_seeding})"
    )
    subreddits = get_subreddits_for_icp(icp)

    if not subreddits:
        logger.info(f"No subreddits configured for ICP {icp.id}")
        return

    reddit_client = RedditClient()

    if is_initial_seeding:
        await collect_initial_posts(icp, subreddits, reddit_client, db_manager)
    else:
        await collect_new_posts(icp, subreddits, reddit_client, db_manager)


def should_process_post(post: Submission, icp: ICPModel, db_manager: ScraperDatabaseManager) -> bool:
    processed = db_manager.post_processed_for_icp(icp.id, post.id)
    if processed:
        logger.info(f"Post {post.id} already processed for ICP {icp.id}, skipping")
    return not processed


def embeddings_prefilter(
    post: Submission, icp: ICPModel, threshold: float = 25.0
) -> tuple[bool, float]:
    """Use OpenAI embeddings to prefilter posts before expensive LLM scoring"""
    try:
        post_text = f"{post.title} {post.selftext or ''}".strip()
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
            f"Post {post.id} embeddings similarity: {similarity_score:.1f}% (threshold: {threshold}%)"
        )
        return passes_filter, similarity_score

    except Exception as e:
        logger.warning(f"Error in embeddings prefilter for post {post.id}: {e}")
        return True, 0.0  # Fall back to LLM scoring on error


async def process_post_for_icp_safe(
    post: Submission,
    icp: ICPModel,
    db_manager: ScraperDatabaseManager,
    threshold: int = None,
):
    try:
        await process_post_for_icp(post, icp, db_manager, threshold)
    except asyncio.CancelledError:
        logger.info(f"Processing cancelled for post {getattr(post, 'id', 'unknown')} for ICP {icp.id}")
        raise
    except Exception as e:
        logger.warning(
            f"Exception processing post {getattr(post, 'id', 'unknown')} for ICP {icp.id}: {e}"
        )


async def process_post_for_icp(
    post: Submission,
    icp: ICPModel,
    db_manager: ScraperDatabaseManager,
    threshold: int = None,
):
    db_manager.mark_post_processed(icp.id, post.id)
    
    # Run embeddings check and LLM scoring in parallel
    embeddings_task = asyncio.create_task(asyncio.to_thread(embeddings_prefilter, post, icp))
    scoring_task = asyncio.create_task(score_post(post, icp))
    
    # Wait for embeddings first to potentially skip expensive LLM call
    passes_embeddings, similarity_score = await embeddings_task
    if not passes_embeddings:
        logger.info(
            f"Post {post.id} filtered out by embeddings prefilter (similarity: {similarity_score:.1f}%)"
        )
        scoring_task.cancel()  # Cancel the LLM scoring since we don't need it
        try:
            await scoring_task
        except asyncio.CancelledError:
            pass
        return

    # Get the scoring result
    result = await scoring_task
    config = get_scraper_config()
    threshold = threshold or config["confidence_threshold"]
    if result.final_score <= threshold:
        logger.info(
            f"Post {post.id} scored {result.final_score}, skipping (<={threshold})"
        )
        return

    post_data = build_post_data(post, icp, result)
    post_data["embeddings_similarity"] = similarity_score
    logger.info(
        f"Inserting post {post.id} with lead_quality {result.final_score}, embeddings_similarity {similarity_score:.1f}%"
    )
    db_manager.insert_reddit_post(post_data)
    db_manager.increment_user_qualified_leads(icp.userId)


async def score_post(post: Submission, icp: ICPModel):
    post_content = post.selftext if post.selftext else ""
    icp_description = icp.data.description if icp.data and icp.data.description else ""
    icp_pain_points = icp.data.painPoints if icp.data and icp.data.painPoints else ""
    logger.info(f"Scoring post {post.id}")
    return await score_lead_intent_two_stage(
        post_title=post.title,
        post_content=post_content,
        icp_description=icp_description,
        icp_pain_points=icp_pain_points,
    )


def build_post_data(post: Submission, icp: ICPModel, result) -> dict:
    subreddit_name = post.subreddit.display_name
    post_content = post.selftext if post.selftext else ""
    reddit_created_at = (
        datetime.fromtimestamp(post.created_utc).isoformat()
        if post.created_utc
        else None
    )
    return {
        "subreddit": subreddit_name,
        "title": post.title,
        "content": post_content,
        "url": post.url,
        "icp_id": icp.id,
        "lead_quality": result.final_score,
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
            "engagementQualityJustification": result.factor_justifications.engagement_quality,
        },
    }


async def get_posts_from_various_sorts(subreddit, posts_per_sort: int):
    """Get posts from various Reddit sorting methods and time periods"""
    all_posts = []
    
    sort_methods = [
        ("hot", None),
        ("new", None),
        ("rising", None),
        ("top", "day"),
        ("top", "week"),
        ("top", "month"),
        ("controversial", "day"),
        ("controversial", "week")
    ]
    
    for sort_method, time_filter in sort_methods:
        try:
            posts_from_method = []
            if sort_method == "hot":
                async for post in subreddit.hot(limit=posts_per_sort):
                    posts_from_method.append(post)
            elif sort_method == "new":
                async for post in subreddit.new(limit=posts_per_sort):
                    posts_from_method.append(post)
            elif sort_method == "rising":
                async for post in subreddit.rising(limit=posts_per_sort):
                    posts_from_method.append(post)
            elif sort_method == "top":
                async for post in subreddit.top(time_filter=time_filter, limit=posts_per_sort):
                    posts_from_method.append(post)
            elif sort_method == "controversial":
                async for post in subreddit.controversial(time_filter=time_filter, limit=posts_per_sort):
                    posts_from_method.append(post)
            
            all_posts.extend(posts_from_method)
            logger.info(f"Collected {len(posts_from_method)} posts from {sort_method}" + (f" ({time_filter})" if time_filter else ""))
            
        except Exception as e:
            logger.warning(f"Error collecting from {sort_method}" + (f" ({time_filter})" if time_filter else "") + f": {e}")
            continue
    
    return all_posts


async def collect_initial_posts(
    icp: ICPModel,
    subreddits: Set[str],
    reddit_client: RedditClient,
    db_manager: ScraperDatabaseManager,
):
    logger.info(
        f"Initial seeding for ICP {icp.id} - collecting {get_scraper_config()['initial_seeding_posts_per_subreddit']} posts per subreddit from various sorts"
    )

    for subreddit_name in subreddits:
        logger.info(f"Initial seeding from subreddit: {subreddit_name}")
        posts_collected = 0

        try:
            individual_subreddit = await reddit_client.get_subreddit(subreddit_name)
            config = get_scraper_config()
            
            posts_per_sort = max(1, config["initial_seeding_posts_per_subreddit"] // 8)
            all_posts = await get_posts_from_various_sorts(individual_subreddit, posts_per_sort)
            
            # Batch check which posts are already processed
            submission_ids = [post.id for post in all_posts]
            already_processed = db_manager.batch_check_processed_posts(icp.id, submission_ids)
            
            processing_tasks = []
            for submission in all_posts:
                if posts_collected >= config["initial_seeding_posts_per_subreddit"]:
                    break

                if db_manager.get_system_flag("scraper_refresh_needed"):
                    logger.info(
                        f"Refresh flag detected - stopping initial seeding for ICP {icp.id}"
                    )
                    return

                if submission.id not in already_processed:
                    task = asyncio.create_task(
                        process_post_for_icp_safe(
                            submission,
                            icp,
                            db_manager,
                            threshold=get_scraper_config()["confidence_threshold"],
                        )
                    )
                    processing_tasks.append(task)
                    posts_collected += 1
                else:
                    logger.info(f"Post {submission.id} already processed for ICP {icp.id}, skipping")

            if processing_tasks:
                logger.info(f"Processing {len(processing_tasks)} initial seeding posts in parallel for ICP {icp.id}")
                await asyncio.gather(*processing_tasks, return_exceptions=True)

        except Exception as e:
            logger.warning(
                f"Error during initial seeding from subreddit {subreddit_name}: {e}"
            )
            continue

    db_manager.mark_icp_as_seeded(icp.id)
    logger.info(f"Completed initial seeding for ICP {icp.id}")


async def collect_new_posts(
    icp: ICPModel,
    subreddits: Set[str],
    reddit_client: RedditClient,
    db_manager: ScraperDatabaseManager,
    limit: int = 25,
):
    logger.info(f"Collecting posts for ICP {icp.id} from various sorts (polling mode, limit={limit})")

    # Check user lead limit once at the start
    user_can_add_leads = db_manager.can_user_add_lead(icp.userId)
    if not user_can_add_leads:
        logger.info(
            f"User {icp.userId} has reached lead limit - skipping collection for ICP {icp.id}"
        )
        return

    subreddit_string = "+".join(subreddits)
    current_subreddit = await reddit_client.get_subreddit(subreddit_string)

    try:
        posts_processed = 0
        posts_per_sort = max(1, limit // 4)
        
        sort_methods = [
            ("new", None),
            ("rising", None),
            ("hot", None),
            ("top", "hour")
        ]
        
        for sort_method, time_filter in sort_methods:
            if posts_processed >= limit:
                break
                
            try:
                posts_from_method = []
                if sort_method == "new":
                    async for post in current_subreddit.new(limit=posts_per_sort):
                        posts_from_method.append(post)
                elif sort_method == "rising":
                    async for post in current_subreddit.rising(limit=posts_per_sort):
                        posts_from_method.append(post)
                elif sort_method == "hot":
                    async for post in current_subreddit.hot(limit=posts_per_sort):
                        posts_from_method.append(post)
                elif sort_method == "top":
                    async for post in current_subreddit.top(time_filter=time_filter, limit=posts_per_sort):
                        posts_from_method.append(post)
                
                # Batch check which posts are already processed
                submission_ids = [post.id for post in posts_from_method]
                already_processed = db_manager.batch_check_processed_posts(icp.id, submission_ids)
                
                processing_tasks = []
                for submission in posts_from_method:
                    if posts_processed >= limit:
                        logger.info(f"Reached limit of {limit} posts for ICP {icp.id}")
                        break

                    if asyncio.current_task().cancelled():
                        logger.info(f"Task cancelled for ICP {icp.id}")
                        return

                    # Check refresh flag once per batch instead of per post
                    if db_manager.get_system_flag("scraper_refresh_needed"):
                        logger.info(
                            f"Refresh flag detected - stopping collection for ICP {icp.id}"
                        )
                        return

                    if submission.id not in already_processed:
                        logger.info(f"Queueing post {submission.id} for processing for ICP {icp.id}")
                        task = asyncio.create_task(
                            process_post_for_icp_safe(submission, icp, db_manager)
                        )
                        processing_tasks.append(task)
                        posts_processed += 1
                    else:
                        logger.info(f"Post {submission.id} already processed for ICP {icp.id}, skipping")

                if processing_tasks:
                    logger.info(f"Processing {len(processing_tasks)} posts in parallel for ICP {icp.id}")
                    await asyncio.gather(*processing_tasks, return_exceptions=True)
                        
            except Exception as e:
                logger.warning(f"Error collecting from {sort_method}" + (f" ({time_filter})" if time_filter else "") + f": {e}")
                continue

        logger.info(f"Processed {posts_processed} posts for ICP {icp.id}")

    except asyncio.CancelledError:
        logger.info(f"Collection cancelled for ICP {icp.id}")
        raise
    except Exception as e:
        logger.warning(f"Exception collecting posts for ICP {icp.id}: {e}")


async def run_collection_cycle(
    db_manager: ScraperDatabaseManager, icps: list, current_tasks: list
) -> list:
    db_manager.set_system_flag("scraper_paused", False)

    if db_manager.get_system_flag("scraper_refresh_needed") or not icps:
        logger.info("Scraper refresh flag detected - stopping all current tasks")
        await cancel_all_tasks(current_tasks)
        icps = refresh_icps_if_needed(db_manager, icps)

    await handle_initial_seeding(db_manager)
    await handle_regular_collection(icps, db_manager)

    return icps


async def monitor_skip_flag(db_manager: ScraperDatabaseManager) -> None:
    """Monitor skip_poll_period flag and return when detected"""
    while True:
        if db_manager.get_system_flag("skip_poll_period"):
            logger.info("Skip poll period flag detected - interrupting sleep")
            db_manager.set_system_flag("skip_poll_period", False)
            db_manager.set_system_flag("scraper_paused", False)
            return
        await asyncio.sleep(1)


async def sleep_until_next_cycle(db_manager: ScraperDatabaseManager) -> None:
    config = get_scraper_config()
    polling_interval = config["polling_interval"]

    logger.info(f"Waiting {polling_interval} seconds until next cycle")
    db_manager.set_system_flag("scraper_paused", True)

    sleep_task = asyncio.create_task(asyncio.sleep(polling_interval))
    flag_task = asyncio.create_task(monitor_skip_flag(db_manager))

    try:
        done, pending = await asyncio.wait(
            [sleep_task, flag_task], return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    except Exception as e:
        sleep_task.cancel()
        flag_task.cancel()
        try:
            await asyncio.gather(sleep_task, flag_task, return_exceptions=True)
        except:
            pass
        raise e
    finally:
        db_manager.set_system_flag("scraper_paused", False)


async def handle_main_loop_error(
    error: Exception, db_manager: ScraperDatabaseManager = None
) -> None:
    logger.warning(f"Exception in main loop: {error}")
    if db_manager:
        db_manager.set_system_flag("scraper_paused", True)
    await asyncio.sleep(get_scraper_config()["error_retry_delay"])


async def main():
    logger.info("Starting periodic collection loop")
    db_manager = ScraperDatabaseManager()
    db_manager.set_system_flag("scraper_paused", False)
    icps = []
    current_tasks = []

    while True:
        try:
            icps = await run_collection_cycle(db_manager, icps, current_tasks)
            await sleep_until_next_cycle(db_manager)
        except Exception as e:
            await handle_main_loop_error(e, db_manager)


if __name__ == "__main__":
    asyncio.run(main())
