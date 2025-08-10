from pydantic import BaseModel
from typing import Optional, List
from .agent_models import FactorScores, FactorJustifications


class KeywordRequest(BaseModel):
    description: str
    count: Optional[int] = 30


class KeywordFromUrlRequest(BaseModel):
    url: str
    count: Optional[int] = 30


class AnalyzeUrlRequest(BaseModel):
    url: str


class AnalyzeUrlResponse(BaseModel):
    subreddits: List[str]
    icp_description: str
    pain_points: str


class ICPConfigChangeRequest(BaseModel):
    action: str
    icp_id: Optional[int] = None
    user_id: str


class LeadIntentResponse(BaseModel):
    lead_quality: Optional[int] = None
    pain_points: Optional[str] = None
    factor_scores: Optional[FactorScores] = None
    factor_justifications: Optional[FactorJustifications] = None


class ICPConfigChangeResponse(BaseModel):
    success: bool
    message: str


class GenerateSuggestionsRequest(BaseModel):
    description: str
    pain_points: str


class GenerateSuggestionsResponse(BaseModel):
    subreddits: List[str]


class GenerateReplyRequest(BaseModel):
    reddit_post: str
    product_description: str


class GenerateReplyResponse(BaseModel):
    reply: str


class UsageStatsRequest(BaseModel):
    user_id: str


class UsageStatsResponse(BaseModel):
    monthly_qualified_leads: int
    monthly_lead_limit: int
    is_subscribed: bool
