import json
from typing import Optional
from ..models.agent_models import (
    LeadIntentResponse,
    FactorScores,
    FactorJustifications,
)
from src.lead_scoring.lead_scoring_agent import (
    lead_score_agent_weak,
    lead_score_agent_strong,
)
from ..agent.agent_services import run_agent


async def score_lead_intent_two_stage(
    post_title: str,
    post_content: str,
    icp_description: str,
    icp_pain_points: str,
    weak_agent_threshold: int = 35,
) -> Optional[LeadIntentResponse]:
    initial_result = await score_lead_intent_initial(
        post_title, post_content, icp_description, icp_pain_points
    )

    if not initial_result.final_score > weak_agent_threshold:
        return None

    detailed_result = await score_lead_intent_detailed(
        post_title, post_content, icp_description
    )
    return detailed_result


async def score_lead_intent_initial(
    post_title: str, post_content: str, icp_description: str, icp_pain_points: str
) -> LeadIntentResponse:
    prompt_data = {
        "icp_description": icp_description,
        "icp_pain_points": icp_pain_points,
        "reddit_post_title": post_title,
        "reddit_post_content": post_content,
    }
    prompt = json.dumps(prompt_data)

    result = await run_agent(
        lead_score_agent_weak.run,
        prompt,
        "Initial lead scoring",
        timeout=10.0,
        default_return=None,
        context=post_title,
    )

    if result is None:
        return _create_error_response("timeout or error")

    return _create_response_from_result(result)


async def score_lead_intent_detailed(
    post_title: str, post_content: str, icp_description: str
) -> LeadIntentResponse:
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
        context=post_title,
    )

    if result is None:
        return _create_error_response("timeout or error")

    return _create_response_from_result(result)


def _create_error_response(reason: str) -> LeadIntentResponse:
    return LeadIntentResponse(
        category="error",
        pain_points=f"Unable to identify due to {reason}",
        factor_scores=FactorScores(
            product_fit=1,
            intent_signals=1,
            urgency_indicators=1,
            decision_authority=1,
            engagement_quality=1,
        ),
        factor_justifications=FactorJustifications(
            product_fit="Error occurred during analysis",
            intent_signals="Error occurred during analysis",
            urgency_indicators="Error occurred during analysis",
            decision_authority="Error occurred during analysis",
            engagement_quality="Error occurred during analysis",
        ),
    )


def _create_response_from_result(result) -> LeadIntentResponse:
    return LeadIntentResponse(
        category=result.output.category,
        pain_points=result.output.pain_points,
        factor_scores=FactorScores(
            product_fit=result.output.factor_scores.product_fit,
            intent_signals=result.output.factor_scores.intent_signals,
            urgency_indicators=result.output.factor_scores.urgency_indicators,
            decision_authority=result.output.factor_scores.decision_authority,
            engagement_quality=result.output.factor_scores.engagement_quality,
        ),
        factor_justifications=FactorJustifications(
            product_fit=result.output.factor_justifications.product_fit,
            intent_signals=result.output.factor_justifications.intent_signals,
            urgency_indicators=result.output.factor_justifications.urgency_indicators,
            decision_authority=result.output.factor_justifications.decision_authority,
            engagement_quality=result.output.factor_justifications.engagement_quality,
        ),
    )
