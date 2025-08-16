from datetime import datetime
from asyncpraw.models import Submission
from src.models.db_models import ICPModel


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
