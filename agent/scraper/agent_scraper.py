import asyncio
from datetime import datetime
from typing import Set
from scraper.db.db import ScraperDatabaseManager
from shared.reddit.client import RedditClient
from shared.models.db_models import ICPModel
from scraper.lead_scoring.lead_scoring_service import score_lead_intent_two_stage
from asyncpraw.models import Submission

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent_scraper")

COLLECTION_INTERVAL = 1
CONFIDENCE_THRESHOLD = 30
INITIAL_SEEDING_POSTS_PER_SUBREDDIT = 50


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


def should_process_post(post: Submission, db_manager: ScraperDatabaseManager) -> bool:
    exists = db_manager.post_exists(post.id)
    if exists:
        logger.info(f"Post {post.id} already exists, skipping")
    return not exists


async def process_post_for_icp(
    post: Submission,
    icp: ICPModel,
    db_manager: ScraperDatabaseManager,
    threshold: int = CONFIDENCE_THRESHOLD,
):
    try:
        result = await score_post(post, icp)
        if result.final_score <= threshold:
            logger.info(
                f"Post {post.id} scored {result.final_score}, skipping (<={threshold})"
            )
            return
            
        if not db_manager.can_user_add_lead(icp.userId):
            logger.info(
                f"User {icp.userId} has reached lead limit for this month, skipping post {post.id}"
            )
            return
            
        post_data = build_post_data(post, icp, result)
        logger.info(f"Inserting post {post.id} with lead_quality {result.final_score}")
        db_manager.insert_reddit_post(post_data)
        db_manager.increment_user_qualified_leads(icp.userId)
        
    except Exception as e:
        logger.warning(
            f"Exception processing post {getattr(post, 'id', None)} for ICP {icp.id}: {e}"
        )


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


async def collect_initial_posts(
    icp: ICPModel,
    subreddits: Set[str],
    reddit_client: RedditClient,
    db_manager: ScraperDatabaseManager,
):
    logger.info(
        f"Initial seeding for ICP {icp.id} - collecting {INITIAL_SEEDING_POSTS_PER_SUBREDDIT} posts per subreddit"
    )

    for subreddit_name in subreddits:
        logger.info(f"Initial seeding from subreddit: {subreddit_name}")
        posts_collected = 0

        try:
            individual_subreddit = await reddit_client.get_subreddit(subreddit_name)
            async for submission in individual_subreddit.hot(
                limit=INITIAL_SEEDING_POSTS_PER_SUBREDDIT * 2
            ):
                if posts_collected >= INITIAL_SEEDING_POSTS_PER_SUBREDDIT:
                    break

                if db_manager.get_system_flag("scraper_refresh_needed"):
                    logger.info(
                        f"Refresh flag detected - stopping initial seeding for ICP {icp.id}"
                    )
                    return

                if should_process_post(submission, db_manager):
                    await process_post_for_icp(
                        submission, icp, db_manager, threshold=1
                    )
                    posts_collected += 1

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
):
    logger.info(f"Collecting new posts for ICP {icp.id}")
    
    if not db_manager.can_user_add_lead(icp.userId):
        logger.info(
            f"User {icp.userId} has reached lead limit - skipping stream for ICP {icp.id}"
        )
        return
    
    subreddit_string = "+".join(subreddits)
    current_subreddit = await reddit_client.get_subreddit(subreddit_string)

    try:
        async for submission in current_subreddit.new(limit=None):
            try:
                if asyncio.current_task().cancelled():
                    logger.info(f"Task cancelled for ICP {icp.id}")
                    break

                if db_manager.get_system_flag("scraper_refresh_needed"):
                    logger.info(
                        f"Refresh flag detected - cancelling stream for ICP {icp.id}"
                    )
                    break

                if should_process_post(submission, db_manager):
                    logger.info(f"Processing post {submission.id} for ICP {icp.id}")
                    await process_post_for_icp(submission, icp, db_manager)

            except asyncio.CancelledError:
                logger.info(f"Collection task cancelled for ICP {icp.id}")
                raise
            except Exception as e:
                logger.warning(
                    f"Exception processing submission {getattr(submission, 'id', 'unknown')} for ICP {icp.id}: {e}"
                )
                continue

    except asyncio.CancelledError:
        logger.info(f"Collection cancelled for ICP {icp.id}")
        raise
    except Exception as e:
        logger.warning(f"Exception collecting new posts for ICP {icp.id}: {e}")


async def main():
    logger.info("Starting periodic collection loop")
    db_manager = ScraperDatabaseManager()
    icps = []
    current_tasks = []

    while True:
        try:
            if db_manager.get_system_flag("scraper_refresh_needed") or not icps:
                logger.info(
                    "Scraper refresh flag detected - stopping all current tasks"
                )
                if current_tasks:
                    logger.info(f"Cancelling {len(current_tasks)} running tasks")
                    for task in current_tasks:
                        if not task.done():
                            task.cancel()
                    await asyncio.gather(*current_tasks, return_exceptions=True)
                    logger.info("All tasks have been stopped")
                    current_tasks.clear()

                logger.info("Fetching fresh ICPs")
                icps = db_manager.get_icps()
                db_manager.set_system_flag("scraper_refresh_needed", False)
                logger.info(f"Loaded {len(icps)} ICPs")

            unseeded_icps = db_manager.get_unseeded_icps()
            if unseeded_icps:
                logger.info(
                    f"Found {len(unseeded_icps)} unseeded ICPs - starting initial seeding"
                )
                db_manager.set_initial_seeding_mode(True)

                for icp in unseeded_icps:
                    task = asyncio.create_task(
                        collect_posts_for_icp(icp, db_manager, is_initial_seeding=True)
                    )
                    current_tasks.append(task)

                logger.info(f"Starting initial seeding for {len(unseeded_icps)} ICPs")
                await asyncio.gather(*current_tasks, return_exceptions=True)
                current_tasks.clear()

                db_manager.set_initial_seeding_mode(False)
                logger.info("Initial seeding completed")

            logger.info("Starting regular collection cycle")
            if not icps:
                logger.info("No ICPs found")
            else:
                for icp in icps:
                    task = asyncio.create_task(
                        collect_posts_for_icp(icp, db_manager, is_initial_seeding=False)
                    )
                    current_tasks.append(task)
                logger.info(f"Starting regular collection for {len(icps)} ICPs")
                await asyncio.gather(*current_tasks, return_exceptions=True)
                logger.info("Collection cycle completed")
                current_tasks.clear()

            logger.info(f"Waiting {COLLECTION_INTERVAL} seconds until next cycle")
            await asyncio.sleep(COLLECTION_INTERVAL)

        except Exception as e:
            logger.warning(f"Exception in main loop: {e}")
            await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(main())
