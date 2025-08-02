from pydantic import BaseModel
from typing import Optional, List

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

class FactorScores(BaseModel):
    product_fit: Optional[int] = None
    intent_signals: Optional[int] = None
    urgency_indicators: Optional[int] = None
    decision_authority: Optional[int] = None
    engagement_quality: Optional[int] = None

class FactorJustifications(BaseModel):
    product_fit: Optional[str] = None
    intent_signals: Optional[str] = None
    urgency_indicators: Optional[str] = None
    decision_authority: Optional[str] = None
    engagement_quality: Optional[str] = None

class LeadIntentResponse(BaseModel):
    lead_quality: Optional[int] = None
    pain_points: Optional[str] = None
    factor_scores: Optional[FactorScores] = None
    factor_justifications: Optional[FactorJustifications] = None


class KeywordResponse(BaseModel):
    keywords: List[str]

class SubredditResponse(BaseModel):
    subreddits: List[str]

class ICPResponse(BaseModel):
    icp_description: str

class GenerateReplyRequest(BaseModel):
    post_title: str
    post_content: str
    subreddit: str
    product_name: str
    product_description: str
    product_website: str

class GenerateReplyResponse(BaseModel):
    reply: str

class ICPConfigChangeRequest(BaseModel):
    action: str
    icp_id: Optional[int] = None
    user_id: str

class ICPConfigChangeResponse(BaseModel):
    success: bool
    message: str