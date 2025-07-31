import asyncio
import json
import logging
from typing import List
from .agents import agent, keyword_agent, subreddit_agent, icp_agent, lead_reviewer_agent, reply_generation_agent
from ..dtos.server_dtos import LeadIntentResponse, KeywordResponse, SubredditResponse, ICPResponse

logger = logging.getLogger(__name__)

async def score_lead_intent(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }

    prompt = json.dumps(prompt_data)

    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent.run(prompt), timeout=10.0)
            logger.info(f"Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.buying_intent_category}")
            return result.output
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(f"Agent run timed out after 10 seconds for post: {post_title[:50]}... (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Agent run timed out after 10 seconds for post: {post_title[:50]}... (final attempt)")
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification="Agent run timed out after 10 seconds on both attempts, unable to score properly.",
                lead_quality=1,
                pain_points="Unable to identify due to timeout",
            )
        except Exception as e:
            if attempt == 0:
                logger.warning(f"Error during agent run for post '{post_title[:50]}...': {e} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Error during agent run for post '{post_title[:50]}...': {e} (final attempt)")
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification=f"Error occurred during scoring on both attempts: {str(e)[:100]}",
                lead_quality=1,
                pain_points="Unable to identify due to error",
            )

async def extract_keywords(page_content: str, count: int = 30) -> List[str]:
    prompt_data = {
        "count": count,
        "page_content": page_content
    }

    prompt = json.dumps(prompt_data)

    try:
        result = await asyncio.wait_for(keyword_agent.run(prompt), timeout=15.0)
        logger.info(f"Extracted {len(result.output.keywords)} keywords from content: {page_content[:100]}...")
        return result.output.keywords
    except asyncio.TimeoutError:
        logger.error(f"Keyword extraction timed out after 15 seconds for content: {page_content[:50]}...")
        return []
    except Exception as e:
        logger.error(f"Error during keyword extraction for content '{page_content[:50]}...': {e}")
        return []

async def find_relevant_subreddits(description: str, count: int = 20) -> List[str]:
    """Find relevant subreddits for a product description using Gemini 2.5pro"""
    try:
        prompt = f"Product description: {description}\nFind {count} relevant subreddits."
        result = await asyncio.wait_for(subreddit_agent.run(prompt), timeout=15.0)
        logger.info(f"Found {len(result.output.subreddits)} subreddits for description: {description[:100]}...")
        return result.output.subreddits
    except asyncio.TimeoutError:
        logger.error(f"Subreddit discovery timed out after 15 seconds for description: {description[:50]}...")
        return []
    except Exception as e:
        logger.error(f"Error during subreddit discovery for description '{description[:50]}...': {e}")
        return []

async def generate_icp_description(html_content: str) -> str:
    """Generate ICP description from HTML content using Gemini 2.5pro"""
    try:
        result = await asyncio.wait_for(icp_agent.run(html_content), timeout=15.0)
        logger.info(f"Generated ICP description from content: {html_content[:100]}...")
        return result.output.icp_description
    except asyncio.TimeoutError:
        logger.error(f"ICP description generation timed out after 15 seconds for content: {html_content[:50]}...")
        return "Unable to generate ICP description due to timeout"
    except Exception as e:
        logger.error(f"Error during ICP description generation for content '{html_content[:50]}...': {e}")
        return f"Unable to generate ICP description due to error: {str(e)}"

async def review_lead_quality(post_title: str, post_content: str, icp_description: str, initial_result: LeadIntentResponse) -> bool:
    """Use Gemini Pro to perform final review of lead quality before storing"""
    review_data = {
        "post_title": post_title,
        "post_content": post_content,
        "icp_description": icp_description,
        "initial_score": initial_result.lead_quality,
        "initial_category": initial_result.buying_intent_category,
        "justification": initial_result.justification,
        "pain_points": initial_result.pain_points,
    }
    
    prompt = json.dumps(review_data)
    
    try:
        result = await asyncio.wait_for(lead_reviewer_agent.run(prompt), timeout=10.0)
        logger.info(f"Lead review for '{post_title[:50]}': {'APPROVED' if result.output else 'REJECTED'}")
        return result.output
    except asyncio.TimeoutError:
        logger.error(f"Lead review timed out after 10 seconds for post: {post_title[:50]}...")
        return False  # Reject if review fails
    except Exception as e:
        logger.error(f"Error during lead review for post '{post_title[:50]}...': {e}")
        return False  # Reject if review fails

async def generate_reply(post_title: str, post_content: str, subreddit: str, product_name: str, product_description: str, product_website: str) -> str:
    """Generate a personalized Reddit reply using the reply generation agent"""
    prompt_data = {
        "post_title": post_title,
        "post_content": post_content,
        "subreddit": subreddit,
        "product_name": product_name,
        "product_description": product_description,
        "product_website": product_website
    }
    
    prompt = json.dumps(prompt_data)
    
    try:
        result = await asyncio.wait_for(reply_generation_agent.run(prompt), timeout=15.0)
        logger.info(f"Generated reply for post: {post_title[:50]}...")
        return result.output.reply
    except asyncio.TimeoutError:
        logger.error(f"Reply generation timed out after 15 seconds for post: {post_title[:50]}...")
        return "Unable to generate reply due to timeout. Please try again."
    except Exception as e:
        logger.error(f"Error during reply generation for post '{post_title[:50]}...': {e}")
        return f"Unable to generate reply due to error: {str(e)}"