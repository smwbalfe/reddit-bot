import json
import logging
from typing import List, Tuple
from collections import Counter
import asyncpraw
from ..agents.agents import keyword_generation_agent, subreddit_relevance_agent
from ..agent.agent_services import run_agent
from ..reddit.client import RedditClient

logger = logging.getLogger(__name__)


async def extract_keywords(page_description: str, count: int = 10) -> List[str]:
    prompt_data = {"count": count, "icp_description": page_description}
    prompt = json.dumps(prompt_data)

    result = await run_agent(
        keyword_generation_agent.run,
        prompt,
        "Keyword extraction",
        timeout=15.0,
        default_return=None,
        context=page_description,
    )

    print(result.output.keywords)

    if result is None:
        return []

    logger.info(
        f"Extracted {len(result.output.keywords)} keywords from content: {page_description[:100]}..."
    )

    return result.output.keywords


async def find_relevant_subreddits_from_keywords(
    reddit: RedditClient,
    keywords: List[str],
    limit: int = 10,
    min_subscribers: int = 10000,
) -> List[Tuple[str, int, int, str]]:
    print(keywords)

    subreddit_counts = Counter()
    subreddit_subscribers = {}
    subreddit_descriptions = {}

    for keyword in keywords:
        async for subreddit in reddit.get_client().subreddits.search(
            keyword, limit=limit
        ):
            if subreddit.subscribers and subreddit.subscribers >= min_subscribers:
                subreddit_counts[subreddit.display_name] += 1
                subreddit_subscribers[subreddit.display_name] = (
                    subreddit.subscribers
                )
                subreddit_descriptions[subreddit.display_name] = (
                    subreddit.public_description or ""
                )

    top_subreddits = [
        (name, count, subreddit_subscribers[name], subreddit_descriptions[name])
        for name, count in subreddit_counts.most_common(25)
    ]
    top_5 = top_subreddits[:20]

    for name, count, subscribers, description in top_5:
        print(f"r/{name} - {subscribers} subscribers ({count} keyword matches)")
    return sorted(top_subreddits, key=lambda x: x[1], reverse=True)

async def find_relevant_subreddits_by_keywords(description: str) -> List[str]:
    keywords = await extract_keywords(description)
    reddit_client = RedditClient()
    
    try:
        subreddit_pool = await find_relevant_subreddits_from_keywords(
            reddit_client, keywords, limit=50
        )

        prompt_data = {
            "business_description": description,
            "subreddits": subreddit_pool,
        }

        prompt = json.dumps(prompt_data)

        relevant_subreddits = await run_agent(
            subreddit_relevance_agent.run,
            prompt,
            "Subreddit relevance filtering",
            timeout=15.0,
            default_return=None,
            context="keyword-based discovery",
        )

        if relevant_subreddits is None:
            logger.error("Agent returned None for subreddit relevance filtering")
            return []

        return relevant_subreddits.output.relevant_subreddits

    except asyncpraw.exceptions.ResponseException as e:
        if e.response.status_code == 403:
            logger.error(f"403 Forbidden error during keyword-based subreddit discovery")
            logger.error(f"403 Reason: {e.response.reason}")
            logger.error(f"403 Response text: {e.response.text}")
            print(f"403 Forbidden - Reason: {e.response.reason}")
            print(f"Response: {e.response.text}")
        else:
            logger.error(f"HTTP {e.response.status_code} error during keyword-based subreddit discovery: {e}")
        return []
    except Exception as e:
        logger.error(f"Error during keyword-based subreddit discovery: {e}")
        return []
    finally:
        # Always close the Reddit client to prevent unclosed session warnings
        await reddit_client.close()
