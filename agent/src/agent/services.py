import asyncio
import json
import logging
from typing import List
from .agents import agent, keyword_agent, subreddit_agent, icp_agent, lead_reviewer_agent, reply_generation_agent
from ..dtos.server_dtos import LeadIntentResponse, KeywordResponse, SubredditResponse, ICPResponse

logger = logging.getLogger(__name__)

async def score_lead_intent_initial(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }

    prompt = json.dumps(prompt_data)

    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent.run(prompt), timeout=10.0)
            logger.info(f"Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
            
            # Convert new detailed response to extended DTO format
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category=result.output.category,
                justification=result.output.overall_assessment,
                lead_quality=result.output.final_score,
                pain_points=result.output.pain_points,
                suggested_engagement="", 
                category=result.output.category,
                final_score=result.output.final_score,
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
                ),
                overall_assessment=result.output.overall_assessment
            )
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(f"Agent run timed out after 10 seconds for post: {post_title[:50]}... (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Agent run timed out after 10 seconds for post: {post_title[:50]}... (final attempt)")
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification="Agent run timed out after 10 seconds on both attempts, unable to score properly.",
                lead_quality=1,
                pain_points="Unable to identify due to timeout",
                suggested_engagement="No engagement recommended due to timeout",
                category="never_interested",
                final_score=1,
                factor_scores=FactorScores(
                    product_fit=0,
                    intent_signals=0,
                    urgency_indicators=0,
                    decision_authority=0,
                    engagement_quality=0
                ),
                factor_justifications=FactorJustifications(
                    product_fit="Unable to assess due to timeout",
                    intent_signals="Unable to assess due to timeout",
                    urgency_indicators="Unable to assess due to timeout",
                    decision_authority="Unable to assess due to timeout",
                    engagement_quality="Unable to assess due to timeout"
                ),
                overall_assessment="Agent run timed out, unable to properly assess lead quality"
            )
        except Exception as e:
            if attempt == 0:
                logger.warning(f"Error during agent run for post '{post_title[:50]}...': {e} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Error during agent run for post '{post_title[:50]}...': {e} (final attempt)")
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification=f"Error occurred during scoring on both attempts: {str(e)[:100]}",
                lead_quality=1,
                pain_points="Unable to identify due to error",
                suggested_engagement="No engagement recommended due to error",
                category="never_interested",
                final_score=1,
                factor_scores=FactorScores(
                    product_fit=0,
                    intent_signals=0,
                    urgency_indicators=0,
                    decision_authority=0,
                    engagement_quality=0
                ),
                factor_justifications=FactorJustifications(
                    product_fit="Unable to assess due to error",
                    intent_signals="Unable to assess due to error",
                    urgency_indicators="Unable to assess due to error",
                    decision_authority="Unable to assess due to error",
                    engagement_quality="Unable to assess due to error"
                ),
                overall_assessment=f"Error occurred during scoring: {str(e)[:100]}"
            )

async def score_lead_intent_detailed(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    """Use the better model for detailed scoring of promising leads"""
    prompt_data = {
        "icp_description": icp_description,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }

    prompt = json.dumps(prompt_data)

    for attempt in range(2):
        try:
            result = await asyncio.wait_for(lead_reviewer_agent.run(prompt), timeout=10.0)
            logger.info(f"Detailed scoring - Post title: {post_title} | Post content: {post_content} | Classified as: {result.output.category}")
            
            # Convert new detailed response to extended DTO format
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category=result.output.category,
                justification=result.output.overall_assessment,
                lead_quality=result.output.final_score,
                pain_points=result.output.pain_points,
                suggested_engagement="", 
                category=result.output.category,
                final_score=result.output.final_score,
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
                ),
                overall_assessment=result.output.overall_assessment
            )
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(f"Detailed scoring timed out after 10 seconds for post: {post_title[:50]}... (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Detailed scoring timed out after 10 seconds for post: {post_title[:50]}... (final attempt)")
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification="Detailed scoring timed out after 10 seconds on both attempts, unable to score properly.",
                lead_quality=1,
                pain_points="Unable to identify due to timeout",
                suggested_engagement="No engagement recommended due to timeout",
                category="never_interested",
                final_score=1,
                factor_scores=FactorScores(
                    product_fit=0,
                    intent_signals=0,
                    urgency_indicators=0,
                    decision_authority=0,
                    engagement_quality=0
                ),
                factor_justifications=FactorJustifications(
                    product_fit="Unable to assess due to timeout",
                    intent_signals="Unable to assess due to timeout",
                    urgency_indicators="Unable to assess due to timeout",
                    decision_authority="Unable to assess due to timeout",
                    engagement_quality="Unable to assess due to timeout"
                ),
                overall_assessment="Detailed scoring timed out, unable to properly assess lead quality"
            )
        except Exception as e:
            if attempt == 0:
                logger.warning(f"Error during detailed scoring for post '{post_title[:50]}...': {e} (attempt {attempt + 1}/2)")
                continue
            logger.error(f"Error during detailed scoring for post '{post_title[:50]}...': {e} (final attempt)")
            from ..dtos.server_dtos import FactorScores, FactorJustifications
            return LeadIntentResponse(
                buying_intent_category="never_interested",
                justification=f"Error occurred during detailed scoring on both attempts: {str(e)[:100]}",
                lead_quality=1,
                pain_points="Unable to identify due to error",
                suggested_engagement="No engagement recommended due to error",
                category="never_interested",
                final_score=1,
                factor_scores=FactorScores(
                    product_fit=0,
                    intent_signals=0,
                    urgency_indicators=0,
                    decision_authority=0,
                    engagement_quality=0
                ),
                factor_justifications=FactorJustifications(
                    product_fit="Unable to assess due to error",
                    intent_signals="Unable to assess due to error",
                    urgency_indicators="Unable to assess due to error",
                    decision_authority="Unable to assess due to error",
                    engagement_quality="Unable to assess due to error"
                ),
                overall_assessment=f"Error occurred during detailed scoring: {str(e)[:100]}"
            )

async def score_lead_intent_two_stage(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    """Two-stage lead scoring: fast model for initial filtering, better model for detailed scoring"""
    
    # Stage 1: Initial scoring with fast model
    initial_result = await score_lead_intent_initial(post_title, post_content, icp_description)
    logger.info(f"Two-stage scoring - Initial: {initial_result.final_score} for '{post_title[:50]}'")
    
    # Stage 2: Only use better model if initial score > 30
    if initial_result.final_score > 30:
        detailed_result = await score_lead_intent_detailed(post_title, post_content, icp_description)
        logger.info(f"Two-stage scoring - Detailed: {detailed_result.final_score} for '{post_title[:50]}'")
        return detailed_result
    else:
        logger.info(f"Two-stage scoring - Skipping detailed scoring for '{post_title[:50]}' (initial score: {initial_result.final_score})")
        return initial_result

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