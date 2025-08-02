from pydantic import BaseModel
from typing import Optional, List
from .agent_models import FactorScores, FactorJustifications


class KeywordRequest(BaseModel):
    description: str
    count: Optional[int] = 30


class KeywordFromUrlRequest(BaseModel):
    url: str
    count: Optional[int] = 30


class SubredditRequest(BaseModel):
    description: str
    count: Optional[int] = 20


class AnalyzeUrlRequest(BaseModel):
    url: str
    keyword_count: Optional[int] = 15
    subreddit_count: Optional[int] = 20


class AnalyzeUrlResponse(BaseModel):
    keywords: List[str]
    subreddits: List[str]
    icp_description: str



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