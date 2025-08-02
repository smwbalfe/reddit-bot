import asyncio
import json
import logging
from typing import List, Callable, Any
from .agents import lead_score_agent_strong, keyword_generation_agent, subreddit_generation_agent, icp_description_agent
from ..models import FactorScores, FactorJustifications, ServerLeadIntentResponse

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

async def score_lead_intent_initial(post_title: str, post_content: str, icp_description: str) -> ServerLeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }
    prompt = json.dumps(prompt_data)
    
    try:
        result = await _run_with_retry_and_timeout(lead_score_agent_strong.run, prompt, 10.0, "Agent run", post_title)
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

async def score_lead_intent_two_stage(post_title: str, post_content: str, icp_description: str) -> ServerLeadIntentResponse:
    initial_result = await score_lead_intent_initial(post_title, post_content, icp_description)
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

async def find_relevant_subreddits(description: str, count: int = 20) -> List[str]:
    try:
        prompt = f"Product description: {description}\nFind {count} relevant subreddits."
        result = await asyncio.wait_for(subreddit_generation_agent.run(prompt), timeout=15.0)
        logger.info(f"Found {len(result.output.subreddits)} subreddits for description: {description[:100]}...")
        return result.output.subreddits
    except asyncio.TimeoutError:
        logger.error(f"Subreddit discovery timed out after 15 seconds for description: {description[:50]}...")
        return []
    except Exception as e:
        logger.error(f"Error during subreddit discovery for description '{description[:50]}...': {e}")
        return []

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
