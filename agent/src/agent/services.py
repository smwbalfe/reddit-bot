import asyncio
import json
import logging
from typing import List, Callable, Any, Set, Dict, Tuple
from collections import Counter
from .agents import lead_score_agent_strong, keyword_generation_agent, lead_score_agent_weak, subreddit_generation_agent, icp_description_agent, pain_points_agent, subreddit_relevance_agent, icp_pain_points_combined_agent, reply_generation_agent
from ..models import FactorScores, FactorJustifications, ServerLeadIntentResponse
from ..reddit.client import RedditClient

logger = logging.getLogger(__name__)

async def run_agent(agent_func: Callable, prompt: str, operation_name: str, timeout: float = 15.0, default_return: Any = None, context: str = "") -> Any:
    """Centralized agent runner with retry logic, timeout handling, and error management."""
    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent_func(prompt), timeout=timeout)
            logger.info(f"{operation_name} completed successfully{f' for {context[:50]}...' if context else ''}")
            return result
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(f"{operation_name} timed out after {timeout}s{f' for {context[:50]}...' if context else ''} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"{operation_name} timed out after {timeout}s{f' for {context[:50]}...' if context else ''} (final attempt)")
            return default_return
        except Exception as e:
            if attempt == 0:
                logger.warning(f"Error during {operation_name.lower()}{f' for {context[:50]}...' if context else ''}: {e} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Error during {operation_name.lower()}{f' for {context[:50]}...' if context else ''}: {e} (final attempt)")
            return default_return

def _create_error_response(reason: str) -> ServerLeadIntentResponse:
    return ServerLeadIntentResponse(
        lead_quality=None,
        pain_points=f"Unable to identify due to {reason}",
        factor_scores=None,
        factor_justifications=None
    )

def _create_response_from_result(result) -> ServerLeadIntentResponse:
    return ServerLeadIntentResponse(
        lead_quality=result.output.final_score,
        pain_points=result.output.pain_points,
        factor_scores=FactorScores(
            product_fit=result.output.factor_scores.product_fit,
            intent_signals=result.output.factor_scores.intent_signals,
            urgency_indicators=result.output.factor_scores.urgency_indicators,
            decision_authority=result.output.factor_scores.decision_authority,
            engagement_quality=result.output.factor_scores.engagement_quality
        ),
        factor_justifications=FactorJustifications(
            product_fit=result.output.factor_justifications.product_fit,
            intent_signals=result.output.factor_justifications.intent_signals,
            urgency_indicators=result.output.factor_justifications.urgency_indicators,
            decision_authority=result.output.factor_justifications.decision_authority,
            engagement_quality=result.output.factor_justifications.engagement_quality
        )
    )

async def score_lead_intent_initial(post_title: str, post_content: str, icp_description: str, icp_pain_points: str) -> ServerLeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "icp_pain_points": icp_pain_points,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
        "icp_pain_points": icp_pain_points
    }
    prompt = json.dumps(prompt_data)
    
    result = await run_agent(
        lead_score_agent_weak.run, 
        prompt, 
        "Initial lead scoring", 
        timeout=10.0,
        default_return=None,
        context=post_title
    )
    
    if result is None:
        return _create_error_response("timeout or error")
    
    logger.info(f"Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
    return _create_response_from_result(result)

async def score_lead_intent_detailed(post_title: str, post_content: str, icp_description: str) -> ServerLeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }
    prompt = json.dumps(prompt_data)
    
    result = await run_agent(
        lead_score_agent_strong.run,
        prompt,
        "Detailed lead scoring",
        timeout=10.0,
        default_return=None,
        context=post_title
    )
    
    if result is None:
        return _create_error_response("timeout or error")
        
    logger.info(f"Detailed scoring - Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
    return _create_response_from_result(result)

async def score_lead_intent_two_stage(post_title: str, post_content: str, icp_description: str, icp_pain_points: str) -> ServerLeadIntentResponse:
    initial_result = await score_lead_intent_initial(post_title, post_content, icp_description, icp_pain_points)
    logger.info(f"Two-stage scoring - Initial: {initial_result.lead_quality} for '{post_title[:50]}'")
    
    if initial_result.lead_quality > 30:
        detailed_result = await score_lead_intent_detailed(post_title, post_content, icp_description)
        logger.info(f"Two-stage scoring - Detailed: {detailed_result.lead_quality} for '{post_title[:50]}'")
        return detailed_result
    else:
        logger.info(f"Two-stage scoring - Skipping detailed scoring for '{post_title[:50]}' (initial score: {initial_result.lead_quality})")
        return initial_result

async def extract_keywords(page_description: str, count: int = 10) -> List[str]:
    prompt_data = {
        "count": count,
        "icp_description": page_description
    }
    prompt = json.dumps(prompt_data)
    
    result = await run_agent(
        keyword_generation_agent.run,
        prompt,
        "Keyword extraction",
        timeout=15.0,
        default_return=None,
        context=page_description
    )

    print(result.output.keywords)
    
    if result is None:
        return []
        
    logger.info(f"Extracted {len(result.output.keywords)} keywords from content: {page_description[:100]}...")

    return result.output.keywords

async def find_relevant_subreddits_by_keywords(keywords: List[str], description: str, count: int = 20) -> List[str]:
  
    try:
        reddit_client = RedditClient()
       
        subreddit_pool = await find_relevant_subreddits_from_keywords(reddit_client, keywords, limit=20)

        prompt_data = {
            "business_description": description,
            "subreddits": subreddit_pool
        }

        prompt = json.dumps(prompt_data)

        relevant_subreddits = await run_agent(
            subreddit_relevance_agent.run,
            prompt,
            "Subreddit relevance filtering",
            timeout=15.0,
            default_return=None,
            context="keyword-based discovery"
        )
        
        return relevant_subreddits.output.relevant_subreddits
        
    except Exception as e:
        logger.error(f"Error during keyword-based subreddit discovery: {e}")
        return []


async def generate_icp_and_pain_points_combined(html_content: str) -> tuple[str, str]:
    """Combined function to generate ICP description and extract pain points in one call"""
    result = await run_agent(
        icp_pain_points_combined_agent.run,
        html_content,
        "ICP description and pain points extraction",
        timeout=20.0,
        default_return=None,
        context=html_content
    )
    
    if result is None:
        return ("Unable to generate ICP description due to timeout or error", 
                "Unable to extract pain points due to timeout or error")
        
    logger.info(f"Generated ICP description and pain points from content: {html_content[:100]}...")
    return result.output.icp_description, result.output.pain_points

async def find_relevant_subreddits_from_keywords(reddit: RedditClient, keywords: List[str], limit: int = 10, min_subscribers: int = 10000) -> List[Tuple[str, int, int, str]]:
    print(keywords)
    try:
        subreddit_counts = Counter()
        subreddit_subscribers = {}
        subreddit_descriptions = {}

        for keyword in keywords:
            async for subreddit in reddit.get_client().subreddits.search(keyword, limit=limit):
                if subreddit.subscribers and subreddit.subscribers >= min_subscribers:
                    subreddit_counts[subreddit.display_name] += 1
                    subreddit_subscribers[subreddit.display_name] = subreddit.subscribers
                    subreddit_descriptions[subreddit.display_name] = subreddit.public_description or ""

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


async def generate_reddit_reply(reddit_post: str, product_description: str) -> str:
    """Generate a Reddit reply based on a post and product description"""
    prompt_data = {
        "reddit_post": reddit_post,
        "product_description": product_description
    }
    prompt = json.dumps(prompt_data)
    
    result = await run_agent(
        reply_generation_agent.run,
        prompt,
        "Reddit reply generation",
        timeout=20.0,
        default_return=None,
        context=reddit_post[:100]
    )
    
    if result is None:
        return "Unable to generate reply due to timeout or error"
        
    logger.info(f"Generated reply for post: {reddit_post[:100]}...")
    return result.output.reply
