import json
import logging
from typing import List, Tuple
from collections import Counter
from server.agents.agents import keyword_generation_agent, subreddit_relevance_agent
from shared.agent.agent_services import run_agent
from shared.reddit.client import RedditClient

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
    try:
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
        top_5 = top_subreddits[:5]
        print("Top 5 subreddits found:")
        for name, count, subscribers, description in top_5:
            print(f"r/{name} - {subscribers} subscribers ({count} keyword matches)")
        return sorted(top_subreddits, key=lambda x: x[1], reverse=True)

    except Exception as e:
        logger.error(f"Error searching subreddits for keywords {keywords}: {e}")
        return []


async def find_relevant_subreddits_by_keywords(description: str) -> List[str]:
    keywords = await extract_keywords(description)
    try:
        reddit_client = RedditClient()

        subreddit_pool = await find_relevant_subreddits_from_keywords(
            reddit_client, keywords, limit=20
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

        return relevant_subreddits.output.relevant_subreddits

    except Exception as e:
        logger.error(f"Error during keyword-based subreddit discovery: {e}")
        return []
