import asyncio
import json
import logging
from typing import List, Callable, Any
from .agents import lead_score_agent_strong, keyword_generation_agent, lead_score_agent_weak, subreddit_generation_agent, icp_description_agent, pain_points_agent, subreddit_relevance_agent
from ..models import FactorScores, FactorJustifications, ServerLeadIntentResponse
from ..reddit.client import RedditClient

logger = logging.getLogger(__name__)

async def _run_with_retry_and_timeout(agent_func: Callable, prompt: str, timeout: float, operation_name: str, post_title: str) -> Any:
    """Helper function to run agent with retry logic and timeout handling."""
    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent_func(prompt), timeout=timeout)
            return result
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(f"{operation_name} timed out after {timeout} seconds for post: {post_title[:50]}... (attempt {attempt + 1}/2)")
                continue
            logger.error(f"{operation_name} timed out after {timeout} seconds for post: {post_title[:50]}... (final attempt)")
            raise
        except Exception as e:
            if attempt == 0:
                logger.warning(f"Error during {operation_name.lower()} for post '{post_title[:50]}...': {e} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Error during {operation_name.lower()} for post '{post_title[:50]}...': {e} (final attempt)")
            raise

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
    
    try:
        result = await _run_with_retry_and_timeout(lead_score_agent_weak.run, prompt, 10.0, "Agent run", post_title)
        logger.info(f"Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
        return _create_response_from_result(result)
    except asyncio.TimeoutError:
        return _create_error_response("timeout")
    except Exception as e:
        return _create_error_response("error")

async def score_lead_intent_detailed(post_title: str, post_content: str, icp_description: str) -> ServerLeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }
    prompt = json.dumps(prompt_data)
    
    try:
        result = await _run_with_retry_and_timeout(lead_score_agent_strong.run, prompt, 10.0, "Detailed scoring", post_title)
        logger.info(f"Detailed scoring - Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
        return _create_response_from_result(result)
    except asyncio.TimeoutError:
        return _create_error_response("timeout")
    except Exception:
        return _create_error_response("error")

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

async def extract_keywords(page_content: str, count: int = 30) -> List[str]:
    prompt_data = {
        "count": count,
        "page_content": page_content
    }
    prompt = json.dumps(prompt_data)
    try:
        result = await asyncio.wait_for(keyword_generation_agent.run(prompt), timeout=15.0)
        logger.info(f"Extracted {len(result.output.keywords)} keywords from content: {page_content[:100]}...")
        return result.output.keywords
    except asyncio.TimeoutError:
        logger.error(f"Keyword extraction timed out after 15 seconds for content: {page_content[:50]}...")
        return []
    except Exception as e:
        logger.error(f"Error during keyword extraction for content '{page_content[:50]}...': {e}")
        return []

async def find_relevant_subreddits_by_keywords(keywords: List[str], original_content: str, count: int = 20) -> List[str]:
    try:
        all_subreddits = set()
        
        for keyword in keywords[:10]:
            subreddits = await search_subreddits_by_keyword(keyword, limit=20)
            all_subreddits.update(subreddits)
            
            if len(all_subreddits) >= count * 3:
                break
        
        logger.info(f"Found {len(all_subreddits)} total subreddits from {len(keywords)} keywords")
        
        prompt_data = {
            "original_content": original_content,
            "subreddit_candidates": list(all_subreddits)
        }
        prompt = json.dumps(prompt_data)
        
        result = await asyncio.wait_for(subreddit_relevance_agent.run(prompt), timeout=15.0)
        relevant_subreddits = result.output.relevant_subreddits
        
        logger.info(f"AI filtered to {len(relevant_subreddits)} relevant subreddits")
        return relevant_subreddits[:count]
        
    except asyncio.TimeoutError:
        logger.error(f"Keyword-based subreddit discovery timed out after 15 seconds")
        return []
    except Exception as e:
        logger.error(f"Error during keyword-based subreddit discovery: {e}")
        return []

async def find_relevant_subreddits(description: str, count: int = 20) -> List[str]:
    reddit_client = None
    try:
        prompt = f"Product description: {description}\nFind {count * 2} relevant subreddits."
        result = await asyncio.wait_for(subreddit_generation_agent.run(prompt), timeout=15.0)
        generated_subreddits = [subreddit.replace("r/", "") for subreddit in result.output.subreddits]
        logger.info(f"Generated {len(generated_subreddits)} subreddits for description: {description[:100]}...")
        
        reddit_client = RedditClient()
        valid_subreddits = []
        
        for subreddit in generated_subreddits:
            if await check_subreddit_exists(subreddit, reddit_client):
                valid_subreddits.append(subreddit)
                if len(valid_subreddits) >= count:
                    break
            else:
                logger.info(f"Invalid subreddit filtered out: {subreddit}")
        
        logger.info(f"Validated {len(valid_subreddits)} out of {len(generated_subreddits)} generated subreddits")
        return valid_subreddits[:count]
    except asyncio.TimeoutError:
        logger.error(f"Subreddit discovery timed out after 15 seconds for description: {description[:50]}...")
        return []
    except Exception as e:
        logger.error(f"Error during subreddit discovery for description '{description[:50]}...': {e}")
        return []
    finally:
        if reddit_client and hasattr(reddit_client, '_reddit') and reddit_client._reddit:
            await reddit_client._reddit.close()

async def generate_icp_description(html_content: str) -> str:
    try:
        result = await asyncio.wait_for(icp_description_agent.run(html_content), timeout=15.0)
        logger.info(f"Generated ICP description from content: {html_content[:100]}...")
        return result.output.icp_description
    except asyncio.TimeoutError:
        logger.error(f"ICP description generation timed out after 15 seconds for content: {html_content[:50]}...")
        return "Unable to generate ICP description due to timeout"
    except Exception as e:
        logger.error(f"Error during ICP description generation for content '{html_content[:50]}...': {e}")
        return f"Unable to generate ICP description due to error: {str(e)}"

async def extract_pain_points(html_content: str) -> str:
    try:
        result = await asyncio.wait_for(pain_points_agent.run(html_content), timeout=15.0)
        logger.info(f"Extracted pain points from content: {html_content[:100]}...")
        return result.output.pain_points
    except asyncio.TimeoutError:
        logger.error(f"Pain points extraction timed out after 15 seconds for content: {html_content[:50]}...")
        return "Unable to extract pain points due to timeout"
    except Exception as e:
        logger.error(f"Error during pain points extraction for content '{html_content[:50]}...': {e}")
        return f"Unable to extract pain points due to error: {str(e)}"

async def search_subreddits_by_keyword(keyword: str, limit: int = 30) -> List[str]:
    """Search Reddit for subreddits using a keyword and return list of subreddit names."""
    reddit_client = RedditClient()
    reddit = reddit_client.get_client()
    
    try:
        subreddits = []
        async for subreddit in reddit.subreddits.search(keyword, limit=limit):
            subreddits.append(subreddit.display_name)
        
        return subreddits
        
    except Exception as e:
        logger.error(f"Error searching subreddits for keyword '{keyword}': {e}")
        return []
    finally:
        await reddit.close()

async def check_subreddit_exists(subreddit_name: str, reddit_client) -> bool:
    """Check if a subreddit exists using PRAW. Logs and returns False if it doesn't exist."""
    try:
        subreddit = await reddit_client.get_subreddit(subreddit_name)
        await subreddit.load()
        return True
    except Exception:
        logger.warning(f"Subreddit '{subreddit_name}' does not exist or is inaccessible")
        return False
