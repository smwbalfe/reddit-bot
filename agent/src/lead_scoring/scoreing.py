from typing import Optional
from asyncpraw.models import Submission
from src.models.db_models import ICPModel
from src.models.agent_models import LeadIntentResponse
from src.lead_scoring.lead_scoring_service import score_lead_intent_two_stage
from src.utils.text_utils import condense_reddit_post
import logging

logger = logging.getLogger("scoreing")


async def score_post(post: Submission, icp: ICPModel) -> Optional[LeadIntentResponse]:
    post_content = post.selftext if post.selftext else ""
    condensed_content = condense_reddit_post(post.title, post_content)
    icp_description = icp.data.description if icp.data and icp.data.description else ""
    icp_pain_points = icp.data.painPoints if icp.data and icp.data.painPoints else ""
    logger.info(f"Scoring post {post.id}")
    return await score_lead_intent_two_stage(
        post_title=post.title,
        post_content=condensed_content,
        icp_description=icp_description,
        icp_pain_points=icp_pain_points,
        weak_agent_threshold=35,
    )
